/// Unit tests for [WalletService].
///
/// Covers wallet lifecycle orchestration: setup, unlock, lock, clear,
/// account management, PIN delegation, mnemonic caching, and passphrase handling.
///
/// All 4 dependencies are hand-written mocks — no mockito, no Rust .so required.
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/core/interfaces/account_service.dart';
import 'package:iron_vault_flutter/core/interfaces/mnemonic_service.dart';
import 'package:iron_vault_flutter/core/interfaces/pin_auth_service.dart';
import 'package:iron_vault_flutter/core/interfaces/wallet_repository.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/services/wallet_service.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mocks
// ═══════════════════════════════════════════════════════════════════════

/// Configurable mock of [IPinAuthService].
class MockPinAuthService implements IPinAuthService {
  // ── Configurable return values ───────────────────────────────────────

  /// Return value for [randomHex].
  String randomHexResult = '00000000000000000000000000000000';

  /// Return value for [hashPin].
  String hashPinResult = '';

  /// Return value for [encryptWithPin].
  String encryptWithPinResult = '';

  /// Return value for [decryptWithPin] — static, used when [decryptWithPinFn] is null.
  String decryptWithPinResult = '';

  /// Custom decrypt callback (overrides [decryptWithPinResult] when set).
  /// Use this when a test needs different return values for successive calls.
  String? Function(String ciphertextHex, String pin, String salt)? decryptWithPinFn;

  /// Return value for [verifyPin].
  bool verifyPinResult = true;

  /// Whether [isLocked] returns true.
  bool isLockedResult = false;

  /// Return value for [updatePin].
  bool updatePinResult = true;

  /// Backing field for [pinAttempts].
  int _pinAttempts = 0;

  // ── Call recording ───────────────────────────────────────────────────

  final List<_RandomHexCall> randomHexCalls = [];
  final List<_HashPinCall> hashPinCalls = [];
  final List<_EncryptCall> encryptCalls = [];
  final List<_EncryptCall> decryptCalls = [];
  final List<String> verifyPinCalls = [];
  int isLockedCalls = 0;
  int incrementPinAttemptsCalls = 0;
  int resetPinAttemptsCalls = 0;
  final List<_UpdatePinCall> updatePinCalls = [];

  // ── IPinAuthService implementation ───────────────────────────────────

  @override
  String randomHex(int length) {
    randomHexCalls.add(_RandomHexCall(length));
    return randomHexResult;
  }

  @override
  String hashPin(String pin, String salt) {
    hashPinCalls.add(_HashPinCall(pin, salt));
    return hashPinResult;
  }

  @override
  String encryptWithPin(String plaintext, String pin, String salt) {
    encryptCalls.add(_EncryptCall(plaintext, pin, salt));
    return encryptWithPinResult;
  }

  @override
  String decryptWithPin(String ciphertextHex, String pin, String salt) {
    decryptCalls.add(_EncryptCall(ciphertextHex, pin, salt));
    return decryptWithPinFn?.call(ciphertextHex, pin, salt) ??
        decryptWithPinResult;
  }

  @override
  Future<bool> verifyPin(String pin) async {
    verifyPinCalls.add(pin);
    return verifyPinResult;
  }

  @override
  Future<bool> isLocked() async {
    isLockedCalls++;
    return isLockedResult;
  }

  @override
  Future<bool> updatePin(String oldPin, String newPin) async {
    updatePinCalls.add(_UpdatePinCall(oldPin, newPin));
    return updatePinResult;
  }

  @override
  int get pinAttempts => _pinAttempts;

  @override
  int get maxPinAttempts => 5;

  @override
  Future<void> incrementPinAttempts() async {
    incrementPinAttemptsCalls++;
    _pinAttempts++;
  }

  @override
  Future<void> resetPinAttempts() async {
    resetPinAttemptsCalls++;
    _pinAttempts = 0;
  }

  void setPinAttempts(int v) => _pinAttempts = v;
}

/// Configurable mock of [IMnemonicService].
class MockMnemonicService implements IMnemonicService {
  // ── Configurable return values ───────────────────────────────────────

  String mnemonicToSeedHexResult = '';
  String fingerprintMnemonicResult = 'deadbeef';
  String generateMnemonicResult = '';
  bool validateMnemonicResult = true;
  List<String> enigmaResult = const [];

  // ── Call recording ───────────────────────────────────────────────────

  final List<_SeedHexCall> seedHexCalls = [];
  final List<String> fingerprintCalls = [];
  final List<_GenerateCall> generateCalls = [];
  final List<String> validateCalls = [];
  final List<_EnigmaCall> enigmaCalls = [];

  // ── IMnemonicService implementation ──────────────────────────────────

  @override
  String mnemonicToSeedHex(String mnemonic, String passphrase) {
    seedHexCalls.add(_SeedHexCall(mnemonic, passphrase));
    return mnemonicToSeedHexResult;
  }

