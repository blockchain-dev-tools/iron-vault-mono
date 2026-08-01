/// BLE session lifecycle, auto-lock timer, and APDU command dispatch.
///
/// Extracted from [AppState] to separate BLE/session concerns from global
/// app state management (ChangeNotifier, navigation, settings).
///
/// Responsibilities:
///   1. **Auto-lock timer** — 5-minute background timeout; locks wallet and
///      fires [onWalletLocked] callback.
///   2. **APDU-BLE bridge** — parses incoming raw APDU bytes, dispatches
///      sign commands to [SignConfirmation] and all others to [ApduHandler].
///   3. **BLE advertising management** — thin wrappers around [BlePeripheral]
///      with _wasAdvertising flag tracking for foreground/background
///      transitions.
///
/// BlePeripheral is NOT owned — set via the [blePeripheral] setter.
/// The caller is responsible for creating and disposing the peripheral.
library;

import 'dart:async';
import 'dart:typed_data';

import '../core/interfaces/wallet_service.dart';
import '../core/models/apdu_message.dart';
import '../core/models/ble_types.dart';
import '../infrastructure/ble/ble_peripheral.dart';
import '../protocols/apdu/apdu_constants.dart';
import 'apdu_handler.dart';
import 'sign_confirmation.dart';

/// Manages BLE session lifecycle, auto-lock timer, and APDU dispatch.
class BleSession {
  // ── Dependencies ──────────────────────────────────────────────────────

  final IWalletService _walletService;
  final ApduHandler _apduHandler;
  final SignConfirmation _signConfirmation;

  // ── Auto-lock state ──────────────────────────────────────────────────

  DateTime? _backgroundedAt;
  Timer? _lockTimer;
  bool _wasAdvertising = false;

  static const Duration _autoLockDuration = Duration(minutes: 5);

  /// Called when the auto-lock timer fires and the wallet is locked.
  ///
  /// The caller should update UI (e.g. navigate to Unlock screen).
  void Function()? onWalletLocked;

  // ── BLE state ────────────────────────────────────────────────────────

  BlePeripheral? _blePeripheral;
  StreamSubscription<Uint8List>? _apduSub;
  String? _seedHex;

  // ── Constructor ──────────────────────────────────────────────────────

  BleSession({
    required IWalletService walletService,
    required ApduHandler apduHandler,
    required SignConfirmation signConfirmation,
  })  : _walletService = walletService,
        _apduHandler = apduHandler,
        _signConfirmation = signConfirmation;

  // ═══════════════════════════════════════════════════════════════════════
  //  BLE Peripheral setter
  // ═══════════════════════════════════════════════════════════════════════

