/// Unit tests for [SignConfirmation].
///
/// Covers isSignCommand, chainFromCommand, interceptSignCommand,
/// approve, reject, onTimeout, clearLastSignResult, and dispose.
library;

import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/biz/path_parser.dart';
import 'package:iron_vault_flutter/biz/sign_confirmation.dart';
import 'package:iron_vault_flutter/core/interfaces/crypto_service.dart';
import 'package:iron_vault_flutter/core/models/apdu_message.dart';
import 'package:iron_vault_flutter/protocols/apdu/apdu_constants.dart';
import 'package:iron_vault_flutter/biz/apdu_handler.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mocks
// ═══════════════════════════════════════════════════════════════════════

/// Configurable mock of [ICryptoService] for SignConfirmation tests.
class _MockCryptoService implements ICryptoService {
  String? hexEncodeResult;
  String? deriveEthResult;
  String? deriveSolResult;
  String? deriveBtcResult;
  String? deriveTronResult;
  String? deriveSuiResult;
  String? parseSignDataResult;

  final List<Uint8List> hexEncodeCalls = [];
  final List<String> deriveEthCalls = [];
  final List<String> parseSignDataCalls = [];

  @override
  String hexEncode(Uint8List bytes) {
    hexEncodeCalls.add(bytes);
    return hexEncodeResult ?? 'hex-encoded';
  }

  @override
  String? deriveEthAddress(String seedHex, String path) {
    deriveEthCalls.add(path);
    return deriveEthResult ?? '0xmockethaddress1234';
  }

  @override
  String? deriveSolAddress(String seedHex, String path) =>
      deriveSolResult ?? 'MockSolAddr';

  @override
  String? deriveBtcAddress(String seedHex, String path) =>
      deriveBtcResult ?? 'bc1mockbtc';

  @override
  String? deriveTronAddress(String seedHex, String path) =>
      deriveTronResult ?? 'TMockTron';

  @override
  String? deriveSuiAddress(String seedHex, String path) =>
      deriveSuiResult ?? '0xmocksui';

  @override
  String? parseSignData(String chain, String payloadHex) {
    parseSignDataCalls.add(chain);
    return parseSignDataResult;
  }

  // ── Unused ─────────────────────────────────────────────────────────

  @override String generateMnemonic({int strength = 128}) => throw UnimplementedError();
  @override bool validateMnemonic(String m) => throw UnimplementedError();
  @override String reencodeMnemonic(String m) => throw UnimplementedError();
  @override String? generateMnemonicLang({int strength = 128, required int language}) => throw UnimplementedError();
  @override bool validateMnemonicLang(String m, int l) => throw UnimplementedError();
  @override Uint8List? deriveSecp256k1PrivateKey(String s, String p) => throw UnimplementedError();
  @override Uint8List? deriveEd25519PrivateKey(String s, String p) => throw UnimplementedError();
  @override Uint8List? signEthTransaction(String k, String r) => throw UnimplementedError();
  @override Uint8List? signEthPersonalMessage(String k, String m) => throw UnimplementedError();
  @override Uint8List? signEthEIP712(String k, String d, String s) => throw UnimplementedError();
  @override Uint8List? signSolanaMessage(String k, String m) => throw UnimplementedError();
  @override String? ethAddressFromPrivateKey(String k) => throw UnimplementedError();
  @override Uint8List? ethPublicKeyBytes(String k) => throw UnimplementedError();
  @override Uint8List? solanaPublicKeyBytes(String k) => throw UnimplementedError();
  @override String? p2wpkhAddress(String k) => throw UnimplementedError();
  @override String? tronAddressFromPubkey(String k) => throw UnimplementedError();
  @override String? suiAddress(String k) => throw UnimplementedError();
  @override String? enigmaDeriveMnemonic(String r, String s, int l) => throw UnimplementedError();
  @override String? enigmaEntropyHex(String r, String s, int l) => throw UnimplementedError();
  @override String? mnemonicFromEntropy(String e, int l) => throw UnimplementedError();
  @override String? pbkdf2Derive(String p, String s, int k) => throw UnimplementedError();
  @override String? mnemonicToSeed(String m, {String passphrase = ''}) => throw UnimplementedError();
  @override String? chacha20Encrypt(String p, String pi, String s) => throw UnimplementedError();
  @override String? chacha20Decrypt(String c, String pi, String s) => throw UnimplementedError();
  @override Uint8List hexToBytes(String h) => throw UnimplementedError();
}

