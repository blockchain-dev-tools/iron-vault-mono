/// APDU command dispatcher — routes commands by CLA byte to chain handlers.
///
/// Ported from iron-vault-mono: `packages/apdu/src/handler.ts`
///
/// Each chain handler derives keys and signs transactions using the
/// [CryptoBridge] FFI binding to the Rust crypto SDK. Handlers require
/// wallet context (pre-computed seed hex) to be set via [setContext] before
/// any signing or address-derivation operations.
library;

import 'dart:convert';
import 'dart:typed_data';

import '../infrastructure/ffi/crypto_bridge.dart';
import '../core/models/apdu_message.dart';
import '../protocols/apdu/apdu_constants.dart';

/// Dispatches APDU commands to the appropriate chain handler.
///
/// Usage:
/// ```dart
/// final handler = ApduHandler();
/// handler.setContext(seedHex: '...');
/// final response = handler.handle(command);
/// handler.clearContext();
/// ```
class ApduHandler {
  // ── Wallet context ──────────────────────────────────────────────────

  /// Pre-computed seed hex (from BIP-39 or wallet's seed function).
  /// When set, this takes priority over mnemonic+passphrase for key derivation.
  String? _seedHex;

  /// Whether the context has been set (seed is available).
  bool get hasContext => _seedHex != null;

  /// Set the wallet context required for key derivation and signing.
  ///
  /// [seedHex] must be pre-computed by the caller (e.g. [WalletService.seedHex])
  /// to ensure consistency between BLE and Vault-screen addresses.
  ///
  /// Must be called before any chain handler that needs crypto (ETH sign,
  /// SOL pubkey, BTC address, etc.).
  void setContext({required String seedHex}) {
    _seedHex = seedHex;
  }

  /// Clear the cached context.
  void clearContext() {
    _seedHex = null;
    _eip712DomainHash = null;
  }

  /// Consume cached EIP-712 data for display without signing.
  ///
  /// Extracts the cached domain hash and [command]'s struct hash,
  /// returning them as `[domainHashHex, structHashHex]` for the
  /// confirmation screen. Clears the internal cache.
  /// Returns `null` if no cached domain hash or invalid command data.
  List<String>? consumeEip712ForDisplay(ApduCommand command) {
    if (_eip712DomainHash == null) return null;

    final data = command.data;
    if (data == null || data.length < 5) return null;

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null || pathResult.remainder.length < 32) return null;

    final domainHex =
        CryptoBridge.hexEncode(Uint8List.sublistView(_eip712DomainHash!, 0, 32));
    final structHex =
        CryptoBridge.hexEncode(Uint8List.sublistView(pathResult.remainder, 0, 32));