  @override
  String fingerprintMnemonic(String mnemonic) {
    fingerprintCalls.add(mnemonic);
    return fingerprintMnemonicResult;
  }

  @override
  String generateMnemonic({int strength = 128}) {
    generateCalls.add(_GenerateCall(strength));
    return generateMnemonicResult;
  }

  @override
  bool validateMnemonic(String mnemonic) {
    validateCalls.add(mnemonic);
    return validateMnemonicResult;
  }

  @override
  List<String> generateEnigmaMnemonic(
    String riddle,
    String secret, {
    int language = 0,
  }) {
    enigmaCalls.add(_EnigmaCall(riddle, secret, language));
    return enigmaResult;
  }
}

/// Configurable mock of [IAccountService].
class MockAccountService implements IAccountService {
  // ── Configurable return values ───────────────────────────────────────

  WalletAccounts? deriveDefaultAccountsResult;
  ChainAccount? deriveSingleAccountResult;

  // ── Call recording ───────────────────────────────────────────────────

  final List<_DeriveDefaultCall> deriveDefaultCalls = [];
  final List<_DeriveSingleCall> deriveSingleCalls = [];
  final List<_AddToListCall> addToListCalls = [];
  final List<_RemoveFromListCall> removeFromListCalls = [];

  // ── IAccountService implementation ───────────────────────────────────

  @override
  Future<WalletAccounts> deriveDefaultAccounts(
      String mnemonic, String passphrase, String seedHex) async {
    deriveDefaultCalls
        .add(_DeriveDefaultCall(mnemonic, passphrase, seedHex));
    return deriveDefaultAccountsResult!;
  }

  @override
  Future<ChainAccount?> deriveSingleAccount(
      String chain, String path, String seedHex) async {
    deriveSingleCalls.add(_DeriveSingleCall(chain, path, seedHex));
    return deriveSingleAccountResult;
  }

  @override
  WalletAccounts addAccountToList(
      WalletAccounts accounts, ChainAccount account) {
    addToListCalls.add(_AddToListCall(accounts, account));
    // Simple append — no duplicate check in mock (logic tested in
    // account_service_test.dart). WalletService does its own duplicate check.
    return accounts.copyWith(
      accounts: [...accounts.accounts, account],
    );
  }

  @override
  WalletAccounts removeAccountFromList(
      WalletAccounts accounts, String chain, String address) {
    removeFromListCalls.add(_RemoveFromListCall(accounts, chain, address));
    return accounts.copyWith(
      accounts: accounts.accounts
          .where((a) => !(a.chain == chain && a.address == address))
          .toList(),
    );
  }

  @override
  Map<String, String> get defaultPaths => const {
        'ethereum': "m/44'/60'/0'/0/0",
        'solana': "m/44'/501'/0'/0'",
        'bitcoin': "m/84'/0'/0'/0/0",
        'tron': "m/44'/195'/0'/0/0",
        'sui': "m/44'/784'/0'/0'/0'",
      };
}

/// Configurable mock of [IWalletRepository].
class MockWalletRepository implements IWalletRepository {
  // ── Configurable return values ───────────────────────────────────────

  Future<bool> Function()? hasWalletFn;
  Future<String?> Function()? pinHashFn;
  Future<String?> Function()? pinSaltFn;
  Future<int> Function()? pinAttemptsFn;
  Future<String?> Function()? encryptedMnemonicFn;
  Future<String?> Function()? mnemonicFingerprintFn;
  Future<bool> Function()? storePassphraseFn;
  Future<String?> Function()? encryptedPassphraseFn;
  Future<WalletAccounts?> Function()? accountsFn;

  // ── Call recording for setters ───────────────────────────────────────

  final List<_SetterCall> setterCalls = [];

  // ── IWalletRepository implementation ──────────────────────────────────

  @override
  Future<bool> hasWallet() => hasWalletFn?.call() ?? Future.value(false);

  @override
  Future<String?> getPinHash() => pinHashFn?.call() ?? Future.value(null);

  @override
  Future<String?> getPinSalt() => pinSaltFn?.call() ?? Future.value(null);

  @override
  Future<int> getPinAttempts() =>
      pinAttemptsFn?.call() ?? Future.value(0);

  @override
  Future<String?> getEncryptedMnemonic() =>
      encryptedMnemonicFn?.call() ?? Future.value(null);

  @override
  Future<String?> getMnemonicFingerprint() =>
      mnemonicFingerprintFn?.call() ?? Future.value(null);

  @override
  Future<bool> getStorePassphrase() =>
      storePassphraseFn?.call() ?? Future.value(false);

  @override
  Future<String?> getEncryptedPassphrase() =>
      encryptedPassphraseFn?.call() ?? Future.value(null);

  @override
  Future<WalletAccounts?> getAccounts() =>
      accountsFn?.call() ?? Future.value(null);

  // ── Setters ───────────────────────────────────────────────────────────

  @override
  Future<void> setPinHash(String hash) async {
    setterCalls.add(_SetterCall('setPinHash', [hash]));
  }

