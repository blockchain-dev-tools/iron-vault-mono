/// Unit tests for [WalletBiz].
///
/// Covers setupWallet, unlockWallet, lock, clearWallet, revealMnemonic,
/// addAccount, removeAccount, and all getters. Uses hand-written mocks.
library;

import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/biz/wallet_biz.dart';
import 'package:iron_vault_flutter/core/interfaces/account_service.dart';
import 'package:iron_vault_flutter/core/interfaces/mnemonic_service.dart';
import 'package:iron_vault_flutter/core/interfaces/pin_auth_service.dart';
import 'package:iron_vault_flutter/core/interfaces/wallet_repository.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mocks
// ═══════════════════════════════════════════════════════════════════════

/// Default test accounts returned by mock deriveDefaultAccounts.
final _defaultAccounts = WalletAccounts(
  accounts: [
    const ChainAccount(
      chain: 'ethereum',
      address: '0x1234',
      derivationPath: "m/44'/60'/0'/0/0",
      publicKey: 'pubkey-eth',
    ),
    const ChainAccount(
      chain: 'solana',
      address: 'SolAddr1',
      derivationPath: "m/44'/501'/0'",
      publicKey: 'pubkey-sol',
    ),
  ],
  mnemonicFingerprint: 'test-fp',
);

class _MockPinAuth implements IPinAuthService {
  int _attempts = 0;
  bool lockedOut = false;

  // Configurable
  String? verifyResult; // non-null = correct PIN (the matched hash)
  String? hashPinResult;
  String? encryptResult;
  String? decryptResult;
  String? randomHexResult;

  // Call tracking
  final List<_PinAuthCall> calls = [];

  @override
  String hashPin(String pin, String salt) {
    calls.add(_PinAuthCall('hashPin', [pin, salt]));
    return hashPinResult ?? 'hashed-$pin-$salt';
  }

  @override
  Future<bool> verifyPin(String pin) async {
    calls.add(_PinAuthCall('verifyPin', [pin]));
    return verifyResult != null;
  }

  @override
  Future<bool> updatePin(String oldPin, String newPin) async {
    calls.add(_PinAuthCall('updatePin', [oldPin, newPin]));
    return verifyResult != null;
  }

  @override
  int get pinAttempts => _attempts;

  @override
  int get maxPinAttempts => 5;

  @override
  Future<bool> isLocked() async => lockedOut;

  @override
  Future<void> incrementPinAttempts() async {
    _attempts++;
  }

  @override
  Future<void> resetPinAttempts() async {
    calls.add(_PinAuthCall('resetPinAttempts', []));
    _attempts = 0;
  }

  @override
  String encryptWithPin(String plaintext, String pin, String salt) {
    calls.add(_PinAuthCall('encryptWithPin', [plaintext, pin, salt]));
    return encryptResult ?? 'enc-${plaintext.hashCode}';
  }

  @override
  String decryptWithPin(String ciphertextHex, String pin, String salt) {
    calls.add(_PinAuthCall('decryptWithPin', [ciphertextHex, pin, salt]));
    return decryptResult ?? 'decrypted-content';
  }

  @override
  String randomHex(int length) {
    calls.add(_PinAuthCall('randomHex', [length]));
    return randomHexResult ?? '00' * length;
  }
}

class _MockAccountService implements IAccountService {
  WalletAccounts? deriveDefaultResult;
  ChainAccount? deriveSingleResult;

  final List<_AccountServiceCall> calls = [];
  int addAccountToListCalls = 0;
  int removeAccountFromListCalls = 0;

  @override
  Future<WalletAccounts> deriveDefaultAccounts(
      String mnemonic, String passphrase, String seedHex) async {
    calls.add(_AccountServiceCall(
        'deriveDefaultAccounts', [mnemonic, passphrase, seedHex]));
    return deriveDefaultResult ?? _defaultAccounts;
  }

  @override
  Future<ChainAccount?> deriveSingleAccount(
      String chain, String path, String seedHex) async {
    calls.add(_AccountServiceCall(
        'deriveSingleAccount', [chain, path, seedHex]));
    return deriveSingleResult;
  }

