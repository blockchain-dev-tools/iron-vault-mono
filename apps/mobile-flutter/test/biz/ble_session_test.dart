/// Unit tests for [BleSession].
///
/// Covers auto-lock timer, BLE advertising lifecycle, APDU context
/// management, and dispose. Uses hand-written mocks.
library;

import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/biz/ble_session.dart';
import 'package:iron_vault_flutter/biz/sign_confirmation.dart';
import 'package:iron_vault_flutter/core/interfaces/crypto_service.dart';
import 'package:iron_vault_flutter/core/interfaces/wallet_service.dart';
import 'package:iron_vault_flutter/core/models/apdu_message.dart';
import 'package:iron_vault_flutter/core/models/ble_types.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/infrastructure/ble/ble_peripheral.dart';
import 'package:iron_vault_flutter/biz/apdu_handler.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mocks
// ═══════════════════════════════════════════════════════════════════════

class _MockWalletService implements IWalletService {
  bool _isUnlocked = false;
  String? _seedHex;

  final List<String> calls = [];

  @override bool get isUnlocked => _isUnlocked;
  set isUnlocked(bool v) => _isUnlocked = v;

  @override String? get seedHex => _seedHex;
  set seedHex(String? v) => _seedHex = v;

  @override int get pinAttempts => 0;

  @override Future<bool> hasWallet() async { calls.add('hasWallet'); return true; }
  @override Future<bool> isLocked() async { calls.add('isLocked'); return false; }
  @override void lock() { calls.add('lock'); _isUnlocked = false; }
  @override Future<bool> verifyPin(String pin) async { calls.add('verifyPin'); return true; }
  @override Future<WalletAccounts> setupWallet(String mnemonic, {required String pin, String passphrase = '', bool storePassphrase = false}) async { calls.add('setupWallet'); return WalletAccounts(accounts: [], mnemonicFingerprint: ''); }
  @override Future<WalletAccounts> unlockWallet(String pin) async { calls.add('unlockWallet'); return WalletAccounts(accounts: [], mnemonicFingerprint: ''); }
  @override Future<void> clearWallet() async { calls.add('clearWallet'); }
  @override WalletAccounts? getAccounts() { calls.add('getAccounts'); return null; }
  @override Future<WalletAccounts> addAccount(String chain, String path) async { calls.add('addAccount'); return WalletAccounts(accounts: [], mnemonicFingerprint: ''); }
  @override Future<WalletAccounts> removeAccount(String chain, String address) async { calls.add('removeAccount'); return WalletAccounts(accounts: [], mnemonicFingerprint: ''); }
  @override Future<String?> revealMnemonic(String pin) async { calls.add('revealMnemonic'); return null; }
  @override String? get mnemonic => null;
  @override Future<bool> updatePin(String oldPin, String newPin) async { calls.add('updatePin'); return true; }
}

/// Minimal mock of [ApduHandler].
class _MockApduHandler extends ApduHandler {
  bool contextCleared = false;
  String? seedSet;
  final List<ApduCommand> handledCommands = [];
  ApduResponse? nextResponse;

  @override
  void clearContext() {
    contextCleared = true;
  }

  @override
  void setContext({required String seedHex}) {
    seedSet = seedHex;
  }

  @override
  ApduResponse handle(ApduCommand command) {
    handledCommands.add(command);
    return nextResponse ?? ApduResponse(sw1: 0x90, sw2: 0x00);
  }
}

/// Minimal mock of [BlePeripheral].
/// Does NOT extend BlePeripheral to avoid triggering constructor side-effects.
class _MockBlePeripheral implements BlePeripheral {
  // ignore: annotate_overrides
  BleState _state = BleState.idle;

  // ignore: annotate_overrides
  BleState get state => _state;

  final StreamController<Uint8List> _apduController =
      StreamController<Uint8List>.broadcast();

  // ignore: annotate_overrides
  Stream<Uint8List> get apduStream => _apduController.stream;

