/// Unit tests for [ApduHandler] and APDU protocol constants.
///
/// Covers routing, error cases, serialization round-trips, and
/// edge cases (empty data, unknown CLA/INS).
library;

import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/core/models/apdu_message.dart';
import 'package:iron_vault_flutter/protocols/apdu/apdu_constants.dart';
import 'package:iron_vault_flutter/biz/apdu_handler.dart';

void main() {
  late ApduHandler handler;

  setUp(() {
    handler = ApduHandler();
  });

  // ═══════════════════════════════════════════════════════════════════
  // OS / Common command tests
  // ═══════════════════════════════════════════════════════════════════

  test('getVersion returns success with version bytes', () {
    final cmd = ApduCommand(
      cla: Cla.os,
      ins: Ins.getVersion,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isTrue);
    expect(response.sw1, 0x90);
    expect(response.sw2, 0x00);
    expect(response.data, isNotNull);
    expect(String.fromCharCodes(response.data!), equals('0.1.0'));
  });

  test('getAppName returns "IronVault"', () {
    final cmd = ApduCommand(
      cla: Cla.os,
      ins: Ins.getAppName,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isTrue);
    expect(response.data, isNotNull);
    expect(String.fromCharCodes(response.data!), equals('IronVault'));
  });

  // ═══════════════════════════════════════════════════════════════════
  // Error routing tests
  // ═══════════════════════════════════════════════════════════════════

  test('unknown CLA returns CLA_NOT_SUPPORTED (0x6E00)', () {
    final cmd = ApduCommand(
      cla: 0xFF, // intentionally invalid CLA
      ins: 0x01,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.claNotSupported);
    expect(response.sw1, 0x6E);
    expect(response.sw2, 0x00);
  });

  test('unknown INS returns INS_NOT_SUPPORTED (0x6D00)', () {
    final cmd = ApduCommand(
      cla: Cla.os,
      ins: 0xFF, // invalid INS for OS CLA
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.insNotSupported);
    expect(response.sw1, 0x6D);
    expect(response.sw2, 0x00);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Empty command (no data) edge case
  // ═══════════════════════════════════════════════════════════════════

  test('empty command (no data) is handled correctly', () {
    final cmd = ApduCommand(
      cla: Cla.os,
      ins: Ins.getVersion,
      p1: 0,
      p2: 0,
      // data is null — no payload
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isTrue);
    expect(response.data, isNotNull);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Serialization round-trip tests
  // ═══════════════════════════════════════════════════════════════════

  test('ApduCommand serialization round-trip preserves all fields', () {
    final original = ApduCommand(
      cla: Cla.os,
      ins: Ins.getVersion,
      p1: 0x01,
      p2: 0x02,
      data: null,
    );

    final bytes = original.toBytes();
    final restored = ApduCommand.fromBytes(bytes);

    expect(restored.cla, original.cla);
    expect(restored.ins, original.ins);
    expect(restored.p1, original.p1);
    expect(restored.p2, original.p2);
    expect(restored.data, isNull);
  });

  test('ApduCommand with data serialization round-trip', () {
    final original = ApduCommand(
      cla: Cla.os,
      ins: Ins.signEthTx,
      p1: 0,
      p2: 0,
      data: Uint8List.fromList([0x01, 0x02, 0x03, 0x04]),
    );

    final bytes = original.toBytes();
    final restored = ApduCommand.fromBytes(bytes);

    expect(restored.cla, original.cla);
    expect(restored.ins, original.ins);
    expect(restored.data, isNotNull);
    expect(restored.data!.length, 4);
    expect(restored.data!, equals([0x01, 0x02, 0x03, 0x04]));
  });

  test('ApduResponse serialization round-trip preserves data and status', () {
    final original = ApduResponse(
      data: Uint8List.fromList([0xAA, 0xBB, 0xCC]),
      sw1: 0x90,
      sw2: 0x00,
    );

    final bytes = original.toBytes();
    final restored = ApduResponse.fromBytes(bytes);

    expect(restored.sw1, original.sw1);
    expect(restored.sw2, original.sw2);
    expect(restored.statusWord, Sw.success);
    expect(restored.isSuccess, isTrue);
    expect(restored.data, isNotNull);
    expect(restored.data!, equals([0xAA, 0xBB, 0xCC]));
  });

  test('ApduResponse error round-trip (no data)', () {
    final original = ApduResponse(
      data: null,
      sw1: 0x6E,
      sw2: 0x00,
    );

    final bytes = original.toBytes();
    final restored = ApduResponse.fromBytes(bytes);

    expect(restored.isSuccess, isFalse);
    expect(restored.statusWord, Sw.claNotSupported);
    expect(restored.data, isNull);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Sw.isSuccess helper tests
  // ═══════════════════════════════════════════════════════════════════

  test('Sw.isSuccess correctly identifies success and error codes', () {
    expect(Sw.isSuccess(Sw.success), isTrue);
    expect(Sw.isSuccess(Sw.insNotSupported), isFalse);
    expect(Sw.isSuccess(Sw.claNotSupported), isFalse);
    expect(Sw.isSuccess(Sw.unknownError), isFalse);
    expect(Sw.isSuccess(Sw.conditionsNotSatisfied), isFalse);
    expect(Sw.isSuccess(Sw.wrongDataLength), isFalse);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Chain handler — context-required tests
  // ═══════════════════════════════════════════════════════════════════
  //
  // These INS codes are now implemented but require wallet context
  // (mnemonic + passphrase). Without context, they return
  // CONDITIONS_NOT_SATISFIED.

  test('Bitcoin get-address without context returns CONDITIONS_NOT_SATISFIED', () {
    final cmd = ApduCommand(
      cla: Cla.bitcoin,
      ins: Ins.btcGetWalletPublicKey,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.conditionsNotSatisfied);
  });

  test('Bitcoin extended sign-tx without context returns CONDITIONS_NOT_SATISFIED', () {
    final cmd = ApduCommand(
      cla: Cla.bitcoinExt,
      ins: Ins.btcSignTx,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.conditionsNotSatisfied);
  });

  test('Tron get-address without context returns CONDITIONS_NOT_SATISFIED', () {
    final cmd = ApduCommand(
      cla: Cla.tron,
      ins: Ins.tronGetPublicKey,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.conditionsNotSatisfied);
  });

  test('Sui get-address without context returns CONDITIONS_NOT_SATISFIED', () {
    final cmd = ApduCommand(
      cla: Cla.sui,
      ins: Ins.suiGetPublicKey,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.conditionsNotSatisfied);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Chain handler — unknown INS tests
  // ═══════════════════════════════════════════════════════════════════

  test('Bitcoin CLA with unknown INS returns INS_NOT_SUPPORTED', () {
    final cmd = ApduCommand(
      cla: Cla.bitcoin,
      ins: 0xFF,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.insNotSupported);
  });

  test('Tron CLA with unknown INS returns INS_NOT_SUPPORTED', () {
    final cmd = ApduCommand(
      cla: Cla.tron,
      ins: 0xFF,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.insNotSupported);
  });

  test('Sui CLA with unknown INS returns INS_NOT_SUPPORTED', () {
    final cmd = ApduCommand(
      cla: Cla.sui,
      ins: 0xFF,
      p1: 0,
      p2: 0,
    );

    final response = handler.handle(cmd);

    expect(response.isSuccess, isFalse);
    expect(response.statusWord, Sw.insNotSupported);
  });
}