  @override
  WalletAccounts addAccountToList(
      WalletAccounts accounts, ChainAccount account) {
    addAccountToListCalls++;
    return accounts.copyWith(
      accounts: [...accounts.accounts, account],
    );
  }

  @override
  WalletAccounts removeAccountFromList(
      WalletAccounts accounts, String chain, String address) {
    removeAccountFromListCalls++;
    return accounts.copyWith(
      accounts: accounts.accounts
          .where((a) => !(a.chain == chain && a.address == address))
          .toList(),
    );
  }

  @override
  Map<String, String> get defaultPaths => {
        'ethereum': "m/44'/60'/0'/0/0",
        'solana': "m/44'/501'/0'",
        'bitcoin': "m/84'/0'/0'/0/0",
        'tron': "m/44'/195'/0'/0/0",
        'sui': "m/44'/784'/0'/0'/0",
      };
}

class _MockMnemonicService implements IMnemonicService {
  String? fingerprintResult;
  String? seedHexResult;

  final List<_MnemonicCall> calls = [];

  @override
  String generateMnemonic({int strength = 128}) =>
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  @override
  bool validateMnemonic(String mnemonic) => true;

  @override
  String mnemonicToSeedHex(String mnemonic, String passphrase) {
    calls.add(_MnemonicCall('mnemonicToSeedHex', [mnemonic, passphrase]));
    return seedHexResult ?? 'seed-hex-for-testing';
  }

  @override
  String fingerprintMnemonic(String mnemonic) {
    calls.add(_MnemonicCall('fingerprintMnemonic', [mnemonic]));
    return fingerprintResult ?? 'abc12345';
  }

  @override
  List<String> generateEnigmaMnemonic(
      String riddle, String secret, {int language = 0}) {
    return List.filled(24, 'abandon');
  }
}

class _MockWalletRepo implements IWalletRepository {
  // Configurable return values
  String? pinHash;
  String? pinSalt;
  int pinAttempts = 0;
  String? encryptedMnemonic;
  String? encryptedPassphrase;
  bool storePassphrase = false;
  String? mnemonicFingerprint;
  WalletAccounts? accounts;

  // Call tracking
  final List<_RepoCall> calls = [];

  @override Future<bool> hasWallet() async => pinHash != null;
  @override Future<String?> getPinHash() async => pinHash;
  @override Future<String?> getPinSalt() async => pinSalt;
  @override Future<int> getPinAttempts() async => pinAttempts;
  @override Future<String?> getEncryptedMnemonic() async => encryptedMnemonic;
  @override Future<String?> getEncryptedPassphrase() async => encryptedPassphrase;
  @override Future<bool> getStorePassphrase() async => storePassphrase;
  @override Future<String?> getMnemonicFingerprint() async => mnemonicFingerprint;
  @override Future<WalletAccounts?> getAccounts() async => accounts;

  @override Future<void> setPinHash(String v) async { calls.add(_RepoCall('setPinHash', v)); }
  @override Future<void> setPinSalt(String v) async { calls.add(_RepoCall('setPinSalt', v)); }
  @override Future<void> setPinAttempts(int v) async { calls.add(_RepoCall('setPinAttempts', v)); }
  @override Future<void> setEncryptedMnemonic(String v) async { calls.add(_RepoCall('setEncryptedMnemonic', v)); }
  @override Future<void> setEncryptedPassphrase(String v) async { calls.add(_RepoCall('setEncryptedPassphrase', v)); }
  @override Future<void> setStorePassphrase(bool v) async { calls.add(_RepoCall('setStorePassphrase', v)); }
  @override Future<void> setMnemonicFingerprint(String v) async { calls.add(_RepoCall('setMnemonicFingerprint', v)); }
  @override Future<void> setAccounts(WalletAccounts v) async { calls.add(_RepoCall('setAccounts', v)); }
  @override Future<void> clearAll() async { calls.add(_RepoCall('clearAll', null)); }

