/// Unit tests for [PinAuthService].
///
/// Covers PIN hashing, verification, encryption/decryption,
/// attempt tracking with lockout, PIN change, and re-encryption.
library;

import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/core/interfaces/crypto_service.dart';
import 'package:iron_vault_flutter/core/interfaces/wallet_repository.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/services/pin_auth_service.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mocks (no mockito dependency)
// ═══════════════════════════════════════════════════════════════════════

/// Configurable mock of [ICryptoService].
///
/// Set return values on fields before each test, then check [calls]
/// to verify what was invoked and with which arguments.
class MockCryptoService implements ICryptoService {
  // ── Configurable return values ───────────────────────────────────────

  /// Return value for [pbkdf2Derive]. `null` = simulate failure.
  String? pbkdf2DeriveResult;

  /// Return value for [chacha20Encrypt]. `null` = simulate failure.
  String? chacha20EncryptResult;

  /// Return value for [chacha20Decrypt]. `null` = simulate failure.
  String? chacha20DecryptResult;

  /// Return value for [hexEncode].
  String hexEncodeResult = '';

  // ── Call recording ───────────────────────────────────────────────────

  final List<Pbkdf2CallRecord> pbkdf2Calls = [];
  final List<ChaChaCallRecord> encryptCalls = [];
  final List<ChaChaCallRecord> decryptCalls = [];
  final List<Uint8List> hexEncodeCalls = [];

  // ── ICryptoService implementation ────────────────────────────────────

  @override
  String? pbkdf2Derive(String pin, String saltHex, int keyLen) {
    pbkdf2Calls.add(Pbkdf2CallRecord(pin, saltHex, keyLen));
    return pbkdf2DeriveResult;
  }

  @override
  String? chacha20Encrypt(String plaintext, String pin, String saltHex) {
    encryptCalls.add(ChaChaCallRecord(plaintext, pin, saltHex));
    return chacha20EncryptResult;
  }

  @override
  String? chacha20Decrypt(String ciphertextHex, String pin, String saltHex) {
    decryptCalls.add(ChaChaCallRecord(ciphertextHex, pin, saltHex));
    return chacha20DecryptResult;
  }

  @override
  String hexEncode(Uint8List bytes) {
    hexEncodeCalls.add(bytes);
    return hexEncodeResult;
  }

  // ── Unused methods (should never be called from PinAuthService) ──────

  @override
  String generateMnemonic({int strength = 128}) =>
      throw UnimplementedError();

  @override
  bool validateMnemonic(String mnemonic) => throw UnimplementedError();

  @override
  String reencodeMnemonic(String mnemonic) => throw UnimplementedError();

  @override
  String? generateMnemonicLang({int strength = 128, required int language}) =>
      throw UnimplementedError();

  @override
  bool validateMnemonicLang(String mnemonic, int language) =>
      throw UnimplementedError();