/// Minimal mock of [ApduHandler] that extends the real class.
class _MockApduHandler extends ApduHandler {
  List<String>? consumeEip712Result;

  @override
  List<String>? consumeEip712ForDisplay(ApduCommand command) {
    return consumeEip712Result;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Helper: build a minimal APDU command with derivation path data
// ═══════════════════════════════════════════════════════════════════════

/// Build an APDU data blob: [depth(1B)] [4B components...] [remainder bytes]
Uint8List _buildPathData(int depth, List<int> components, {List<int>? remainder}) {
  final bytes = Uint8List(1 + depth * 4 + (remainder?.length ?? 0));
  bytes[0] = depth;
  for (int i = 0; i < depth; i++) {
    final offset = 1 + i * 4;
    final value = components[i];
    bytes[offset] = (value >> 24) & 0xFF;
    bytes[offset + 1] = (value >> 16) & 0xFF;
    bytes[offset + 2] = (value >> 8) & 0xFF;
    bytes[offset + 3] = value & 0xFF;
  }
  if (remainder != null) {
    bytes.setRange(1 + depth * 4, bytes.length, remainder);
  }
  return bytes;
}

/// Create a sign-capable APDU command with path data payload.
ApduCommand _makeSignCommand({
  int cla = Cla.os,
  int ins = Ins.ethSign,
  int p1 = 0x00,
  int p2 = 0x00,
  Uint8List? data,
}) {
  return ApduCommand(cla: cla, ins: ins, p1: p1, p2: p2, data: data);
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  late _MockCryptoService crypto;
  late _MockApduHandler apduHandler;
  late SignConfirmation sc;

  setUp(() {
    crypto = _MockCryptoService();
    apduHandler = _MockApduHandler();
    sc = SignConfirmation(crypto: crypto, apduHandler: apduHandler);
  });

  // ──────────────────────────────────────────────────────────────────
  // isSignCommand
  // ──────────────────────────────────────────────────────────────────

  group('isSignCommand', () {
    test('detects ETH_SIGN (INS 0x04)', () {
      final cmd = _makeSignCommand(ins: Ins.ethSign);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects signEthTx (INS 0x06)', () {
      final cmd = _makeSignCommand(ins: Ins.signEthTx);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects signEthPersonalMessage (INS 0x08)', () {
      final cmd = _makeSignCommand(ins: Ins.signEthPersonalMessage);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects signSolMessage (INS 0x0A)', () {
      final cmd = _makeSignCommand(ins: Ins.signSolMessage);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects EIP-712 struct sign (INS 0x0D)', () {
      final cmd = _makeSignCommand(ins: Ins.ethSignEip712Struct);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects BTC sign (CLA 0xe1, INS 0x44)', () {
      final cmd = _makeSignCommand(cla: Cla.bitcoin, ins: Ins.btcSignTx);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects BTC extended sign (CLA 0xf8, INS 0x44)', () {
      final cmd = _makeSignCommand(cla: Cla.bitcoinExt, ins: Ins.btcSignTx);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects Tron sign (CLA 0x14, INS 0x04)', () {
      final cmd = _makeSignCommand(cla: Cla.tron, ins: Ins.tronSignTx);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('detects Sui sign (CLA 0x07, INS 0x04)', () {
      final cmd = _makeSignCommand(cla: Cla.sui, ins: Ins.suiSignTx);
      expect(SignConfirmation.isSignCommand(cmd), isTrue);
    });

    test('returns false for getVersion (INS 0x01)', () {
      final cmd = _makeSignCommand(ins: Ins.getVersion);
      expect(SignConfirmation.isSignCommand(cmd), isFalse);
    });

    test('returns false for getPublicKey (INS 0x02)', () {
      final cmd = _makeSignCommand(ins: Ins.getPublicKey);
      expect(SignConfirmation.isSignCommand(cmd), isFalse);
    });

    test('returns false for unsupported CLA', () {
      final cmd = _makeSignCommand(cla: 0xFF, ins: Ins.ethSign);
      expect(SignConfirmation.isSignCommand(cmd), isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // chainFromCommand
  // ──────────────────────────────────────────────────────────────────

  group('chainFromCommand', () {
    test('ETH_SIGN returns ethereum', () {
      final cmd = _makeSignCommand(ins: Ins.ethSign);
      expect(SignConfirmation.chainFromCommand(cmd), 'ethereum');
    });

    test('signEthTx returns ethereum', () {
      final cmd = _makeSignCommand(ins: Ins.signEthTx);
      expect(SignConfirmation.chainFromCommand(cmd), 'ethereum');
    });

    test('signEthPersonalMessage returns personal_msg', () {
      final cmd = _makeSignCommand(ins: Ins.signEthPersonalMessage);
      expect(SignConfirmation.chainFromCommand(cmd), 'personal_msg');
    });

    test('EIP-712 struct returns eip712', () {
      final cmd = _makeSignCommand(ins: Ins.ethSignEip712Struct);
      expect(SignConfirmation.chainFromCommand(cmd), 'eip712');
    });

    test('inline EIP-712 (P1=0x02 via INS 0x04) returns eip712', () {
      final cmd = _makeSignCommand(ins: Ins.ethSign, p1: 0x02);
      expect(SignConfirmation.chainFromCommand(cmd), 'eip712');
    });

    test('inline EIP-712 (P1=0x42 via INS 0x04) returns eip712', () {
      final cmd = _makeSignCommand(ins: Ins.ethSign, p1: 0x42);
      expect(SignConfirmation.chainFromCommand(cmd), 'eip712');
    });

    test('Solana returns solana', () {
      final cmd = _makeSignCommand(ins: Ins.signSolMessage);
      expect(SignConfirmation.chainFromCommand(cmd), 'solana');
    });

    test('Bitcoin returns bitcoin', () {
      final cmd = _makeSignCommand(cla: Cla.bitcoin, ins: Ins.btcSignTx);
      expect(SignConfirmation.chainFromCommand(cmd), 'bitcoin');
    });

    test('Tron returns tron', () {
      final cmd = _makeSignCommand(cla: Cla.tron, ins: Ins.tronSignTx);
      expect(SignConfirmation.chainFromCommand(cmd), 'tron');
    });

    test('Sui returns sui', () {
      final cmd = _makeSignCommand(cla: Cla.sui, ins: Ins.suiSignTx);
      expect(SignConfirmation.chainFromCommand(cmd), 'sui');
    });

    test('unknown CLA returns unknown', () {
      final cmd = _makeSignCommand(cla: 0xFF, ins: 0xFF);
      expect(SignConfirmation.chainFromCommand(cmd), 'unknown');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // interceptSignCommand
  // ──────────────────────────────────────────────────────────────────

  group('interceptSignCommand', () {
    test('creates pending request and triggers onRequestPending', () async {
      final pathData = _buildPathData(3, [
        0x8000002C, // 44'
        0x8000003C, // 60'
        0x80000000, // 0'
      ], remainder: [0xAB, 0xCD]);

      final cmd = _makeSignCommand(
        ins: Ins.ethSign,
        data: pathData,
      );

      bool pendingCalled = false;
      sc.onRequestPending = () => pendingCalled = true;

      crypto.parseSignDataResult = '{"to":"0xabc","value":"0"}';

      final result = await sc.interceptSignCommand(cmd, 'seed-hex');

      expect(result, isTrue);
      expect(pendingCalled, isTrue);
      expect(sc.pendingRequest, isNotNull);
      expect(sc.pendingRequest!.chain, 'ethereum');
      expect(sc.pendingRequest!.derivationPath, "m/44'/60'/0'");
    });

    test('returns false when data is null', () async {
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: null);
      final result = await sc.interceptSignCommand(cmd, 'seed-hex');
      expect(result, isFalse);
    });

    test('returns false when data is empty', () async {
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: Uint8List(0));
      final result = await sc.interceptSignCommand(cmd, 'seed-hex');
      expect(result, isFalse);
    });

    test('returns false when path parsing fails (depth > 10)', () async {
      final badData = Uint8List(1 + 11 * 4);
      badData[0] = 11; // depth=11
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: badData);
      final result = await sc.interceptSignCommand(cmd, 'seed-hex');
      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Resolution — approve / reject / timeout
  // ──────────────────────────────────────────────────────────────────

  group('approve', () {
    test('calls sign callback and stores result', () async {
      // First, create a pending request via intercept.
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      crypto.parseSignDataResult = '{"to":"0xdef"}';
      await sc.interceptSignCommand(cmd, 'seed-hex');

      bool resolvedCalled = false;
      sc.onRequestResolved = () => resolvedCalled = true;

      final responseBytes = Uint8List.fromList([0x01, 0x02, 0x90, 0x00]);

      await sc.approve(() => responseBytes);

      expect(sc.pendingRequest, isNull);
      expect(resolvedCalled, isTrue);
      expect(sc.lastSignResult, isNotNull);
      expect(sc.lastSignResult!['isSuccess'], isTrue);
    });

    test('no-op when no pending request', () async {
      bool resolvedCalled = false;
      sc.onRequestResolved = () => resolvedCalled = true;

      await sc.approve(() => Uint8List(0));

      expect(resolvedCalled, isFalse);
    });
  });

  group('reject', () {
    test('clears pending and calls sendError, triggers onRequestResolved',
        () async {
      // Create pending request
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      await sc.interceptSignCommand(cmd, 'seed-hex');

      bool resolvedCalled = false;
      bool errorSent = false;
      sc.onRequestResolved = () => resolvedCalled = true;

      await sc.reject(() {
        errorSent = true;
        return Uint8List(0);
      });

      expect(sc.pendingRequest, isNull);
      expect(resolvedCalled, isTrue);
      expect(errorSent, isTrue);
    });

    test('swallows errors from sendError callback', () async {
      // Create pending request
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      await sc.interceptSignCommand(cmd, 'seed-hex');

      bool resolvedCalled = false;
      sc.onRequestResolved = () => resolvedCalled = true;

      // Should not throw
      await sc.reject(() => throw Exception('send failed'));

      expect(sc.pendingRequest, isNull);
      expect(resolvedCalled, isTrue);
    });
  });

  group('onTimeout', () {
    test('clears pending request and triggers onRequestResolved', () async {
      // Create pending request
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      await sc.interceptSignCommand(cmd, 'seed-hex');
      expect(sc.pendingRequest, isNotNull);

      bool resolvedCalled = false;
      sc.onRequestResolved = () => resolvedCalled = true;

      sc.onTimeout();

      expect(sc.pendingRequest, isNull);
      expect(resolvedCalled, isTrue);
    });
  });

  group('clearLastSignResult', () {
    test('clears the last sign result', () async {
      // Create pending and approve
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      await sc.interceptSignCommand(cmd, 'seed-hex');
      await sc.approve(() => Uint8List.fromList([0x90, 0x00]));
      expect(sc.lastSignResult, isNotNull);

      sc.clearLastSignResult();

      expect(sc.lastSignResult, isNull);
    });
  });

  group('dispose', () {
    test('clears all state', () async {
      final pathData = _buildPathData(1, [0x80000000]);
      final cmd = _makeSignCommand(ins: Ins.ethSign, data: pathData);
      await sc.interceptSignCommand(cmd, 'seed-hex');
      await sc.approve(() => Uint8List.fromList([0x90, 0x00]));

      sc.dispose();

      expect(sc.pendingRequest, isNull);
      expect(sc.lastSignResult, isNull);
    });
  });
}