  /// Set (or replace) the active [BlePeripheral].
  ///
  /// Subscribes to the peripheral's APDU stream and sets the APDU context
  /// if the wallet is unlocked. Setting to `null` unsubscribes and clears
  /// the handler context.
  set blePeripheral(BlePeripheral? bp) {
    _apduSub?.cancel();
    _apduSub = null;
    _apduHandler.clearContext();
    _seedHex = null;

    _blePeripheral = bp;

    if (bp != null) {
      _apduSub = bp.apduStream.listen(_onRawApdu);
      trySetApduContext();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Auto-lock
  // ═══════════════════════════════════════════════════════════════════════

  /// Call when the app enters the background.
  ///
  /// Records the current time, starts a [Duration(minutes: 5)] auto-lock
  /// timer, and stops BLE advertising if active (preserving the intent
  /// to restart on foreground via [_wasAdvertising] flag).
  void onAppBackgrounded() {
    _backgroundedAt = DateTime.now();
    _lockTimer?.cancel();
    _lockTimer = Timer(_autoLockDuration, _onAutoLockFire);

    if (_blePeripheral != null &&
        (_blePeripheral!.state == BleState.broadcasting ||
            _blePeripheral!.state == BleState.connected)) {
      _wasAdvertising = true;
      _blePeripheral!.stopAdvertising();
    }
  }

  /// Call when the app returns to the foreground.
  ///
  /// Cancels the auto-lock timer. If the elapsed background time exceeds
  /// [Duration(minutes: 5)], locks the wallet immediately. Restarts BLE
  /// advertising if it was stopped by [onAppBackgrounded].
  void onAppForegrounded() {
    _lockTimer?.cancel();
    _lockTimer = null;

    if (_backgroundedAt != null) {
      final elapsed = DateTime.now().difference(_backgroundedAt!);
      if (elapsed >= _autoLockDuration) {
        _performLock();
      }
      _backgroundedAt = null;
    }

    if (_wasAdvertising && _blePeripheral != null) {
      _wasAdvertising = false;
      _blePeripheral!.startAdvertising();
    }
  }

  /// Called when the auto-lock timer fires while in background.
  void _onAutoLockFire() {
    _performLock();
  }

  /// Lock the wallet and clear all session state.
  void _performLock() {
    if (!_walletService.isUnlocked) return;

    _walletService.lock();
    _seedHex = null;
    _apduHandler.clearContext();
    onWalletLocked?.call();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  BLE Advertising (thin wrappers)
  // ═══════════════════════════════════════════════════════════════════════

  /// Start BLE advertising.
  ///
  /// Sets the APDU handler context from the current wallet state before
  /// starting advertising. Safe to call when no peripheral is set.
  Future<void> startAdvertising() async {
    if (_blePeripheral == null) return;
    trySetApduContext();
    await _blePeripheral!.startAdvertising();
  }

  /// Stop BLE advertising.
  ///
  /// Safe to call when no peripheral is set.
  Future<void> stopAdvertising() async {
    if (_blePeripheral == null) return;
    await _blePeripheral!.stopAdvertising();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  APDU Context
  // ═══════════════════════════════════════════════════════════════════════

  /// Set the APDU handler context from the current wallet state.
  ///
  /// Reads the seed hex from [IWalletService] and passes it to both
  /// [ApduHandler] and the internal cache. Does nothing if the wallet
  /// is locked or has no seed.
  void trySetApduContext() {
    if (_walletService.isUnlocked) {
      final seedHex = _walletService.seedHex;
      if (seedHex != null) {
        _seedHex = seedHex;
        _apduHandler.setContext(seedHex: seedHex);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  APDU Command Dispatch
  // ═══════════════════════════════════════════════════════════════════════

  /// Handle an incoming raw APDU command from the BLE stream.
  ///
  /// Parses the raw bytes into an [ApduCommand], then dispatches:
  ///   - Sign commands → [SignConfirmation.interceptSignCommand]
  ///     (creates a pending request, triggers UI navigation)
  ///   - All others → [ApduHandler.handle]
  ///     (processed immediately, response sent over BLE)
  ///
  /// [seedHex] is the pre-computed seed from the wallet — used by
  /// [SignConfirmation] to derive the signing address. May be `null`
  /// when the wallet is locked; sign commands will be rejected.
  Future<void> onApduCommand(Uint8List rawApdu, String? seedHex) async {
    final ble = _blePeripheral;
    if (ble == null) return;

    final apduHex = rawApdu
        .map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase())
        .join(' ');
    print('[APDU IN]  len=${rawApdu.length}  $apduHex');

    try {
      final command = ApduCommand.fromBytes(rawApdu);
      print(
          '[APDU IN]  parsed: CLA=0x${command.cla.toRadixString(16).padLeft(2, '0')} '
          'INS=0x${command.ins.toRadixString(16).padLeft(2, '0')} '
          'P1=0x${command.p1.toRadixString(16).padLeft(2, '0')} '
          'P2=0x${command.p2.toRadixString(16).padLeft(2, '0')} '
          'dataLen=${command.data?.length ?? 0}');

      // ── Sign-interception: delegate to SignConfirmation ──────────
      if (SignConfirmation.isSignCommand(command)) {
        if (seedHex == null) {
          await _sendError(Sw.securityStatusNotSatisfied);
          return;
        }

        final intercepted =
            await _signConfirmation.interceptSignCommand(command, seedHex);
        if (!intercepted) {
          await _sendError(Sw.wrongData);
        }
        // If intercepted, the response will be sent later via approve() / reject().
        return;
      }

      // ── Non-sign: delegate to ApduHandler ────────────────────────
      final response = _apduHandler.handle(command);
      final responseBytes = response.toBytes();
      final responseHex = responseBytes
          .map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase())
          .join(' ');
      print(
          '[APDU OUT] len=${responseBytes.length}  $responseHex  '
          'SW=0x${response.statusWord.toRadixString(16).padLeft(4, '0')}  '
          'isSuccess=${response.isSuccess}');

      await ble.sendApduResponse(responseBytes);
    } catch (e, stack) {
      print('[APDU ERR] $e\n$stack');
      await _sendError(Sw.unknownError);
    }
  }

  /// Send an error APDU response over BLE.
  ///
  /// Constructs an [ApduResponse] with the given status word and no
  /// data payload. Does nothing if no [BlePeripheral] is connected.
  Future<void> _sendError(int sw) async {
    final ble = _blePeripheral;
    if (ble == null) return;
    final resp = ApduResponse(
      data: null,
      sw1: (sw >> 8) & 0xFF,
      sw2: sw & 0xFF,
    );
    await ble.sendApduResponse(resp.toBytes());
  }

  /// BLE stream listener entry-point — captures the current [_seedHex]
  /// and delegates to [onApduCommand].
  void _onRawApdu(Uint8List rawApdu) {
    onApduCommand(rawApdu, _seedHex);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Cleanup
  // ═══════════════════════════════════════════════════════════════════════

  /// Dispose all managed resources.
  ///
  /// Cancels the auto-lock timer, unsubscribes from the APDU stream,
  /// and clears the APDU handler context. Does NOT dispose the
  /// [BlePeripheral] — the caller owns its lifecycle.
  void dispose() {
    _lockTimer?.cancel();
    _lockTimer = null;
    _apduSub?.cancel();
    _apduSub = null;
    _apduHandler.clearContext();
    _seedHex = null;
    _blePeripheral = null;
  }
}
