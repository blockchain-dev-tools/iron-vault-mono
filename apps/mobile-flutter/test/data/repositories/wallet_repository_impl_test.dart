import 'package:flutter_test/flutter_test.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/data/repositories/wallet_repository_impl.dart';
import 'package:iron_vault_flutter/infrastructure/persistence/in_memory_storage.dart';

/// Helper: create a [WalletAccounts] with 2 test chains.
WalletAccounts _sampleAccounts() {
  return WalletAccounts(
    accounts: [
      const ChainAccount(
        address: '0xABC0000000000000000000000000000000000DEF',
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey:
            '04aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
        chain: 'ethereum',
        bleEnabled: true,
      ),
      const ChainAccount(
        address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        derivationPath: "m/44'/501'/0'/0'",
        publicKey:
            'aabbccddeeff00112233445566778899aabbccddeeff0011223344556677889900',
        chain: 'solana',
        bleEnabled: false,
      ),
    ],
    mnemonicFingerprint: 'abc12345',
  );
}

void main() {
  late InMemoryStorage storage;
  late WalletRepositoryImpl repo;

  setUp(() {
    storage = InMemoryStorage();
    repo = WalletRepositoryImpl(storage);
  });

  tearDown(() {
    storage.clear();
  });

  // ── Scenario 1: hasWallet returns true when pinKdf stored ──────────
  test('hasWallet returns true when pinKdf is stored', () async {
    await storage.setItem('wallet.pinKdf', 'some-hash-value');
    final result = await repo.hasWallet();
    expect(result, isTrue);
  });

  // ── Scenario 2: hasWallet returns false when no pinKdf ──────────────
  test('hasWallet returns false when no pinKdf is stored', () async {
    final result = await repo.hasWallet();
    expect(result, isFalse);
  });

  // ── Scenario 3: getPinHash / setPinHash round-trip ──────────────────
  test('getPinHash / setPinHash round-trip', () async {
    const hash = 'pbkdf2:100000:abcd1234:deadbeef';
    await repo.setPinHash(hash);
    final result = await repo.getPinHash();
    expect(result, equals(hash));
  });

  // ── Scenario 4: getPinSalt / setPinSalt round-trip ──────────────────
  test('getPinSalt / setPinSalt round-trip', () async {
    const salt = 'random-salt-32-bytes-hex-encoded';
    await repo.setPinSalt(salt);
    final result = await repo.getPinSalt();
    expect(result, equals(salt));
  });

  // ── Scenario 5: getPinAttempts returns 0 when not stored, parses int ──
  test('getPinAttempts returns 0 when not stored', () async {
    final result = await repo.getPinAttempts();
    expect(result, equals(0));
  });

  test('getPinAttempts parses int when stored', () async {
    await storage.setItem('wallet.pinAttempts', '3');
    final result = await repo.getPinAttempts();
    expect(result, equals(3));
  });

  test('getPinAttempts returns 0 when stored value is not a valid int',
      () async {
    await storage.setItem('wallet.pinAttempts', 'not-a-number');
    final result = await repo.getPinAttempts();
    expect(result, equals(0));
  });

  // ── Scenario 6: setPinAttempts stores as string ────────────────────
  test('setPinAttempts stores as a string', () async {
    await repo.setPinAttempts(4);
    // Verify the raw value in storage is a string
    final raw = await storage.getItem('wallet.pinAttempts');
    expect(raw, equals('4'));
  });

  // ── Scenario 7: getEncryptedMnemonic / setEncryptedMnemonic round-trip
  test('getEncryptedMnemonic / setEncryptedMnemonic round-trip', () async {
    const encrypted =
        'chacha20:ciphertext-base64-here:nonce:tag';
    await repo.setEncryptedMnemonic(encrypted);
    final result = await repo.getEncryptedMnemonic();
    expect(result, equals(encrypted));
  });

  // ── Scenario 8: getMnemonicFingerprint / setMnemonicFingerprint round-trip
  test(
      'getMnemonicFingerprint / setMnemonicFingerprint round-trip',
      () async {
    const fingerprint = 'deadbeef';
    await repo.setMnemonicFingerprint(fingerprint);
    final result = await repo.getMnemonicFingerprint();
    expect(result, equals(fingerprint));
  });

  // ── Scenario 9: getStorePassphrase returns false when not stored, true when 'true'
  test('getStorePassphrase returns false when not stored', () async {
    final result = await repo.getStorePassphrase();
    expect(result, isFalse);
  });

  test("getStorePassphrase returns true when stored value is 'true'",
      () async {
    await storage.setItem('wallet.storePassphrase', 'true');
    final result = await repo.getStorePassphrase();
    expect(result, isTrue);
  });

  test(
      "getStorePassphrase returns false when stored value is 'false'",
      () async {
    await storage.setItem('wallet.storePassphrase', 'false');
    final result = await repo.getStorePassphrase();
    expect(result, isFalse);
  });

  // ── Scenario 10: setStorePassphrase(true) stores 'true' ────────────
  test("setStorePassphrase(true) stores 'true'", () async {
    await repo.setStorePassphrase(true);
    final raw = await storage.getItem('wallet.storePassphrase');
    expect(raw, equals('true'));
  });

  test("setStorePassphrase(false) stores 'false'", () async {
    await repo.setStorePassphrase(false);
    final raw = await storage.getItem('wallet.storePassphrase');
    expect(raw, equals('false'));
  });

  // ── Scenario 11: getEncryptedPassphrase / setEncryptedPassphrase round-trip
  test(
      'getEncryptedPassphrase / setEncryptedPassphrase round-trip',
      () async {
    const encrypted = 'chacha20:passphrase-ciphertext:nonce:tag';
    await repo.setEncryptedPassphrase(encrypted);
    final result = await repo.getEncryptedPassphrase();
    expect(result, equals(encrypted));
  });

  // ── Scenario 12: getAccounts returns null when not stored ──────────
  test('getAccounts returns null when not stored', () async {
    final result = await repo.getAccounts();
    expect(result, isNull);
  });

  // ── Scenario 13: getAccounts / setAccounts round-trip ──────────────
  test('getAccounts / setAccounts round-trip', () async {
    final accounts = _sampleAccounts();
    await repo.setAccounts(accounts);
    final result = await repo.getAccounts();

    expect(result, isNotNull);
    expect(result, equals(accounts));
  });

  test('getAccounts returns null when stored JSON is malformed', () async {
    await storage.setItem('wallet.accounts', 'not-valid-json{{{');
    final result = await repo.getAccounts();
    expect(result, isNull);
  });

  // ── Scenario 14: clearAll removes all keys ─────────────────────────
  test('clearAll removes all wallet keys from storage', () async {
    // Populate some data
    await repo.setPinHash('hash');
    await repo.setPinSalt('salt');
    await repo.setEncryptedMnemonic('mnemonic');
    await repo.setMnemonicFingerprint('fp');
    await repo.setStorePassphrase(true);
    await repo.setEncryptedPassphrase('pp');
    await repo.setPinAttempts(2);
    await repo.setAccounts(_sampleAccounts());

    // Verify data is there before clearing
    expect(await repo.hasWallet(), isTrue);
    expect(await repo.getEncryptedMnemonic(), isNotNull);

    // Clear
    await repo.clearAll();

    // All must be gone
    expect(await repo.hasWallet(), isFalse);
    expect(await repo.getPinHash(), isNull);
    expect(await repo.getPinSalt(), isNull);
    expect(await repo.getEncryptedMnemonic(), isNull);
    expect(await repo.getMnemonicFingerprint(), isNull);
    expect(await repo.getEncryptedPassphrase(), isNull);
    expect(await repo.getPinAttempts(), equals(0));
    expect(await repo.getStorePassphrase(), isFalse);
    expect(await repo.getAccounts(), isNull);
  });
}
