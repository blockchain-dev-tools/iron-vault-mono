import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import '../core/interfaces/crypto_service.dart';
import '../core/models/apdu_message.dart';
import '../core/models/signature_record.dart';
import '../protocols/apdu/apdu_constants.dart';
import 'apdu_handler.dart';
import 'path_parser.dart';

/// Manages the BLE sign-request interception lifecycle.
///
/// Extracted from [AppState] to separate business logic from app
/// lifecycle / BLE I/O. Owns the state machine for:
///   1. Intercepting signing APDU commands
///   2. Holding pending requests for user confirmation
///   3. 60s timeout enforcement
///   4. Result storage after approve/reject/timeout
///
/// All crypto operations go through [ICryptoService] — never imports
/// [CryptoBridge] directly. Derivation path extraction delegates to
/// [PathParser.parsePathWithRemainder].
///
/// Callbacks:
///   [onRequestPending] — triggered when a new sign request is intercepted
///                        (caller should navigate to TransactionScreen).
///   [onRequestResolved] — triggered after approve, reject, or timeout
///                         (caller should navigate away from confirmation).
///
/// Usage:
/// ```dart
/// final sc = SignConfirmation(crypto: crypto, apduHandler: apduHandler);
/// sc.onRequestPending = () => router.go('/transaction');
/// sc.onRequestResolved = () => router.go('/');
///
/// // In BLE APDU dispatcher:
/// if (SignConfirmation.isSignCommand(cmd)) {
///   await sc.interceptSignCommand(cmd, seedHex);
///   return;
/// }
///
/// // On user approve:
/// await sc.approve(() {
///   final resp = apduHandler.handle(req.command);
///   final bytes = resp.toBytes();
///   ble.sendApduResponse(bytes);
///   return bytes;
/// });
/// ```
class SignConfirmation {
  final ICryptoService _crypto;
  final ApduHandler _apduHandler;

  /// Called when a new sign request needs user confirmation.
  /// The caller should navigate to the TransactionScreen.
  void Function()? onRequestPending;

  /// Called after the pending request is resolved (approved/rejected/timed out).
  /// The caller should navigate away from the confirmation screen.
  void Function()? onRequestResolved;

  PendingSignRequest? _pendingRequest;
  PendingSignRequest? get pendingRequest => _pendingRequest;

  Map<String, dynamic>? _lastSignResult;
  Map<String, dynamic>? get lastSignResult => _lastSignResult;

  /// Chronological list of completed signature operations.
  final List<SignatureRecord> _history = [];
  List<SignatureRecord> get history => List.unmodifiable(_history);

  Timer? _pendingTimeout;

  SignConfirmation({
    required ICryptoService crypto,
    required ApduHandler apduHandler,
    this.onRequestPending,
    this.onRequestResolved,
  })  : _crypto = crypto,
        _apduHandler = apduHandler;

  // ═══════════════════════════════════════════════════════════════════
  //  Static helpers — command detection
  // ═══════════════════════════════════════════════════════════════════

  /// Whether this APDU command is a sign operation needing confirmation.
  static bool isSignCommand(ApduCommand cmd) {
    // ETH RLP + EIP-712 (P1=0x02/0x42 also goes through INS 0x04).
    if (cmd.cla == Cla.os || cmd.cla == Cla.global) {
      return cmd.ins == Ins.ethSign ||
          cmd.ins == Ins.signEthTx ||
          cmd.ins == Ins.signEthPersonalMessage ||
          cmd.ins == Ins.signSolMessage ||
          cmd.ins == Ins.ethSignEip712Struct;
    }
    // Bitcoin
    if (cmd.cla == Cla.bitcoin || cmd.cla == Cla.bitcoinExt) {
      return cmd.ins == Ins.btcSignTx;
    }
    // Tron
    if (cmd.cla == Cla.tron) {
      return cmd.ins == Ins.tronSignTx;
    }
    // Sui
    if (cmd.cla == Cla.sui) {
      return cmd.ins == Ins.suiSignTx;
    }
    return false;
  }