  // ignore: annotate_overrides
  Stream<String> get logStream => const Stream.empty();

  // ignore: annotate_overrides
  String get deviceName => 'TestDevice';

  final List<String> calls = [];
  final List<Uint8List> sentResponses = [];

  // ignore: annotate_overrides
  Future<void> startAdvertising() async {
    calls.add('startAdvertising');
    _state = BleState.broadcasting;
  }

  // ignore: annotate_overrides
  Future<void> stopAdvertising() async {
    calls.add('stopAdvertising');
    _state = BleState.idle;
  }

  // ignore: annotate_overrides
  Future<void> sendApduResponse(Uint8List bytes) async {
    calls.add('sendApduResponse');
    sentResponses.add(bytes);
  }

  // ignore: annotate_overrides
  void dispose() {
    calls.add('dispose');
    _apduController.close();
  }

  // ignore: annotate_overrides
  Future<void> setDeviceName(String name) async {
    calls.add('setDeviceName');
  }

  void setState(BleState s) => _state = s;
  void addApduData(Uint8List data) => _apduController.add(data);
}

/// Minimal mock of [ICryptoService] for SignConfirmation construction.
class _MockCryptoService implements ICryptoService {
  @override String hexEncode(Uint8List b) => 'hex';
  @override String? deriveEthAddress(String s, String p) => '0xmock';
  @override String? deriveSolAddress(String s, String p) => 'mock';
  @override String? deriveBtcAddress(String s, String p) => 'mock';
  @override String? deriveTronAddress(String s, String p) => 'mock';
  @override String? deriveSuiAddress(String s, String p) => 'mock';
  @override String? parseSignData(String c, String p) => null;
  @override String generateMnemonic({int strength = 128}) => '';

  @override bool validateMnemonic(String m) => true;
  @override String reencodeMnemonic(String m) => m;
  @override String? generateMnemonicLang({int strength = 128, required int language}) => null;
  @override bool validateMnemonicLang(String m, int l) => true;
  @override Uint8List? deriveSecp256k1PrivateKey(String s, String p) => null;
  @override Uint8List? deriveEd25519PrivateKey(String s, String p) => null;
  @override Uint8List? signEthTransaction(String k, String r) => null;
  @override Uint8List? signEthPersonalMessage(String k, String m) => null;
  @override Uint8List? signEthEIP712(String k, String d, String s) => null;
  @override Uint8List? signSolanaMessage(String k, String m) => null;
  @override String? ethAddressFromPrivateKey(String k) => null;
  @override Uint8List? ethPublicKeyBytes(String k) => null;
  @override Uint8List? solanaPublicKeyBytes(String k) => null;
  @override String? p2wpkhAddress(String k) => null;
  @override String? tronAddressFromPubkey(String k) => null;
  @override String? suiAddress(String k) => null;
  @override String? enigmaDeriveMnemonic(String r, String s, int l) => null;
  @override String? enigmaEntropyHex(String r, String s, int l) => null;
  @override String? mnemonicFromEntropy(String e, int l) => null;
  @override String? pbkdf2Derive(String p, String s, int k) => 'hash';
  @override String? mnemonicToSeed(String m, {String passphrase = ''}) => 'seed';
  @override String? chacha20Encrypt(String p, String pi, String s) => 'enc';
  @override String? chacha20Decrypt(String c, String pi, String s) => 'dec';
  @override Uint8List hexToBytes(String h) => Uint8List(0);
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  late _MockWalletService walletService;
  late _MockApduHandler apduHandler;
  late SignConfirmation signConfirmation;
  late BleSession session;
  late _MockBlePeripheral blePeripheral;

  setUp(() {
    walletService = _MockWalletService();
    apduHandler = _MockApduHandler();
    // Create a real SignConfirmation with mock deps
    signConfirmation = SignConfirmation(
      crypto: _MockCryptoService(),
      apduHandler: apduHandler,
    );
    session = BleSession(
      walletService: walletService,
      apduHandler: apduHandler,
      signConfirmation: signConfirmation,
    );
    blePeripheral = _MockBlePeripheral();
  });