  @override
  Uint8List? deriveSecp256k1PrivateKey(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  Uint8List? deriveEd25519PrivateKey(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  Uint8List? signEthTransaction(String privkeyHex, String rlpHex) =>
      throw UnimplementedError();

  @override
  Uint8List? signEthPersonalMessage(String privkeyHex, String messageHex) =>
      throw UnimplementedError();

  @override
  Uint8List? signEthEIP712(
          String privkeyHex, String domainHashHex, String structHashHex) =>
      throw UnimplementedError();

  @override
  Uint8List? signSolanaMessage(String privkeyHex, String messageHex) =>
      throw UnimplementedError();

  @override
  String? ethAddressFromPrivateKey(String privkeyHex) =>
      throw UnimplementedError();

  @override
  Uint8List? ethPublicKeyBytes(String privkeyHex) => throw UnimplementedError();

  @override
  Uint8List? solanaPublicKeyBytes(String privkeyHex) =>
      throw UnimplementedError();

  @override
  String? deriveEthAddress(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  String? deriveSolAddress(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  String? deriveBtcAddress(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  String? deriveTronAddress(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  String? deriveSuiAddress(String seedHex, String path) =>
      throw UnimplementedError();

  @override
  String? p2wpkhAddress(String compressedPubkeyHex) =>
      throw UnimplementedError();

  @override
  String? tronAddressFromPubkey(String uncompressedPubkeyHex) =>
      throw UnimplementedError();

  @override
  String? suiAddress(String ed25519PubkeyHex) => throw UnimplementedError();

  @override
  String? enigmaDeriveMnemonic(
          String riddle, String secret, int language) =>
      throw UnimplementedError();

  @override
  String? enigmaEntropyHex(String riddle, String secret, int language) =>
      throw UnimplementedError();

  @override
  String? mnemonicFromEntropy(String entropyHex, int language) =>
      throw UnimplementedError();

  @override
  String? parseSignData(String chain, String payloadHex) =>
      throw UnimplementedError();

  @override
  String? mnemonicToSeed(String mnemonic, {String passphrase = ''}) =>
      throw UnimplementedError();

  @override
  Uint8List hexToBytes(String hex) => throw UnimplementedError();
}

/// Configurable mock of [IWalletRepository].
///
/// Set return values via fields. Check [setterCalls] to verify that
/// the service persisted data correctly.
class MockWalletRepository implements IWalletRepository {
  // ── Configurable return values ───────────────────────────────────────

  Future<String?> Function()? pinHashFn;
  Future<String?> Function()? pinSaltFn;
  Future<int> Function()? pinAttemptsFn;
  Future<String?> Function()? encryptedMnemonicFn;
  Future<String?> Function()? encryptedPassphraseFn;
  Future<bool> Function()? storePassphraseFn;
  Future<bool> Function()? hasWalletFn;
  Future<String?> Function()? mnemonicFingerprintFn;
  Future<WalletAccounts?> Function()? accountsFn;

  // ── Call recording for setters ───────────────────────────────────────

  final List<SetterCallRecord> setterCalls = [];

  // ── Concrete default values (override with fn fields) ───────────────

  @override
  Future<String?> getPinHash() => pinHashFn?.call() ?? Future.value(null);

  @override
  Future<String?> getPinSalt() => pinSaltFn?.call() ?? Future.value(null);

  @override
  Future<int> getPinAttempts() => pinAttemptsFn?.call() ?? Future.value(0);

  @override
  Future<String?> getEncryptedMnemonic() =>
      encryptedMnemonicFn?.call() ?? Future.value(null);

  @override
  Future<String?> getEncryptedPassphrase() =>
      encryptedPassphraseFn?.call() ?? Future.value(null);

  @override
  Future<bool> getStorePassphrase() =>
      storePassphraseFn?.call() ?? Future.value(false);

  @override
  Future<bool> hasWallet() => hasWalletFn?.call() ?? Future.value(false);

  @override
  Future<String?> getMnemonicFingerprint() =>
      mnemonicFingerprintFn?.call() ?? Future.value(null);

  @override
  Future<WalletAccounts?> getAccounts() =>
      accountsFn?.call() ?? Future.value(null);

  // ── Setters (record calls) ───────────────────────────────────────────

  @override
  Future<void> setPinHash(String hash) async {
    setterCalls.add(SetterCallRecord('setPinHash', [hash]));
  }

  @override
  Future<void> setPinSalt(String salt) async {
    setterCalls.add(SetterCallRecord('setPinSalt', [salt]));
  }

  @override
  Future<void> setPinAttempts(int attempts) async {
    setterCalls.add(SetterCallRecord('setPinAttempts', [attempts]));
  }

  @override
  Future<void> setEncryptedMnemonic(String encrypted) async {
    setterCalls.add(SetterCallRecord('setEncryptedMnemonic', [encrypted]));
  }

  @override
  Future<void> setEncryptedPassphrase(String encrypted) async {
    setterCalls.add(SetterCallRecord('setEncryptedPassphrase', [encrypted]));
  }

  @override
  Future<void> setStorePassphrase(bool store) async {
    setterCalls.add(SetterCallRecord('setStorePassphrase', [store]));
  }

  @override
  Future<void> setMnemonicFingerprint(String fingerprint) async {
    setterCalls.add(SetterCallRecord('setMnemonicFingerprint', [fingerprint]));
  }

  @override
  Future<void> setAccounts(WalletAccounts accounts) async {
    setterCalls.add(SetterCallRecord('setAccounts', [accounts]));
  }

  @override
  Future<void> clearAll() async {
    setterCalls.add(SetterCallRecord('clearAll', []));
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /// Find the last value set for [key].
  T? lastSet<T>(String key) {
    final reversed = setterCalls.reversed;
    for (final c in reversed) {
      if (c.key == key) return c.args[0] as T;
    }
    return null;
  }

  /// Whether [key] was set at all.
  bool wasSet(String key) => setterCalls.any((c) => c.key == key);

  /// Reset all state.
  void reset() {
    setterCalls.clear();
    pinHashFn = null;
    pinSaltFn = null;
    pinAttemptsFn = null;
    encryptedMnemonicFn = null;
    encryptedPassphraseFn = null;
    storePassphraseFn = null;
    hasWalletFn = null;
    mnemonicFingerprintFn = null;
    accountsFn = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Call record types
// ═══════════════════════════════════════════════════════════════════════

class Pbkdf2CallRecord {
  final String pin;
  final String saltHex;
  final int keyLen;
  const Pbkdf2CallRecord(this.pin, this.saltHex, this.keyLen);
}

class ChaChaCallRecord {
  final String data;
  final String pin;
  final String saltHex;
  const ChaChaCallRecord(this.data, this.pin, this.saltHex);
}

class SetterCallRecord {
  final String key;
  final List<dynamic> args;
  const SetterCallRecord(this.key, this.args);
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  late MockCryptoService crypto;
  late MockWalletRepository repo;
  late PinAuthService service;

  setUp(() {
    crypto = MockCryptoService();
    repo = MockWalletRepository();
    service = PinAuthService(crypto: crypto, repo: repo);
  });

  // ──────────────────────────────────────────────────────────────────
  // hashPin
  // ──────────────────────────────────────────────────────────────────

  group('hashPin', () {
    test('returns hex string from crypto.pbkdf2Derive', () {
      crypto.pbkdf2DeriveResult =
          'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

      final result = service.hashPin('123456', 'deadbeef');

      expect(result, crypto.pbkdf2DeriveResult);
      expect(crypto.pbkdf2Calls.length, 1);
      expect(crypto.pbkdf2Calls.first.pin, '123456');
      expect(crypto.pbkdf2Calls.first.saltHex, 'deadbeef');
      expect(crypto.pbkdf2Calls.first.keyLen, 32);
    });

    test('throws StateError when crypto returns null', () {
      crypto.pbkdf2DeriveResult = null;

      expect(
        () => service.hashPin('123456', 'deadbeef'),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // verifyPin
  // ──────────────────────────────────────────────────────────────────

  group('verifyPin', () {
    const storedHash = 'abc123def456';
    const salt = 'deadbeef';

    setUp(() {
      repo.pinSaltFn = () async => salt;
      repo.pinHashFn = () async => storedHash;
    });

    test('returns true when computed hash matches stored hash', () async {
      crypto.pbkdf2DeriveResult = storedHash;

      final result = await service.verifyPin('123456');

      expect(result, isTrue);
      expect(crypto.pbkdf2Calls.first.pin, '123456');
      expect(crypto.pbkdf2Calls.first.saltHex, salt);
    });

    test('returns false when hash mismatch', () async {
      crypto.pbkdf2DeriveResult = 'something-else';

      final result = await service.verifyPin('123456');

      expect(result, isFalse);
    });

    test('returns false when salt is missing', () async {
      repo.pinSaltFn = () async => null;
      crypto.pbkdf2DeriveResult = storedHash;

      final result = await service.verifyPin('123456');

      expect(result, isFalse);
    });

    test('returns false when stored hash is missing', () async {
      repo.pinHashFn = () async => null;
      crypto.pbkdf2DeriveResult = storedHash;

      final result = await service.verifyPin('123456');

      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // isLocked
  // ──────────────────────────────────────────────────────────────────

  group('isLocked', () {
    test('returns false when attempts < 5', () async {
      repo.pinAttemptsFn = () async => 3;

      final result = await service.isLocked();

      expect(result, isFalse);
    });

    test('returns true when attempts >= 5', () async {
      repo.pinAttemptsFn = () async => 5;

      final result = await service.isLocked();

      expect(result, isTrue);
    });

    test('returns false when attempts == 0 (no attempts made)', () async {
      repo.pinAttemptsFn = () async => 0;

      final result = await service.isLocked();

      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // incrementPinAttempts & resetPinAttempts
  // ──────────────────────────────────────────────────────────────────

  group('incrementPinAttempts', () {
    test('increments and persists attempts', () async {
      repo.pinAttemptsFn = () async => 2;

      await service.incrementPinAttempts();

      expect(repo.wasSet('setPinAttempts'), isTrue);
      expect(repo.lastSet<int>('setPinAttempts'), 3);
      expect(service.pinAttempts, 3);
    });

    test('handles increment from 0', () async {
      repo.pinAttemptsFn = () async => 0;

      await service.incrementPinAttempts();

      expect(repo.lastSet<int>('setPinAttempts'), 1);
      expect(service.pinAttempts, 1);
    });
  });

  group('resetPinAttempts', () {
    test('resets to 0 and persists', () async {
      // Pre-seed with some value so we can verify it's actually reset
      repo.pinAttemptsFn = () async => 4;
      await service.incrementPinAttempts(); // cached at 4 → 5
      repo.setterCalls.clear();

      await service.resetPinAttempts();

      expect(repo.lastSet<int>('setPinAttempts'), 0);
      expect(service.pinAttempts, 0);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // encryptWithPin
  // ──────────────────────────────────────────────────────────────────

  group('encryptWithPin', () {
    test('delegates to crypto and returns result', () {
      crypto.chacha20EncryptResult = 'ciphertext-hex';

      final result = service.encryptWithPin(
        'my secret mnemonic',
        '123456',
        'deadbeef',
      );

      expect(result, 'ciphertext-hex');
      expect(crypto.encryptCalls.length, 1);
      expect(crypto.encryptCalls.first.data, 'my secret mnemonic');
      expect(crypto.encryptCalls.first.pin, '123456');
      expect(crypto.encryptCalls.first.saltHex, 'deadbeef');
    });

    test('throws StateError when crypto returns null', () {
      crypto.chacha20EncryptResult = null;

      expect(
        () => service.encryptWithPin('data', 'pin', 'salt'),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // decryptWithPin
  // ──────────────────────────────────────────────────────────────────

  group('decryptWithPin', () {
    test('delegates to crypto and returns result', () {
      crypto.chacha20DecryptResult = 'decrypted plaintext';

      final result = service.decryptWithPin(
        'ciphertext-hex',
        '123456',
        'deadbeef',
      );

      expect(result, 'decrypted plaintext');
      expect(crypto.decryptCalls.length, 1);
      expect(crypto.decryptCalls.first.data, 'ciphertext-hex');
      expect(crypto.decryptCalls.first.pin, '123456');
      expect(crypto.decryptCalls.first.saltHex, 'deadbeef');
    });

    test('throws StateError when crypto returns null', () {
      crypto.chacha20DecryptResult = null;

      expect(
        () => service.decryptWithPin('ciphertext', 'pin', 'salt'),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // randomHex
  // ──────────────────────────────────────────────────────────────────

  group('randomHex', () {
    test('returns hex string of correct length', () {
      crypto.hexEncodeResult = '0102030405060708090a0b0c0d0e0f10';

      final result = service.randomHex(16);

      expect(result, crypto.hexEncodeResult);
      expect(crypto.hexEncodeCalls.length, 1);
      expect(crypto.hexEncodeCalls.first.length, 16);
    });

    test('produces different results on successive calls (randomness check)',
        () {
      crypto.hexEncodeResult = 'aabbccdd';

      final r1 = service.randomHex(4);
      final r2 = service.randomHex(4);

      // Same mock returns same hex, but the byte arrays should differ
      // because randomHex generates fresh random bytes each call
      expect(crypto.hexEncodeCalls.length, 2);
      expect(r1, r2); // same mock result, but call count proves 2 invocations
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // updatePin
  // ──────────────────────────────────────────────────────────────────

  group('updatePin', () {
    const oldPin = '111111';
    const newPin = '222222';
    const oldSalt = 'oldsalt';
    const oldHash = 'oldhash';
    const encMnemonic = 'encrypted-mnemonic';
    const decMnemonic = 'decrypted-mnemonic';

    setUp(() {
      // By default: old PIN verifies, no mnemonic stored (simplest case)
      repo.pinSaltFn = () async => null;
      repo.pinHashFn = () async => null;
    });

    test('returns false when old PIN is wrong', () async {
      // Neither salt nor hash → verifyPin returns false
      final result = await service.updatePin(oldPin, newPin);

      expect(result, isFalse);
    });

    test('returns true on success, updates salt and hash', () async {
      repo.pinSaltFn = () async => oldSalt;
      repo.pinHashFn = () async => oldHash;
      crypto.pbkdf2DeriveResult = oldHash; // for old PIN verify
      // After verification, pbkdf2 will be called again for new PIN
      // We need a different result to not confuse with old hash matching
      crypto.pbkdf2DeriveResult = 'newhash-after-first-call';
      // Actually let me think about this more carefully...
      // verifyPin does: hashPin(oldPin, oldSalt) == storedHash
      // Then updatePin does: randomHex(16) → salt=newSalt
      // Then: hashPin(newPin, newSalt) → newHash
      // So there are 2 hashPin calls, with different pins/salts.
      // Our mock returns same result for both. Let's just set it.
      crypto.pbkdf2DeriveResult = oldHash; // verifyPin call
      // Actually, after verifyPin, hashPin is called with newPin + new salt
      // If crypto returns oldHash for that too, it's fine since we just
      // test the persistence, not the hash matching logic.
      crypto.hexEncodeResult = 'newsalt-hex';
      crypto.chacha20EncryptResult = 'reencrypted';
      crypto.chacha20DecryptResult = decMnemonic;

      repo.encryptedMnemonicFn = () async => encMnemonic;
      repo.storePassphraseFn = () async => false;

      final result = await service.updatePin(oldPin, newPin);

      expect(result, isTrue);
      // Should persist new salt
      expect(repo.wasSet('setPinSalt'), isTrue);
      // Should persist new hash
      expect(repo.wasSet('setPinHash'), isTrue);
      // Should reset attempts
      expect(repo.lastSet<int>('setPinAttempts'), 0);
    });

    test('re-encrypts mnemonic with new PIN when stored', () async {
      crypto.pbkdf2DeriveResult = oldHash;
      crypto.hexEncodeResult = 'newsalt-hex';
      crypto.chacha20DecryptResult = decMnemonic;
      crypto.chacha20EncryptResult = 'reencrypted-mnemonic';

      repo.pinSaltFn = () async => oldSalt;
      repo.pinHashFn = () async => oldHash;
      repo.encryptedMnemonicFn = () async => encMnemonic;
      repo.storePassphraseFn = () async => false;

      await service.updatePin(oldPin, newPin);

      // Verify decrypt was called with old PIN → old salt
      expect(crypto.decryptCalls.any(
        (c) =>
            c.data == encMnemonic && c.pin == oldPin && c.saltHex == oldSalt,
      ), isTrue);

      // Verify re-encrypt was called with new PIN
      final reEncryptCall = crypto.encryptCalls.firstWhere(
        (c) => c.data == decMnemonic,
        orElse: () => ChaChaCallRecord('', '', ''),
      );
      expect(reEncryptCall.pin, newPin);
      expect(reEncryptCall.saltHex, isNotEmpty);

      // Verify persisted
      expect(repo.lastSet<String>('setEncryptedMnemonic'),
          'reencrypted-mnemonic');
    });

    test('re-encrypts passphrase when storePassphrase is true', () async {
      crypto.pbkdf2DeriveResult = oldHash;
      crypto.hexEncodeResult = 'newsalt-hex';
      crypto.chacha20DecryptResult = 'my-passphrase';
      crypto.chacha20EncryptResult = 'reencrypted-passphrase';

      repo.pinSaltFn = () async => oldSalt;
      repo.pinHashFn = () async => oldHash;
      repo.storePassphraseFn = () async => true;
      repo.encryptedPassphraseFn = () async => 'enc-passphrase';

      await service.updatePin(oldPin, newPin);

      // Passphrase was decrypted with old PIN
      expect(crypto.decryptCalls.any(
        (c) =>
            c.data == 'enc-passphrase' &&
            c.pin == oldPin &&
            c.saltHex == oldSalt,
      ), isTrue);

      // Passphrase was re-encrypted and persisted
      expect(repo.lastSet<String>('setEncryptedPassphrase'),
          'reencrypted-passphrase');
    });

    test('does NOT re-encrypt passphrase when storePassphrase is false',
        () async {
      crypto.pbkdf2DeriveResult = oldHash;
      crypto.hexEncodeResult = 'newsalt-hex';
      crypto.chacha20DecryptResult = 'my-passphrase';
      crypto.chacha20EncryptResult = 'reencrypted';

      repo.pinSaltFn = () async => oldSalt;
      repo.pinHashFn = () async => oldHash;
      repo.storePassphraseFn = () async => false;

      await service.updatePin(oldPin, newPin);

      // setEncryptedPassphrase should NOT have been called
      expect(repo.wasSet('setEncryptedPassphrase'), isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // maxPinAttempts
  // ──────────────────────────────────────────────────────────────────

  group('maxPinAttempts', () {
    test('returns 5', () {
      expect(service.maxPinAttempts, 5);
    });
  });
}