    _eip712DomainHash = null;
    return [domainHex, structHex];
  }

  // ── EIP-712 multi-APDU state ────────────────────────────────────────

  /// Cached domain hash from INS=0x0C, consumed by INS=0x0D.
  Uint8List? _eip712DomainHash;

  // ── Main dispatch ───────────────────────────────────────────────────

  /// Route an APDU command to the correct handler based on CLA byte.
  ///
  /// Returns an [ApduResponse] with the result or an error status word.
  ApduResponse handle(ApduCommand command) {
    switch (command.cla) {
      case Cla.os:
      case Cla.global:
        return _handleOs(command);
      case Cla.bitcoin:
      case Cla.bitcoinExt:
        return _handleBitcoin(command);
      case Cla.tron:
        return _handleTron(command);
      case Cla.sui:
        return _handleSui(command);
      default:
        return _errorResponse(Sw.claNotSupported);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // OS / Global handler (CLA 0xe0 / 0xb0)
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleOs(ApduCommand command) {
    // B0 A7 — sent by newer Ledger SDKs after getAppAndVersion.
    // Unknown purpose; returning 9000 lets the SDK proceed.
    if (command.cla == Cla.global && command.ins == 0xa7) {
      return ApduResponse(data: null, sw1: 0x90, sw2: 0x00);
    }

    // E0 D8 — OPEN_APP. Client selects which app to use.
    if (command.cla == Cla.os && command.ins == 0xd8) {
      return ApduResponse(data: null, sw1: 0x90, sw2: 0x00);
    }

    // E0 A7 — QUIT_APP.
    if (command.cla == Cla.os && command.ins == 0xa7) {
      return ApduResponse(data: null, sw1: 0x90, sw2: 0x00);
    }

    switch (command.ins) {
      // ── OS-level commands ───────────────────────────────────────
      case Ins.getVersion: // CLA E0 → getVersion, CLA B0 → getAppAndVersion
        if (command.cla == Cla.global) {
          return _buildGetAppAndVersion();
        }
        return _buildGetVersion();

      case Ins.getAppName: // CLA E0: ETH_GET_ADDRESS; others: return app name
        if (command.cla == Cla.os) {
          return _handleGetPublicKey(command);
        }
        final nameBytes = Uint8List.fromList('IronVault'.codeUnits);
        return ApduResponse(data: nameBytes, sw1: 0x90, sw2: 0x00);

      // ── Get public key / address (ETH or SOL based on P1) ─────────
      // 0x02 routes through getAppName (with CLA=E0) to _handleGetPublicKey.
      // There is no separate INS for getPublicKey — 0x04 is ETH_SIGN per
      // the standard Ledger Ethereum APDU protocol.
      // (The Ins.getPublicKey constant exists at value 0x02 as a documentation
      //  alias but is handled by the getAppName case above.)

      // ── Ethereum signing ──────────────────────────────────────────
      // Standard Ledger ETH_SIGN = INS 0x04
      case Ins.ethSign:
        return _handleEthSignTx(command);

      // Backward compat: original custom INS 0x06 for sign tx
      case Ins.signEthTx:
        return _handleEthSignTx(command);

      case Ins.signEthPersonalMessage:
        return _handleEthSignPersonal(command);

      // ── EIP-712 typed data signing ────────────────────────────────
      case Ins.ethSignEip712Domain:
        return _handleEthSignEip712Domain(command);

      case Ins.ethSignEip712Struct:
        return _handleEthSignEip712Struct(command);

      // ── Solana signing ───────────────────────────────────────────
      case Ins.signSolMessage:
        return _handleSolSignMessage(command);

      default:
        return _errorResponse(Sw.insNotSupported);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Response builders — OS / Global
  // ─────────────────────────────────────────────────────────────────

  /// Build GET_APP_AND_VERSION response (CLA 0xB0, INS 0x01).
  ///
  /// Format: [0x01] [name_len] [name_bytes] [ver_len] [ver_bytes]
  ///         [flags_len=1] [flags_bytes] [0x90 0x00]
  ApduResponse _buildGetAppAndVersion() {
    const name = 'Ethereum';
    const ver = '1.10.3';
    final nameBytes = utf8.encode(name);
    final verBytes = utf8.encode(ver);
    final resp = Uint8List(1 + 1 + nameBytes.length + 1 + verBytes.length + 1 + 1 + 2);
    int i = 0;
    resp[i++] = 0x01; // format ID
    resp[i++] = nameBytes.length; resp.setRange(i, i + nameBytes.length, nameBytes); i += nameBytes.length;
    resp[i++] = verBytes.length; resp.setRange(i, i + verBytes.length, verBytes); i += verBytes.length;
    resp[i++] = 1; resp[i++] = 0x02; // flags (1 byte: 0x02 = virtual device)
    resp[i++] = 0x90; resp[i] = 0x00; // SW OK
    return ApduResponse.fromBytes(resp);
  }

  /// Build GET_VERSION response (CLA 0xE0, INS 0x01 for non-Solana).
  ///
  /// Format: target_id(4) + se_ver_len(1) + se_ver + flags_len(1) + flags(4)
  ///         + mcu_ver_len(1) + mcu_ver + 0x90 0x00
  ApduResponse _buildGetVersion() {
    final seVer = utf8.encode('1.10.3');
    final flags = Uint8List.fromList([0, 0, 0, 0]);
    final mcuVer = Uint8List.fromList([...utf8.encode('1.13'), 0]);
    final resp = Uint8List(4 + 1 + seVer.length + 1 + 4 + 1 + mcuVer.length + 2);
    int i = 0;
    resp[i++] = 0x33; resp[i++] = 0x00; resp[i++] = 0x00; resp[i++] = 0x04; // target_id
    resp[i++] = seVer.length; resp.setRange(i, i + seVer.length, seVer); i += seVer.length;
    resp[i++] = 4; resp.setRange(i, i + 4, flags); i += 4; // flags
    resp[i++] = mcuVer.length; resp.setRange(i, i + mcuVer.length, mcuVer); i += mcuVer.length;
    resp[i++] = 0x90; resp[i] = 0x00; // SW OK
    return ApduResponse.fromBytes(resp);
  }

  // ─────────────────────────────────────────────────────────────────
  // ETH: get address handler
  // ─────────────────────────────────────────────────────────────────

  /// Build ETH_GET_ADDRESS response matching mono format:
  /// [0x41] [65B uncompressed pubkey] [0x28] [40B ASCII addr hex] [90 00]
  ApduResponse _buildEthAddressResponse(String seedHex, String path) {
    final privKey = CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final privKeyHex = CryptoBridge.hexEncode(privKey);
    final addr = CryptoBridge.ethAddressFromPrivateKey(privKeyHex);
    final pubkey = CryptoBridge.ethPublicKeyBytes(privKeyHex);
    if (addr == null || pubkey == null) return _errorResponse(Sw.unknownError);

    // Strip "0x" prefix — Ledger response uses 40 raw hex chars, no prefix.
    final addrStripped = addr.startsWith('0x') ? addr.substring(2) : addr;
    final addrBytes = utf8.encode(addrStripped);
    final resp = Uint8List(1 + 65 + 1 + addrBytes.length + 2);
    int i = 0;
    resp[i++] = 0x41;
    resp.setRange(i, i + 65, pubkey); i += 65;
    resp[i++] = addrBytes.length;
    resp.setRange(i, i + addrBytes.length, addrBytes); i += addrBytes.length;
    resp[i++] = 0x90; resp[i] = 0x00;

    return ApduResponse.fromBytes(resp);
  }

  ApduResponse _handleGetPublicKey(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    // When no path data is provided, use the default derivation path.
    String? path = _parseDerivationPath(command.data);
    if (path == null && (command.data == null || command.data!.isEmpty)) {
      path = "m/44'/60'/0'/0/0";
    }
    if (path == null) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();

    if (command.p1 == 0x01) {
      // Solana — return pubkey as ASCII hex
      final result = CryptoBridge.deriveSolAddress(seedHex, path);
      if (result == null) return _errorResponse(Sw.unknownError);
      return _successString(result);
    }

    // Ethereum — return binary format: pubkey + address
    return _buildEthAddressResponse(seedHex, path);
  }

  // ─────────────────────────────────────────────────────────────────
  // ETH: sign transaction handler
  // ─────────────────────────────────────────────────────────────────

  /// Handle ETH_SIGN (INS 0x04 and backward-compat 0x06).
  ///
  /// Dispatch by P1 byte:
  /// - P1=0x00/0x80/0xC0: Legacy RLP transaction signing (keccak256 + sign)
  /// - P1=0x02/0x42: EIP-712 typed data with pre-computed hashes
  ApduResponse _handleEthSignTx(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    // EIP-712 typed data signing via INS=0x04 with P1=0x02 or 0x42.
    // Remainder after path is: [domain_hash(32B)][struct_hash(32B)]
    if (command.p1 == 0x02 || command.p1 == 0x42) {
      return _handleEthSignEip712(command);
    }

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    // Parse derivation path from data
    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final rlpData = pathResult.remainder;

    if (rlpData.isEmpty) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signEthTransaction(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(rlpData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  /// Handle EIP-712 typed data signing.
  ///
  /// The [remainder] from path parsing must be 64 bytes:
  ///   [domain_hash(32B)][struct_hash(32B)]
  /// Both hashes are passed to [CryptoBridge.signEthEIP712] which computes
  /// `keccak256(0x19 || 0x01 || domainHash || structHash)` and signs.
  ApduResponse _handleEthSignEip712Data(
      String seedHex, String path, Uint8List remainder) {
    if (remainder.length != 64) {
      return _errorResponse(Sw.wrongData);
    }
    final domainHash = Uint8List.sublistView(remainder, 0, 32);
    final structHash = Uint8List.sublistView(remainder, 32, 64);

    final privKey = CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signEthEIP712(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(domainHash),
      CryptoBridge.hexEncode(structHash),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  /// EIP-712 via INS=0x04+P1=0x02/0x42.
  /// Data: [path(1+depth*4)][domain_hash(32B)][struct_hash(32B)]
  ApduResponse _handleEthSignEip712(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    if (pathResult.remainder.length < 64) {
      return _errorResponse(Sw.wrongData);
    }

    final seedHex = _computeSeed();
    return _handleEthSignEip712Data(seedHex, pathResult.path, pathResult.remainder);
  }

  /// EIP-712 domain handler (INS=0x0C) — caches domain hash.
  ///
  /// Data: [path(1+depth*4)][domain_hash(32B)]
  ApduResponse _handleEthSignEip712Domain(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    if (pathResult.remainder.length < 32) {
      return _errorResponse(Sw.wrongData);
    }

    // Cache the domain hash for the subsequent INS=0x0D call.
    _eip712DomainHash =
        Uint8List.sublistView(pathResult.remainder, 0, 32);
    return ApduResponse(data: null, sw1: 0x90, sw2: 0x00);
  }

  /// EIP-712 struct handler (INS=0x0D) — signs with cached domain + struct hash.
  ///
  /// Data: [path(1+depth*4)][struct_hash(32B)]
  /// Consumes the domain hash cached by [_handleEthSignEip712Domain].
  ApduResponse _handleEthSignEip712Struct(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    if (_eip712DomainHash == null) {
      return _errorResponse(Sw.conditionsNotSatisfied);
    }

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    if (pathResult.remainder.length < 32) {
      return _errorResponse(Sw.wrongData);
    }

    final structHash =
        Uint8List.sublistView(pathResult.remainder, 0, 32);

    // Combine cached domain + struct and sign.
    final combined = Uint8List(64)
      ..setRange(0, 32, _eip712DomainHash!)
      ..setRange(32, 64, structHash);

    final seedHex = _computeSeed();
    // Clear cache after consuming.
    _eip712DomainHash = null;

    return _handleEthSignEip712Data(seedHex, pathResult.path, combined);
  }

  // ─────────────────────────────────────────────────────────────────
  // ETH: sign personal message handler
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleEthSignPersonal(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final messageData = pathResult.remainder;

    if (messageData.isEmpty) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signEthPersonalMessage(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(messageData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  // ─────────────────────────────────────────────────────────────────
  // SOL: sign message handler
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleSolSignMessage(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final messageData = pathResult.remainder;

    if (messageData.isEmpty) return _errorResponse(Sw.conditionsNotSatisfied);

    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveEd25519PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signSolanaMessage(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(messageData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  // ─────────────────────────────────────────────────────────────────
  // Bitcoin handler (CLA 0xe1 / 0xf8)
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleBitcoin(ApduCommand command) {
    switch (command.ins) {
      case Ins.btcGetWalletPublicKey:
        return _handleBtcGetAddress(command);

      case Ins.btcSignTx:
        return _handleBtcSignTx(command);

      default:
        return _errorResponse(Sw.insNotSupported);
    }
  }

  ApduResponse _handleBtcGetAddress(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final path = _parseDerivationPath(command.data);
    if (path == null) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();
    final address = CryptoBridge.deriveBtcAddress(seedHex, path);
    if (address == null) return _errorResponse(Sw.unknownError);

    return _successString(address);
  }

  ApduResponse _handleBtcSignTx(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final txData = pathResult.remainder;

    // BTC transaction signing uses secp256k1 (same as ETH).
    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    // Sign the transaction hash (txData = pre-computed sighash).
    final sig = CryptoBridge.signEthTransaction(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(txData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  // ─────────────────────────────────────────────────────────────────
  // Tron handler (CLA 0x14)
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleTron(ApduCommand command) {
    switch (command.ins) {
      case Ins.tronGetPublicKey:
        return _handleTronGetAddress(command);

      case Ins.tronSignTx:
        return _handleTronSignTx(command);

      default:
        return _errorResponse(Sw.insNotSupported);
    }
  }

  ApduResponse _handleTronGetAddress(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final path = _parseDerivationPath(command.data);
    if (path == null) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();
    final address = CryptoBridge.deriveTronAddress(seedHex, path);
    if (address == null) return _errorResponse(Sw.unknownError);

    return _successString(address);
  }

  ApduResponse _handleTronSignTx(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final txData = pathResult.remainder;

    // Tron uses secp256k1 signing.
    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveSecp256k1PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signEthTransaction(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(txData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  // ─────────────────────────────────────────────────────────────────
  // Sui handler (CLA 0x07)
  // ─────────────────────────────────────────────────────────────────

  ApduResponse _handleSui(ApduCommand command) {
    switch (command.ins) {
      case Ins.suiGetPublicKey:
        return _handleSuiGetAddress(command);

      case Ins.suiSignTx:
        return _handleSuiSignTx(command);

      default:
        return _errorResponse(Sw.insNotSupported);
    }
  }

  ApduResponse _handleSuiGetAddress(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final path = _parseDerivationPath(command.data);
    if (path == null) return _errorResponse(Sw.wrongData);

    final seedHex = _computeSeed();
    final address = CryptoBridge.deriveSuiAddress(seedHex, path);
    if (address == null) return _errorResponse(Sw.unknownError);

    return _successString(address);
  }

  ApduResponse _handleSuiSignTx(ApduCommand command) {
    if (!hasContext) return _errorResponse(Sw.conditionsNotSatisfied);

    final data = command.data;
    if (data == null || data.length < 5) return _errorResponse(Sw.wrongData);

    final pathResult = _parseDerivationPathFromData(data);
    if (pathResult == null) return _errorResponse(Sw.wrongData);

    final path = pathResult.path;
    final txData = pathResult.remainder;

    // Sui uses Ed25519 signing.
    final seedHex = _computeSeed();
    final privKey =
        CryptoBridge.deriveEd25519PrivateKey(seedHex, path);
    if (privKey == null) return _errorResponse(Sw.unknownError);

    final sig = CryptoBridge.signSolanaMessage(
      CryptoBridge.hexEncode(privKey),
      CryptoBridge.hexEncode(txData),
    );
    if (sig == null) return _errorResponse(Sw.unknownError);

    return _successBytes(sig);
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers — Derivation path parsing
  // ─────────────────────────────────────────────────────────────────

  /// Parse a BIP-32 derivation path from APDU data.
  ///
  /// APDU encoding (Ledger protocol):
  /// - Byte 0: depth as uint8 (number of derivation components)
  /// - Remaining bytes: depth × 4 bytes per component (big-endian uint32)
  ///   - Bit 31 (`0x80000000`) indicates hardened derivation
  ///
  /// Returns the BIP-32 path string (e.g. `"m/44'/60'/0'/0/0"`)
  /// or `null` if the data is invalid or too short.
  String? _parseDerivationPath(Uint8List? data) {
    if (data == null || data.isEmpty) return null;

    final depth = data[0];
    if (depth > 10) return null; // sanity check
    final expectedLen = 1 + depth * 4;

    if (data.length < expectedLen) return null;

    final components = <String>['m'];
    for (int i = 0; i < depth; i++) {
      final offset = 1 + i * 4;
      final value = _readUint32BE(data, offset);
      final isHardened = (value & 0x80000000) != 0;
      final index = value & 0x7FFFFFFF;
      components.add(isHardened ? "$index'" : '$index');
    }

    return components.join('/');
  }

  /// Parse a derivation path from the beginning of [data], returning
  /// both the path string and the remaining bytes (e.g. transaction data).
  ///
  /// Returns `null` if the path data is invalid.
  _PathParseResult? _parseDerivationPathFromData(Uint8List data) {
    if (data.isEmpty) return null;

    final depth = data[0];
    if (depth > 10) return null; // sanity check
    final pathBytesLen = 1 + depth * 4;

    if (data.length < pathBytesLen) return null;

    final pathBytes = Uint8List.sublistView(data, 0, pathBytesLen);
    final remainder = Uint8List.sublistView(data, pathBytesLen);

    final path = _parseDerivationPath(pathBytes);
    if (path == null) return null;

    return _PathParseResult(path, remainder);
  }

  /// Read a big-endian 32-bit unsigned integer from [data] at [offset].
  static int _readUint32BE(Uint8List data, int offset) {
    return (data[offset] << 24) |
        (data[offset + 1] << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3];
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers — Seed derivation
  // ─────────────────────────────────────────────────────────────────

  /// Return the seed hex for key derivation.
  ///
  /// Returns the pre-computed seed set via [setContext].
  ///
  /// Throws [StateError] if no context has been set.
  String _computeSeed() {
    if (_seedHex != null) return _seedHex!;
    throw StateError('Wallet context not set. Call setContext() first.');
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers — Response builders
  // ─────────────────────────────────────────────────────────────────

  /// Creates a success response with binary data.
  ApduResponse _successBytes(Uint8List data) {
    return ApduResponse(data: data, sw1: 0x90, sw2: 0x00);
  }

  /// Creates a success response with an ASCII string as data.
  ApduResponse _successString(String s) {
    return ApduResponse(data: Uint8List.fromList(s.codeUnits), sw1: 0x90, sw2: 0x00);
  }

  /// Creates an error response with the given 16-bit status word.
  ///
  /// The status word is split into [ApduResponse.sw1] (high byte) and
  /// [ApduResponse.sw2] (low byte).
  ApduResponse _errorResponse(int sw) {
    return ApduResponse(
      data: null,
      sw1: (sw >> 8) & 0xFF,
      sw2: sw & 0xFF,
    );
  }
}

/// Result of parsing a derivation path from APDU data with a remainder.
class _PathParseResult {
  final String path;
  final Uint8List remainder;

  const _PathParseResult(this.path, this.remainder);
}