  /// Map an APDU command to a chain name for parsing / display.
  static String chainFromCommand(ApduCommand cmd) {
    if (cmd.cla == Cla.os || cmd.cla == Cla.global) {
      if (cmd.ins == Ins.signEthPersonalMessage) return 'personal_msg';
      if (cmd.ins == Ins.ethSignEip712Struct) return 'eip712';
      // P1=0x02/0x42 = inline EIP-712 via INS 0x04.
      if (cmd.ins == Ins.ethSign && (cmd.p1 == 0x02 || cmd.p1 == 0x42)) {
        return 'eip712';
      }
      if (cmd.ins == Ins.signSolMessage) return 'solana';
      return 'ethereum'; // ETH_SIGN / signEthTx
    }
    if (cmd.cla == Cla.bitcoin || cmd.cla == Cla.bitcoinExt) return 'bitcoin';
    if (cmd.cla == Cla.tron) return 'tron';
    if (cmd.cla == Cla.sui) return 'sui';
    return 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Interception
  // ═══════════════════════════════════════════════════════════════════

  /// Intercept a signing APDU command.
  ///
  /// Extracts the derivation path via [PathParser], derives the signing
  /// address via [ICryptoService], parses the transaction payload, and
  /// creates a [PendingSignRequest]. Triggers [onRequestPending] so the
  /// caller can navigate to the confirmation screen. Starts a 60s timeout.
  ///
  /// Returns `true` if the request was successfully intercepted and stored
  /// as pending. Returns `false` if the command data was invalid (caller
  /// should send an error APDU response over BLE).
  Future<bool> interceptSignCommand(
      ApduCommand command, String seedHex) async {
    final data = command.data;
    if (data == null || data.isEmpty) return false;

    // Extract derivation path + remainder payload.
    final pathResult = PathParser.parsePathWithRemainder(data);
    if (pathResult == null) return false;

    final chain = chainFromCommand(command);
    final address = _deriveAddress(seedHex, pathResult.path, chain);

    // For EIP-712 multi-APDU (ins=0x0D): consume cached domain hash.
    // For inline EIP-712 (P1=0x02/0x42 via INS 0x04) the method
    // returns null and we use the raw remainder instead.
    String payloadHex;
    final eip712 = _apduHandler.consumeEip712ForDisplay(command);
    if (eip712 != null) {
      // Reconstruct 64-byte combined hash as hex for parsing.
      payloadHex = eip712[0] + eip712[1];
    } else {
      payloadHex = _crypto.hexEncode(pathResult.remainder);
    }

    // Parse via Rust SDK.
    final jsonStr = _crypto.parseSignData(chain, payloadHex);
    Map<String, dynamic>? parsedData;
    if (jsonStr != null) {
      try {
        parsedData = jsonDecode(jsonStr) as Map<String, dynamic>;
      } catch (_) {}
    }

    _pendingRequest = PendingSignRequest(
      command: command,
      chain: chain,
      derivationPath: pathResult.path,
      signingAddress: address ?? 'unknown',
      payloadHex: payloadHex,
      parsedData: parsedData,
    );

    // Start 60s timeout.
    _pendingTimeout?.cancel();
    _pendingTimeout = Timer(
      const Duration(seconds: 60),
      onTimeout,
    );

    // Trigger UI navigation.
    onRequestPending?.call();

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Resolution — approve / reject / timeout
  // ═══════════════════════════════════════════════════════════════════

  /// The user approved the pending sign request.
  ///
  /// [sign] callback should perform the actual signing (typically
  /// `apduHandler.handle(req.command).toBytes()`) and return the
  /// raw APDU response bytes. The caller is responsible for sending
  /// those bytes over BLE inside the callback.
  ///
  /// Extracts signature data from the response bytes, stores them in
  /// [lastSignResult], and triggers [onRequestResolved].
  Future<void> approve(Uint8List Function() sign) async {
    final req = _pendingRequest;
    if (req == null) return;
    _pendingTimeout?.cancel();
    _pendingTimeout = null;

    try {
      final responseBytes = sign();
      final response = ApduResponse.fromBytes(responseBytes);

      // Store result for display.
      final parsed = req.parsedData ?? {};
      final signatureHex = _crypto.hexEncode(response.data ?? Uint8List(0));
      _lastSignResult = {
        ...parsed,
        'chain': req.chain,
        'signingAddress': req.signingAddress,
        'derivationPath': req.derivationPath,
        'signatureHex': signatureHex,
        'statusWord': response.statusWord,
        'isSuccess': response.isSuccess,
      };

      // Record to history.
      _history.add(SignatureRecord(
        timestamp: DateTime.now(),
        chain: req.chain,
        derivationPath: req.derivationPath,
        signingAddress: req.signingAddress,
        payloadHex: req.payloadHex,
        parsedData: req.parsedData,
        isApproved: true,
        signatureHex: signatureHex,
        statusWord: response.statusWord,
      ));

      _pendingRequest = null;
      onRequestResolved?.call();
    } catch (e) {
      // Record failed approval to history.
      _history.add(SignatureRecord(
        timestamp: DateTime.now(),
        chain: req.chain,
        derivationPath: req.derivationPath,
        signingAddress: req.signingAddress,
        payloadHex: req.payloadHex,
        parsedData: req.parsedData,
        isApproved: true,
        signatureHex: null,
        statusWord: 0x0000,
      ));

      _pendingRequest = null;
      onRequestResolved?.call();
      rethrow;
    }
  }

  /// The user rejected the pending sign request.
  ///
  /// [sendError] callback should construct an error APDU response and
  /// send it over BLE. Errors from the callback are silently swallowed —
  /// error-response delivery failure is non-critical.
  ///
  /// Clears the pending request and triggers [onRequestResolved].
  Future<void> reject(Uint8List Function() sendError) async {
    _pendingTimeout?.cancel();
    _pendingTimeout = null;

    // Record rejection to history before clearing request.
    final req = _pendingRequest;

    // Send error response via callback.
    try {
      sendError();
    } catch (_) {
      // Swallow — error response delivery failure is non-critical.
    }

    if (req != null) {
      _history.add(SignatureRecord(
        timestamp: DateTime.now(),
        chain: req.chain,
        derivationPath: req.derivationPath,
        signingAddress: req.signingAddress,
        payloadHex: req.payloadHex,
        parsedData: req.parsedData,
        isApproved: false,
        signatureHex: null,
        statusWord: 0x6985, // SW_USER_REJECTED
      ));
    }

    _pendingRequest = null;
    onRequestResolved?.call();
  }

  /// Timeout while waiting for user confirmation (60s).
  ///
  /// Clears the pending request and triggers [onRequestResolved].
  /// The caller should detect the timeout by checking that
  /// [pendingRequest] is null with no [lastSignResult].
  void onTimeout() {
    _pendingTimeout = null;

    final req = _pendingRequest;
    if (req != null) {
      _history.add(SignatureRecord(
        timestamp: DateTime.now(),
        chain: req.chain,
        derivationPath: req.derivationPath,
        signingAddress: req.signingAddress,
        payloadHex: req.payloadHex,
        parsedData: req.parsedData,
        isApproved: false,
        signatureHex: null,
        statusWord: 0x6400, // SW_TIMEOUT
      ));
    }

    _pendingRequest = null;
    onRequestResolved?.call();
  }

  /// Clear the last sign result (after the result screen is dismissed).
  void clearLastSignResult() {
    _lastSignResult = null;
  }

  /// Cancel the pending timeout and clear state. Call during disposal.
  void dispose() {
    _pendingTimeout?.cancel();
    _pendingTimeout = null;
    _pendingRequest = null;
    _lastSignResult = null;
    _history.clear();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Helpers — address derivation
  // ═══════════════════════════════════════════════════════════════════

  /// Derive the signing address for a chain from seed+path.
  String? _deriveAddress(String seedHex, String path, String chain) {
    switch (chain) {
      case 'ethereum':
      case 'personal_msg':
      case 'eip712':
        return _crypto.deriveEthAddress(seedHex, path);
      case 'solana':
        return _crypto.deriveSolAddress(seedHex, path);
      case 'bitcoin':
        return _crypto.deriveBtcAddress(seedHex, path);
      case 'tron':
        return _crypto.deriveTronAddress(seedHex, path);
      case 'sui':
        return _crypto.deriveSuiAddress(seedHex, path);
      default:
        return null;
    }
  }
}