  bool wasCalled(String method) => calls.any((c) => c.method == method);
  dynamic lastArg(String method) {
    for (final c in calls.reversed) {
      if (c.method == method) return c.arg;
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Call record types
// ═══════════════════════════════════════════════════════════════════════

class _PinAuthCall {
  final String method;
  final List<dynamic> args;
  const _PinAuthCall(this.method, this.args);
}

class _AccountServiceCall {
  final String method;
  final List<dynamic> args;
  const _AccountServiceCall(this.method, this.args);
}

class _MnemonicCall {
  final String method;
  final List<dynamic> args;
  const _MnemonicCall(this.method, this.args);
}

class _RepoCall {
  final String method;
  final dynamic arg;
  const _RepoCall(this.method, this.arg);
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  late _MockPinAuth pinAuth;
  late _MockAccountService accountService;
  late _MockMnemonicService mnemonicService;
  late _MockWalletRepo repo;
  late WalletBiz walletBiz;

  const testMnemonic = 'abandon abandon abandon abandon abandon abandon '
      'abandon abandon abandon abandon abandon about';
  const testPin = '123456';
  const testPassphrase = 'my secret passphrase';

  setUp(() {
    pinAuth = _MockPinAuth();
    accountService = _MockAccountService();
    mnemonicService = _MockMnemonicService();
    repo = _MockWalletRepo();
    walletBiz = WalletBiz(
      pinAuth: pinAuth,
      accountService: accountService,
      mnemonicService: mnemonicService,
      repo: repo,
    );
  });

  // ──────────────────────────────────────────────────────────────────
  // Initial state / getters
  // ──────────────────────────────────────────────────────────────────

  group('initial state', () {
    test('isUnlocked is false initially', () {
      expect(walletBiz.isUnlocked, isFalse);
    });

    test('mnemonic is null initially', () {
      expect(walletBiz.mnemonic, isNull);
    });

    test('seedHex is null initially', () {
      expect(walletBiz.seedHex, isNull);
    });

    test('accounts is null initially', () {
      expect(walletBiz.accounts, isNull);
    });

    test('passphrase is null initially', () {
      expect(walletBiz.passphrase, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // setupWallet
  // ──────────────────────────────────────────────────────────────────

  group('setupWallet', () {
    test('full flow — salt, PIN, encrypt, seed, accounts, persist', () async {
      pinAuth.randomHexResult = 'aabbccdd';
      pinAuth.hashPinResult = 'hashed-pin';
      pinAuth.encryptResult = 'encrypted-mnemonic';
      pinAuth.verifyResult = 'any';
      mnemonicService.fingerprintResult = 'fp-1234';
      mnemonicService.seedHexResult = 'seed-hex-abc';

      final result = await walletBiz.setupWallet(
        testMnemonic,
        pin: testPin,
      );

      // Should return accounts with fingerprint
      expect(result.mnemonicFingerprint, 'fp-1234');

      // Should be unlocked
      expect(walletBiz.isUnlocked, isTrue);
      expect(walletBiz.mnemonic, testMnemonic);
      expect(walletBiz.seedHex, 'seed-hex-abc');

      // Repo should have been written
      expect(repo.wasCalled('setPinSalt'), isTrue);
      expect(repo.wasCalled('setPinHash'), isTrue);
      expect(repo.wasCalled('setEncryptedMnemonic'), isTrue);
      expect(repo.wasCalled('setMnemonicFingerprint'), isTrue);
      expect(repo.wasCalled('setAccounts'), isTrue);

      // PIN attempts reset
      expect(pinAuth.calls.any((c) => c.method == 'resetPinAttempts'), isTrue);
    });

    test('returns WalletAccounts with fingerprint', () async {
      mnemonicService.fingerprintResult = 'fp-custom';

      final result = await walletBiz.setupWallet(
        testMnemonic,
        pin: testPin,
      );

      expect(result, isA<WalletAccounts>());
      expect(result.mnemonicFingerprint, 'fp-custom');
      expect(result.accounts.length, greaterThan(0));
    });

    test('with passphrase stores encrypted passphrase', () async {
      pinAuth.randomHexResult = 'salt-hex';
      pinAuth.hashPinResult = 'hashed';
      pinAuth.encryptResult = 'enc-passphrase-stored';
      mnemonicService.seedHexResult = 'seed-with-passphrase';

      await walletBiz.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: testPassphrase,
        storePassphrase: true,
      );

      // Should persist passphrase
      expect(repo.wasCalled('setEncryptedPassphrase'), isTrue);
      expect(repo.wasCalled('setStorePassphrase'), isTrue);
      expect(repo.lastArg('setStorePassphrase'), true);

      // Seed should be derived with passphrase
      final seedCalls = mnemonicService.calls
          .where((c) => c.method == 'mnemonicToSeedHex');
      expect(seedCalls.isNotEmpty, isTrue);
      expect(seedCalls.first.args[1], testPassphrase);

      // Passphrase should be cached
      expect(walletBiz.passphrase, testPassphrase);
    });

    test('without storePassphrase does NOT store passphrase', () async {
      pinAuth.randomHexResult = 'salt-hex';
      pinAuth.hashPinResult = 'hashed';

      await walletBiz.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: testPassphrase,
        storePassphrase: false,
      );

      expect(repo.wasCalled('setEncryptedPassphrase'), isFalse);
      expect(repo.lastArg('setStorePassphrase'), false);

      // Passphrase should still be cached in memory
      expect(walletBiz.passphrase, testPassphrase);
    });

    test('empty passphrase does not store anything', () async {
      pinAuth.randomHexResult = 'salt-hex';
      pinAuth.hashPinResult = 'hashed';

      await walletBiz.setupWallet(
        testMnemonic,
        pin: testPin,
        passphrase: '',
        storePassphrase: true,
      );

      expect(repo.wasCalled('setEncryptedPassphrase'), isFalse);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // unlockWallet
  // ──────────────────────────────────────────────────────────────────

  group('unlockWallet', () {
    setUp(() {
      repo.pinSalt = 'oldsalt';
      repo.encryptedMnemonic = 'enc-mnemonic';
      repo.storePassphrase = false;
      pinAuth.decryptResult = testMnemonic;
      mnemonicService.seedHexResult = 'unlocked-seed';
    });

    test('decrypts, derives accounts, merges stored extras', () async {
      // Set up persisted extras
      final persistedExtra = const ChainAccount(
        chain: 'bitcoin',
        address: 'btc-extra',
        derivationPath: "m/84'/0'/0'/0/1",
        publicKey: 'pubkey-btc-extra',
      );
      repo.accounts = WalletAccounts(
        accounts: [
          _defaultAccounts.accounts[0], // ethereum (already default)
          persistedExtra,
        ],
        mnemonicFingerprint: 'fp-extra',
      );

      final result = await walletBiz.unlockWallet(testPin);

      expect(walletBiz.isUnlocked, isTrue);
      expect(walletBiz.mnemonic, testMnemonic);
      expect(walletBiz.seedHex, 'unlocked-seed');

      // Should contain both default accounts + the extra
      expect(result.accounts.length, 3);
      expect(result.accounts.any((a) =>
          a.chain == 'bitcoin' && a.address == 'btc-extra'), isTrue);

      // PIN attempts reset
      expect(pinAuth.calls.any((c) => c.method == 'resetPinAttempts'), isTrue);
    });

    test('throws when locked out', () async {
      pinAuth.lockedOut = true;

      expect(
        () => walletBiz.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });

    test('throws when PIN salt is missing', () async {
      repo.pinSalt = null;

      expect(
        () => walletBiz.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });

    test('throws when encrypted mnemonic is missing', () async {
      repo.encryptedMnemonic = null;

      expect(
        () => walletBiz.unlockWallet(testPin),
        throwsA(isA<StateError>()),
      );
    });

    test('loads stored passphrase when storePassphrase is true', () async {
      repo.storePassphrase = true;
      repo.encryptedPassphrase = 'enc-pass';
      // Fresh PinAuth mock so call tracking is clean
      pinAuth = _MockPinAuth();
      pinAuth.decryptResult = testMnemonic;

      // Re-create walletBiz with fresh state
      walletBiz = WalletBiz(
        pinAuth: pinAuth,
        accountService: accountService,
        mnemonicService: mnemonicService,
        repo: repo,
      );

      await walletBiz.unlockWallet(testPin);

      // The decryptCalls should include a call with enc-pass
      final decryptCalls = pinAuth.calls
          .where((c) => c.method == 'decryptWithPin');
      expect(decryptCalls.length, greaterThanOrEqualTo(2));
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // lock / clearWallet
  // ──────────────────────────────────────────────────────────────────

  group('lock', () {
    test('clears cached mnemonic, seed, accounts, passphrase', () async {
      // First set up
      await walletBiz.setupWallet(testMnemonic, pin: testPin);
      expect(walletBiz.isUnlocked, isTrue);

      walletBiz.lock();

      expect(walletBiz.isUnlocked, isFalse);
      expect(walletBiz.mnemonic, isNull);
      expect(walletBiz.seedHex, isNull);
      expect(walletBiz.accounts, isNull);
      expect(walletBiz.passphrase, isNull);
    });
  });

  group('clearWallet', () {
    test('clears all repo data + cache', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);

      await walletBiz.clearWallet();

      expect(repo.wasCalled('clearAll'), isTrue);
      expect(walletBiz.isUnlocked, isFalse);
      expect(walletBiz.mnemonic, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // revealMnemonic
  // ──────────────────────────────────────────────────────────────────

  group('revealMnemonic', () {
    test('correct PIN returns cached mnemonic when unlocked', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);
      pinAuth.verifyResult = 'any'; // PIN must match

      final result = await walletBiz.revealMnemonic(testPin);

      expect(result, testMnemonic);
    });

    test('wrong PIN returns null', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);
      pinAuth.verifyResult = null; // PIN won't match

      final result = await walletBiz.revealMnemonic('wrong');
      expect(result, isNull);
    });

    test('returns null when wallet is locked and data missing', () async {
      // Locked state without any persisted data
      pinAuth.verifyResult = 'any'; // PIN match, but no data

      final result = await walletBiz.revealMnemonic(testPin);
      expect(result, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // addAccount
  // ──────────────────────────────────────────────────────────────────

  group('addAccount', () {
    test('derives, adds, persists', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);

      const newAccount = ChainAccount(
        chain: 'bitcoin',
        address: 'btc-new',
        derivationPath: "m/84'/0'/0'/0/1",
        publicKey: 'pubkey-btc',
      );
      accountService.deriveSingleResult = newAccount;

      final result = await walletBiz.addAccount('bitcoin', "m/84'/0'/0'/0/1");

      expect(result.accounts.length, 3); // 2 defaults + 1 new
      expect(result.accounts.any((a) => a.address == 'btc-new'), isTrue);
      expect(repo.wasCalled('setAccounts'), isTrue);
    });

    test('rejects duplicates', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);

      // Try to add an account that already exists
      accountService.deriveSingleResult = _defaultAccounts.accounts[0];

      final result = await walletBiz.addAccount('ethereum', "m/44'/60'/0'/0/0");

      expect(result.accounts.length, 2); // unchanged
    });

    test('throws when locked', () async {
      expect(
        () => walletBiz.addAccount('ethereum', "m/44'/60'/0'/0/0"),
        throwsA(isA<StateError>()),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // removeAccount
  // ──────────────────────────────────────────────────────────────────

  group('removeAccount', () {
    test('removes account and persists', () async {
      await walletBiz.setupWallet(testMnemonic, pin: testPin);

      final result = await walletBiz.removeAccount(
          'ethereum', '0x1234');

      expect(result.accounts.length, 1); // only solana remains
      expect(repo.wasCalled('setAccounts'), isTrue);
    });

    test('throws when locked', () async {
      expect(
        () => walletBiz.removeAccount('ethereum', '0x1234'),
        throwsA(isA<StateError>()),
      );
    });
  });
}