  @override
  Future<void> setPinSalt(String salt) async {
    setterCalls.add(_SetterCall('setPinSalt', [salt]));
  }

  @override
  Future<void> setPinAttempts(int attempts) async {
    setterCalls.add(_SetterCall('setPinAttempts', [attempts]));
  }

  @override
  Future<void> setEncryptedMnemonic(String encrypted) async {
    setterCalls.add(_SetterCall('setEncryptedMnemonic', [encrypted]));
  }

  @override
  Future<void> setMnemonicFingerprint(String fingerprint) async {
    setterCalls.add(_SetterCall('setMnemonicFingerprint', [fingerprint]));
  }

  @override
  Future<void> setStorePassphrase(bool store) async {
    setterCalls.add(_SetterCall('setStorePassphrase', [store]));
  }

  @override
  Future<void> setEncryptedPassphrase(String encrypted) async {
    setterCalls.add(_SetterCall('setEncryptedPassphrase', [encrypted]));
  }

  @override
  Future<void> setAccounts(WalletAccounts accounts) async {
    setterCalls.add(_SetterCall('setAccounts', [accounts]));
  }

  @override
  Future<void> clearAll() async {
    setterCalls.add(_SetterCall('clearAll', []));
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  T? lastSet<T>(String key) {
    for (final c in setterCalls.reversed) {
      if (c.key == key) return c.args[0] as T;
    }
    return null;
  }

  bool wasSet(String key) => setterCalls.any((c) => c.key == key);

  void reset() {
    setterCalls.clear();
    hasWalletFn = null;
    pinHashFn = null;
    pinSaltFn = null;
    pinAttemptsFn = null;
    encryptedMnemonicFn = null;
    mnemonicFingerprintFn = null;
    storePassphraseFn = null;
    encryptedPassphraseFn = null;
    accountsFn = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Call record types
// ═══════════════════════════════════════════════════════════════════════

class _RandomHexCall {
  final int length;
  const _RandomHexCall(this.length);
}

class _HashPinCall {
  final String pin;
  final String salt;
  const _HashPinCall(this.pin, this.salt);
}

class _EncryptCall {
  final String data;
  final String pin;
  final String salt;
  const _EncryptCall(this.data, this.pin, this.salt);
}

class _UpdatePinCall {
  final String oldPin;
  final String newPin;
  const _UpdatePinCall(this.oldPin, this.newPin);
}

class _SeedHexCall {
  final String mnemonic;
  final String passphrase;
  const _SeedHexCall(this.mnemonic, this.passphrase);
}

class _GenerateCall {
  final int strength;
  const _GenerateCall(this.strength);
}

class _EnigmaCall {
  final String riddle;
  final String secret;
  final int language;
  const _EnigmaCall(this.riddle, this.secret, this.language);
}

class _DeriveDefaultCall {
  final String mnemonic;
  final String passphrase;
  final String seedHex;
  const _DeriveDefaultCall(this.mnemonic, this.passphrase, this.seedHex);
}

class _DeriveSingleCall {
  final String chain;
  final String path;
  final String seedHex;
  const _DeriveSingleCall(this.chain, this.path, this.seedHex);
}

class _AddToListCall {
  final WalletAccounts accounts;
  final ChainAccount account;
  const _AddToListCall(this.accounts, this.account);
}

class _RemoveFromListCall {
  final WalletAccounts accounts;
  final String chain;
  final String address;
  const _RemoveFromListCall(this.accounts, this.chain, this.address);
}

class _SetterCall {
  final String key;
  final List<dynamic> args;
  const _SetterCall(this.key, this.args);
}

// ═══════════════════════════════════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════════════════════════════════

/// Quick [ChainAccount] factory.
ChainAccount _account({
  String chain = 'ethereum',
  String address = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  String path = "m/44'/60'/0'/0/0",
  String publicKey = 'cafebabe',
}) =>
    ChainAccount(
      chain: chain,
      address: address,
      derivationPath: path,
      publicKey: publicKey,
    );

/// Quick [WalletAccounts] factory.
WalletAccounts _wallet(List<ChainAccount> accounts) => WalletAccounts(
      accounts: accounts,
      mnemonicFingerprint: 'deadbeef',
    );

/// Default test accounts returned by [MockAccountService.deriveDefaultAccounts].
final _defaultAccounts = _wallet([
  _account(chain: 'ethereum'),
  _account(chain: 'solana', address: 'solana-addr', path: "m/44'/501'/0'/0'"),
  _account(chain: 'bitcoin', address: 'btc-addr', path: "m/84'/0'/0'/0/0"),
  _account(chain: 'tron', address: 'tron-addr', path: "m/44'/195'/0'/0/0"),
  _account(chain: 'sui', address: 'sui-addr', path: "m/44'/784'/0'/0'/0'"),
]);

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  late MockPinAuthService pinAuth;
  late MockMnemonicService mnemonicService;
  late MockAccountService accountService;
  late MockWalletRepository repo;
  late WalletService service;

  const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const testPin = '123456';
  const testPassphrase = 'my-secret-phrase';

  setUp(() {
    pinAuth = MockPinAuthService();
    mnemonicService = MockMnemonicService();
    accountService = MockAccountService();
    repo = MockWalletRepository();
    service = WalletService(
      pinAuth: pinAuth,
      mnemonicService: mnemonicService,
      accountService: accountService,
      repo: repo,
    );
  });

  /// Helper: set up wallet via [service.setupWallet] with default test values.
  /// Must be called within a test (after mocks are configured by [setUp]).
  Future<void> _setup() async {
    pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
    pinAuth.hashPinResult = 'hashed-pin';
    pinAuth.encryptWithPinResult = 'encrypted-mnemonic';
    mnemonicService.fingerprintMnemonicResult = 'deadbeef';
    mnemonicService.mnemonicToSeedHexResult =
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    accountService.deriveDefaultAccountsResult = _defaultAccounts;

    await service.setupWallet(
      testMnemonic,
      pin: testPin,
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // 1. hasWallet delegates to repo
  // ──────────────────────────────────────────────────────────────────

  group('hasWallet', () {
    test('returns true when repo says wallet exists', () async {
      repo.hasWalletFn = () async => true;

      final result = await service.hasWallet();

      expect(result, isTrue);
    });

    test('returns false when repo says no wallet', () async {
      repo.hasWalletFn = () async => false;

      final result = await service.hasWallet();

      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 2. isLocked delegates to pinAuth
  // ──────────────────────────────────────────────────────────────────

  group('isLocked', () {
    test('returns true when pinAuth says locked', () async {
      pinAuth.isLockedResult = true;

      final result = await service.isLocked();

      expect(result, isTrue);
      expect(pinAuth.isLockedCalls, 1);
    });

    test('returns false when pinAuth says not locked', () async {
      pinAuth.isLockedResult = false;

      final result = await service.isLocked();

      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 3. isUnlocked returns false initially
  // ──────────────────────────────────────────────────────────────────

  group('isUnlocked', () {
    test('returns false initially (mnemonic not cached)', () {
      expect(service.isUnlocked, isFalse);
    });

    test('returns false after lock()', () async {
      // set up a wallet so it becomes unlocked, then lock it
      await _setup();
      service.lock();

      expect(service.isUnlocked, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 4. setupWallet orchestrates full flow
  // ──────────────────────────────────────────────────────────────────

  group('setupWallet', () {
    test('orchestrates full flow: salt → hash → encrypt → fingerprint → '
        'seed → accounts → persist', () async {
      // Arrange
      pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
      pinAuth.hashPinResult = 'hashed-pin-hash';
      pinAuth.encryptWithPinResult = 'encrypted-mnemonic-data';
      mnemonicService.fingerprintMnemonicResult = 'abcd1234';
      mnemonicService.mnemonicToSeedHexResult =
          'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      // Act
      final result = await service.setupWallet(
        testMnemonic,
        pin: testPin,
      );

      // Assert — salt generated
      expect(pinAuth.randomHexCalls, hasLength(1));
      expect(pinAuth.randomHexCalls.first.length, 16);

      // Assert — PIN hashed with salt
      expect(pinAuth.hashPinCalls, hasLength(1));
      expect(pinAuth.hashPinCalls.first.pin, testPin);
      expect(pinAuth.hashPinCalls.first.salt, pinAuth.randomHexResult);

      // Assert — mnemonic encrypted with PIN
      expect(pinAuth.encryptCalls, hasLength(1));
      expect(pinAuth.encryptCalls.first.data, testMnemonic);
      expect(pinAuth.encryptCalls.first.pin, testPin);
      expect(pinAuth.encryptCalls.first.salt, pinAuth.randomHexResult);

      // Assert — fingerprint generated
      expect(mnemonicService.fingerprintCalls, hasLength(1));
      expect(mnemonicService.fingerprintCalls.first, testMnemonic);

      // Assert — salt persisted (early, so seed derivation can read it)
      expect(repo.wasSet('setPinSalt'), isTrue);
      expect(
          repo.lastSet<String>('setPinSalt'), pinAuth.randomHexResult);

      // Assert — seed derived
      expect(mnemonicService.seedHexCalls, hasLength(1));
      expect(mnemonicService.seedHexCalls.first.mnemonic, testMnemonic);
      expect(mnemonicService.seedHexCalls.first.passphrase, '');

      // Assert — accounts derived
      expect(accountService.deriveDefaultCalls, hasLength(1));
      expect(
          accountService.deriveDefaultCalls.first.mnemonic, testMnemonic);
      expect(accountService.deriveDefaultCalls.first.passphrase, '');
      expect(accountService.deriveDefaultCalls.first.seedHex,
          mnemonicService.mnemonicToSeedHexResult);

      // Assert — remaining persistence
      expect(repo.wasSet('setPinHash'), isTrue);
      expect(repo.lastSet<String>('setPinHash'), 'hashed-pin-hash');
      expect(repo.wasSet('setEncryptedMnemonic'), isTrue);
      expect(repo.lastSet<String>('setEncryptedMnemonic'),
          'encrypted-mnemonic-data');
      expect(repo.wasSet('setMnemonicFingerprint'), isTrue);
      expect(repo.lastSet<String>('setMnemonicFingerprint'), 'abcd1234');
      expect(repo.wasSet('setStorePassphrase'), isTrue);
      expect(repo.lastSet<bool>('setStorePassphrase'), false);

      // Assert — accounts persisted
      expect(repo.wasSet('setAccounts'), isTrue);
      final persisted = repo.lastSet<WalletAccounts>('setAccounts')!;
      expect(persisted.mnemonicFingerprint, 'abcd1234');
      expect(persisted.accounts, hasLength(5));

      // Assert — PIN attempts reset
      expect(pinAuth.resetPinAttemptsCalls, 1);

      // Assert — return value
      expect(result.accounts, hasLength(5));
      expect(result.mnemonicFingerprint, 'abcd1234');
    });

    test('stores passphrase when storePassphrase=true and passphrase is non-empty',
        () async {
      // Arrange
      pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
      pinAuth.hashPinResult = 'hashed';
      pinAuth.encryptWithPinResult = 'enc-mnemonic';
      mnemonicService.mnemonicToSeedHexResult = 'seed-hex';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      // Act
      await service.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: testPassphrase,
        storePassphrase: true,
      );

      // Assert — passphrase encrypted with same PIN+salt
      final passphraseCall = pinAuth.encryptCalls.lastWhere(
        (c) => c.data == testPassphrase,
        orElse: () => _EncryptCall('', '', ''),
      );
      expect(passphraseCall.pin, testPin);
      expect(passphraseCall.salt, pinAuth.randomHexResult);

      // Assert — passphrase persisted
      expect(repo.wasSet('setEncryptedPassphrase'), isTrue);
      expect(repo.lastSet<String>('setEncryptedPassphrase'), 'enc-mnemonic');
      expect(repo.lastSet<bool>('setStorePassphrase'), true);

      // Assert — passphrase cached
      expect(service.passphrase, testPassphrase);
    });

    test('does NOT encrypt/store passphrase when storePassphrase=false', () async {
      pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
      pinAuth.hashPinResult = 'hashed';
      pinAuth.encryptWithPinResult = 'enc-mnemonic';
      mnemonicService.mnemonicToSeedHexResult = 'seed-hex';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: testPassphrase,
        storePassphrase: false,
      );

      expect(repo.wasSet('setEncryptedPassphrase'), isFalse);
      expect(repo.lastSet<bool>('setStorePassphrase'), false);
      expect(service.passphrase, testPassphrase);
    });

    test('does NOT cache passphrase when passphrase is empty', () async {
      pinAuth.randomHexResult = 'aaa';
      pinAuth.hashPinResult = 'bbb';
      pinAuth.encryptWithPinResult = 'ccc';
      mnemonicService.mnemonicToSeedHexResult = 'ddd';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: '',
      );

      expect(service.passphrase, null);
      expect(repo.wasSet('setEncryptedPassphrase'), isFalse);
    });

    test('passes passphrase through to mnemonicToSeedHex', () async {
      pinAuth.randomHexResult = 'aaa';
      pinAuth.hashPinResult = 'bbb';
      pinAuth.encryptWithPinResult = 'ccc';
      mnemonicService.mnemonicToSeedHexResult = 'ddd';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: 'custom-pass',
      );

      expect(mnemonicService.seedHexCalls.first.passphrase, 'custom-pass');
      expect(accountService.deriveDefaultCalls.first.passphrase, 'custom-pass');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 5. setupWallet caches mnemonic/seed/accounts in memory
  // ──────────────────────────────────────────────────────────────────

  group('setupWallet caching', () {
    test('caches mnemonic in memory', () async {
      await _setup();

      expect(service.mnemonic, testMnemonic);
    });

    test('caches seedHex in memory', () async {
      // Use custom seed value — must inline setupWallet to avoid _setup() overwrite
      mnemonicService.mnemonicToSeedHexResult = 'my-seed-hex';
      pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
      pinAuth.hashPinResult = 'hashed-pin';
      pinAuth.encryptWithPinResult = 'encrypted-mnemonic';
      mnemonicService.fingerprintMnemonicResult = 'deadbeef';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.setupWallet(testMnemonic, pin: testPin);

      expect(service.seedHex, 'my-seed-hex');
    });

    test('caches accounts in memory', () async {
      await _setup();

      final accounts = service.getAccounts();
      expect(accounts, isNotNull);
      expect(accounts!.accounts, hasLength(5));
    });

    test('isUnlocked returns true after setup', () async {
      await _setup();

      expect(service.isUnlocked, isTrue);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 6. unlockWallet decrypts mnemonic and derives accounts
  // ──────────────────────────────────────────────────────────────────

  group('unlockWallet', () {
    setUp(() {
      // Simulate a previously set-up wallet in storage
      repo.pinSaltFn = () async => 'stored-salt';
      repo.pinHashFn = () async => 'stored-pin-hash';
      repo.encryptedMnemonicFn = () async => 'stored-encrypted-mnemonic';
      repo.storePassphraseFn = () async => false;

      pinAuth.randomHexResult = 'stored-salt';
      pinAuth.decryptWithPinResult = testMnemonic;
      mnemonicService.mnemonicToSeedHexResult =
          'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;
    });

    test('decrypts mnemonic, derives seed, derives accounts', () async {
      final result = await service.unlockWallet(testPin);

      // Verify decryption
      expect(pinAuth.decryptCalls, hasLength(1));
      expect(pinAuth.decryptCalls.first.data, 'stored-encrypted-mnemonic');
      expect(pinAuth.decryptCalls.first.pin, testPin);
      expect(pinAuth.decryptCalls.first.salt, 'stored-salt');

      // Verify seed derivation
      expect(mnemonicService.seedHexCalls, hasLength(1));
      expect(mnemonicService.seedHexCalls.first.mnemonic, testMnemonic);

      // Verify account derivation
      expect(accountService.deriveDefaultCalls, hasLength(1));
      expect(
          accountService.deriveDefaultCalls.first.mnemonic, testMnemonic);

      // Verify PIN attempts reset
      expect(pinAuth.resetPinAttemptsCalls, 1);

      // Verify cache populated
      expect(service.mnemonic, testMnemonic);
      expect(service.seedHex, isNotNull);
      expect(service.isUnlocked, isTrue);

      // Verify return value
      expect(result.accounts, hasLength(5));
    });

    test('merges persisted extra accounts with derived defaults', () async {
      final extraAccount =
          _account(chain: 'ethereum', address: '0xExtraAddr', path: "m/44'/60'/0'/0/1");
      final persisted = _wallet([extraAccount]);
      repo.accountsFn = () async => persisted;

      final result = await service.unlockWallet(testPin);

      // Should have 6 accounts: 5 derived defaults + 1 extra
      expect(result.accounts, hasLength(6));
      expect(result.accounts.any((a) => a.address == '0xExtraAddr'), isTrue);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 6b. unlockWallet loads passphrase
  // ──────────────────────────────────────────────────────────────────

  group('unlockWallet passphrase', () {
    setUp(() {
      repo.pinSaltFn = () async => 'salt';
      repo.encryptedMnemonicFn = () async => 'enc';
      pinAuth.decryptWithPinResult = testMnemonic;
      mnemonicService.mnemonicToSeedHexResult = 'seed';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;
    });

    test('loads and caches passphrase when storePassphrase is true', () async {
      repo.storePassphraseFn = () async => true;
      repo.encryptedPassphraseFn = () async => 'enc-pass';

      // decryptWithPin called twice: mnemonic then passphrase
      // Use a counter to return different values
      int callCount = 0;
      pinAuth.decryptWithPinFn = (
        String ciphertextHex,
        String pin,
        String salt,
      ) {
        callCount++;
        return callCount == 1 ? testMnemonic : 'my-saved-passphrase';
      };

      await service.unlockWallet(testPin);

      expect(service.passphrase, 'my-saved-passphrase');
      expect(service.mnemonic, testMnemonic);
    });

    test('leaves passphrase as empty string when storePassphrase is false',
        () async {
      repo.storePassphraseFn = () async => false;

      await service.unlockWallet(testPin);

      expect(service.passphrase, '');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 7. unlockWallet throws StateError when locked out
  // ──────────────────────────────────────────────────────────────────

  group('unlockWallet locked out', () {
    test('throws StateError when isLocked returns true', () async {
      pinAuth.isLockedResult = true;

      expect(
        () => service.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 8. unlockWallet throws StateError when data corrupted
  // ──────────────────────────────────────────────────────────────────

  group('unlockWallet data corruption', () {
    test('throws StateError when salt is missing', () async {
      repo.pinSaltFn = () async => null;
      pinAuth.isLockedResult = false;

      expect(
        () => service.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });

    test('throws StateError when encrypted mnemonic is missing', () async {
      repo.pinSaltFn = () async => 'salt';
      repo.encryptedMnemonicFn = () async => null;
      pinAuth.isLockedResult = false;

      expect(
        () => service.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 9. lock clears all cached state
  // ──────────────────────────────────────────────────────────────────

  group('lock', () {
    test('clears mnemonic, seedHex, passphrase, and accounts', () async {
      await _setup();
      expect(service.isUnlocked, isTrue);

      service.lock();

      expect(service.mnemonic, isNull);
      expect(service.seedHex, isNull);
      expect(service.passphrase, isNull);
      expect(service.getAccounts(), isNull);
      expect(service.isUnlocked, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 10. clearWallet calls repo.clearAll and clears cache
  // ──────────────────────────────────────────────────────────────────

  group('clearWallet', () {
    test('calls repo.clearAll', () async {
      await _setup();

      await service.clearWallet();

      expect(repo.wasSet('clearAll'), isTrue);
    });

    test('clears all in-memory state', () async {
      await _setup();

      await service.clearWallet();

      expect(service.mnemonic, isNull);
      expect(service.seedHex, isNull);
      expect(service.passphrase, isNull);
      expect(service.getAccounts(), isNull);
      expect(service.isUnlocked, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 11. revealMnemonic returns cached mnemonic without re-decrypt
  // ──────────────────────────────────────────────────────────────────

  group('revealMnemonic', () {
    test('returns cached mnemonic when PIN is correct', () async {
      await _setup();
      pinAuth.verifyPinResult = true;

      final result = await service.revealMnemonic(testPin);

      expect(result, testMnemonic);
      // Should have verified PIN
      expect(pinAuth.verifyPinCalls, hasLength(1));
      expect(pinAuth.verifyPinCalls.first, testPin);
    });

    test(
        'falls back to decrypting from storage when mnemonic not cached',
        () async {
      // Simulate mnemonic in storage but not in memory
      repo.pinSaltFn = () async => 'stored-salt';
      repo.encryptedMnemonicFn = () async => 'stored-encrypted';
      pinAuth.verifyPinResult = true;
      pinAuth.decryptWithPinResult = testMnemonic;

      final result = await service.revealMnemonic(testPin);

      expect(result, testMnemonic);
      expect(pinAuth.decryptCalls, hasLength(1));
      expect(pinAuth.decryptCalls.first.data, 'stored-encrypted');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 12. revealMnemonic returns null when PIN wrong
  // ──────────────────────────────────────────────────────────────────

  group('revealMnemonic wrong PIN', () {
    test('returns null when verifyPin returns false', () async {
      await _setup();
      pinAuth.verifyPinResult = false;

      final result = await service.revealMnemonic('wrong-pin');

      expect(result, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 13. addAccount derives and appends, checks duplicates
  // ──────────────────────────────────────────────────────────────────

  group('addAccount', () {
    setUp(() async {
      await _setup();
    });

    test('derives account and appends to list', () async {
      final newAccount =
          _account(address: '0xNew', chain: 'ethereum', path: "m/44'/60'/0'/0/1");
      accountService.deriveSingleAccountResult = newAccount;

      final result =
          await service.addAccount('ethereum', "m/44'/60'/0'/0/1");

      // Verify derivation called
      expect(accountService.deriveSingleCalls, hasLength(1));
      expect(accountService.deriveSingleCalls.first.chain, 'ethereum');
      expect(
          accountService.deriveSingleCalls.first.path, "m/44'/60'/0'/0/1");

      // Verify appended
      expect(result.accounts, hasLength(6));
      expect(result.accounts.last.address, '0xNew');

      // Verify persisted
      expect(repo.wasSet('setAccounts'), isTrue);
    });

    test('does not append duplicate (same address + chain)', () async {
      final existingAddress = _defaultAccounts.accounts.first.address;
      final duplicate = _account(
          address: existingAddress, chain: 'ethereum', path: "m/44'/60'/0'/0/0");
      accountService.deriveSingleAccountResult = duplicate;

      final result =
          await service.addAccount('ethereum', "m/44'/60'/0'/0/0");

      // Should still have 5 accounts (no duplicate added)
      expect(result.accounts, hasLength(5));
    });

    test('throws StateError when derivation fails', () async {
      accountService.deriveSingleAccountResult = null;

      expect(
        () => service.addAccount('ethereum', "m/44'/60'/0'/0/1"),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 14. addAccount throws StateError when wallet locked
  // ──────────────────────────────────────────────────────────────────

  group('addAccount locked', () {
    test('throws StateError when wallet is locked', () async {
      expect(
        () => service.addAccount('ethereum', "m/44'/60'/0'/0/0"),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 15. removeAccount filters and persists
  // ──────────────────────────────────────────────────────────────────

  group('removeAccount', () {
    setUp(() async {
      await _setup();
    });

    test('removes matching account by chain + address', () async {
      final targetAddress = _defaultAccounts.accounts.first.address;

      final result = await service.removeAccount('ethereum', targetAddress);

      expect(result.accounts, hasLength(4));
      expect(
          result.accounts.any((a) => a.address == targetAddress), isFalse);

      // Verify persisted
      expect(repo.wasSet('setAccounts'), isTrue);
    });

    test('keeps other chain accounts untouched', () async {
      final solanaCount = _defaultAccounts.accounts
          .where((a) => a.chain == 'solana')
          .length;

      await service.removeAccount('ethereum',
          _defaultAccounts.accounts.firstWhere((a) => a.chain == 'ethereum').address);

      final remaining = service.getAccounts()!;
      expect(
          remaining.accounts.where((a) => a.chain == 'solana').length,
          solanaCount);
    });

    test('throws StateError when wallet is locked', () async {
      service.lock();

      expect(
        () => service.removeAccount('ethereum', '0xAny'),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 16. verifyPin delegates to pinAuth
  // ──────────────────────────────────────────────────────────────────

  group('verifyPin', () {
    test('returns true when pinAuth verifies successfully', () async {
      pinAuth.verifyPinResult = true;

      final result = await service.verifyPin(testPin);

      expect(result, isTrue);
      expect(pinAuth.verifyPinCalls, hasLength(1));
      expect(pinAuth.verifyPinCalls.first, testPin);
    });

    test('returns false when pinAuth rejects', () async {
      pinAuth.verifyPinResult = false;

      final result = await service.verifyPin('wrong-pin');

      expect(result, isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 17. getAccounts returns cached accounts
  // ──────────────────────────────────────────────────────────────────

  group('getAccounts', () {
    test('returns null when wallet is not set up', () {
      expect(service.getAccounts(), isNull);
    });

    test('returns cached accounts after setup', () async {
      await _setup();

      final accounts = service.getAccounts();
      expect(accounts, isNotNull);
      expect(accounts!.accounts, hasLength(5));
    });

    test('returns cached accounts after unlock', () async {
      // Prepare storage state
      repo.pinSaltFn = () async => 'salt';
      repo.encryptedMnemonicFn = () async => 'enc';
      pinAuth.decryptWithPinResult = testMnemonic;
      mnemonicService.mnemonicToSeedHexResult = 'seed';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.unlockWallet(testPin);

      final accounts = service.getAccounts();
      expect(accounts, isNotNull);
      expect(accounts!.accounts, hasLength(5));
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 18. mnemonic getter returns cached mnemonic
  // ──────────────────────────────────────────────────────────────────

  group('mnemonic getter', () {
    test('returns null when wallet is not set up', () {
      expect(service.mnemonic, isNull);
    });

    test('returns mnemonic after setup', () async {
      await _setup();

      expect(service.mnemonic, testMnemonic);
    });

    test('returns null after lock', () async {
      await _setup();
      service.lock();

      expect(service.mnemonic, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 19. seedHex getter returns cached seed
  // ──────────────────────────────────────────────────────────────────

  group('seedHex getter', () {
    test('returns null when wallet is not set up', () {
      expect(service.seedHex, isNull);
    });

    test('returns seed after setup', () async {
      // Use custom seed value — must inline setupWallet to avoid _setup() overwrite
      mnemonicService.mnemonicToSeedHexResult = 'seed-value';
      pinAuth.randomHexResult = 'saltsaltsaltsaltsaltsaltsaltsalt';
      pinAuth.hashPinResult = 'hashed-pin';
      pinAuth.encryptWithPinResult = 'encrypted-mnemonic';
      mnemonicService.fingerprintMnemonicResult = 'deadbeef';
      accountService.deriveDefaultAccountsResult = _defaultAccounts;

      await service.setupWallet(testMnemonic, pin: testPin);

      expect(service.seedHex, 'seed-value');
    });

    test('returns null after lock', () async {
      await _setup();
      service.lock();

      expect(service.seedHex, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 20. incrementPinAttempts / resetPinAttempts / getPinAttempts
  // ──────────────────────────────────────────────────────────────────

  group('PIN attempt management', () {
    test('getPinAttempts delegates to pinAuth.pinAttempts', () {
      pinAuth.setPinAttempts(3);

      expect(service.getPinAttempts(), 3);
    });

    test('pinAttempts getter delegates to pinAuth', () {
      pinAuth.setPinAttempts(2);

      expect(service.pinAttempts, 2);
    });

    test('incrementPinAttempts delegates to pinAuth', () async {
      pinAuth.setPinAttempts(1);

      await service.incrementPinAttempts();

      expect(pinAuth.incrementPinAttemptsCalls, 1);
    });

    test('resetPinAttempts delegates to pinAuth', () async {
      pinAuth.setPinAttempts(4);

      await service.resetPinAttempts();

      expect(pinAuth.resetPinAttemptsCalls, 1);
    });

    test('maxPinAttempts is exposed', () {
      expect(service.maxPinAttempts, 5);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // bonus: updatePin delegates to pinAuth
  // ──────────────────────────────────────────────────────────────────

  group('updatePin', () {
    test('delegates to pinAuth and returns result', () async {
      pinAuth.updatePinResult = true;

      final result = await service.updatePin('old', 'new');

      expect(result, isTrue);
      expect(pinAuth.updatePinCalls, hasLength(1));
      expect(pinAuth.updatePinCalls.first.oldPin, 'old');
      expect(pinAuth.updatePinCalls.first.newPin, 'new');
    });

    test('returns false when pinAuth returns false', () async {
      pinAuth.updatePinResult = false;

      final result = await service.updatePin('old', 'new');

      expect(result, isFalse);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Inline helpers (defined inside main() below, closes over mock variables)
// ═══════════════════════════════════════════════════════════════════════