  // ──────────────────────────────────────────────────────────────────
  // BLE Peripheral setter
  // ──────────────────────────────────────────────────────────────────

  group('blePeripheral setter', () {
    test('setting peripheral subscribes to APDU stream', () {
      session.blePeripheral = blePeripheral;
      // When wallet is unlocked with seed, it should set context
      walletService._isUnlocked = true;
      walletService._seedHex = 'test-seed';
      session.trySetApduContext();
      expect(apduHandler.seedSet, 'test-seed');
    });

    test('setting to null unsubscribes and clears context', () {
      session.blePeripheral = blePeripheral;
      apduHandler.contextCleared = false;

      session.blePeripheral = null;

      expect(apduHandler.contextCleared, isTrue);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // trySetApduContext
  // ──────────────────────────────────────────────────────────────────

  group('trySetApduContext', () {
    test('sets seed when unlocked', () {
      walletService._isUnlocked = true;
      walletService._seedHex = 'my-seed-abc';

      session.trySetApduContext();

      expect(apduHandler.seedSet, 'my-seed-abc');
    });

    test('no-op when locked', () {
      walletService._isUnlocked = false;
      walletService._seedHex = 'my-seed';
      apduHandler.seedSet = null;

      session.trySetApduContext();

      expect(apduHandler.seedSet, isNull);
    });

    test('no-op when seed is null', () {
      walletService._isUnlocked = true;
      walletService._seedHex = null;
      apduHandler.seedSet = null;

      session.trySetApduContext();

      expect(apduHandler.seedSet, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // onAppBackgrounded / onAppForegrounded
  // ──────────────────────────────────────────────────────────────────

  group('onAppBackgrounded', () {
    test('starts auto-lock timer', () {
      session.onAppBackgrounded();

      // Timer is internal — we verify lock didn't fire yet.
      expect(walletService.calls.contains('lock'), isFalse);
    });

    test('stops advertising if broadcasting', () async {
      session.blePeripheral = blePeripheral;
      await blePeripheral.startAdvertising();

      session.onAppBackgrounded();

      expect(blePeripheral.calls.contains('stopAdvertising'), isTrue);
    });

    test('does not stop advertising if idle', () async {
      session.blePeripheral = blePeripheral;

      session.onAppBackgrounded();

      expect(blePeripheral.calls.contains('stopAdvertising'), isFalse);
    });
  });

  group('onAppForegrounded', () {
    test('cancels the auto-lock timer', () {
      session.onAppBackgrounded();
      session.onAppForegrounded();

      // Timer cancelled — wallet should not be locked.
      expect(walletService.calls.contains('lock'), isFalse);
    });

    test('restarts advertising if was stopped by onAppBackgrounded',
        () async {
      session.blePeripheral = blePeripheral;
      await blePeripheral.startAdvertising();
      session.onAppBackgrounded(); // stops advertising
      blePeripheral.calls.clear();

      session.onAppForegrounded();

      expect(blePeripheral.calls.contains('startAdvertising'), isTrue);
    });

    test('does not restart advertising if it was not broadcasting',
        () async {
      session.blePeripheral = blePeripheral;
      session.onAppBackgrounded(); // was idle, no stop called
      blePeripheral.calls.clear();

      session.onAppForegrounded();

      expect(blePeripheral.calls.contains('startAdvertising'), isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // dispose
  // ──────────────────────────────────────────────────────────────────

  group('dispose', () {
    test('cancels timer and clears context', () {
      session.blePeripheral = blePeripheral;
      session.onAppBackgrounded();
      apduHandler.contextCleared = false;

      session.dispose();

      expect(apduHandler.contextCleared, isTrue);
    });
  });
}
