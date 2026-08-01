import 'dart:convert';

import '../../core/interfaces/storage.dart';
import '../../core/interfaces/wallet_repository.dart';
import '../../core/models/wallet_accounts.dart';

/// [IWalletRepository] implementation backed by [Storage].
///
/// Extracted from [WalletService] — handles all wallet data persistence
/// (PIN hash, encrypted mnemonic, accounts, passphrase, attempt counter).
/// Contains zero business logic: pure read/write with storage key constants.
class WalletRepositoryImpl implements IWalletRepository {
  final Storage _storage;

  WalletRepositoryImpl(this._storage);

  // ── Storage keys ───────────────────────────────────────────────────

  static const _keyPinKdf = 'wallet.pinKdf';
  static const _keyPinSalt = 'wallet.pinSalt';
  static const _keyMnemonicEncrypted = 'wallet.mnemonicEncrypted';
  static const _keyPassphrase = 'wallet.passphrase';
  static const _keyStorePassphrase = 'wallet.storePassphrase';
  static const _keyPinAttempts = 'wallet.pinAttempts';
  static const _keyFingerprint = 'wallet.mnemonicFingerprint';
  static const _keyAccounts = 'wallet.accounts';

  // ── Wallet existence ────────────────────────────────────────────────

  @override
  Future<bool> hasWallet() async {
    final pinKdf = await _storage.getItem(_keyPinKdf);
    return pinKdf != null;
  }

  // ── PIN auth ────────────────────────────────────────────────────────

  @override
  Future<String?> getPinHash() => _storage.getItem(_keyPinKdf);

  @override
  Future<void> setPinHash(String hash) =>
      _storage.setItem(_keyPinKdf, hash);

  @override
  Future<String?> getPinSalt() => _storage.getItem(_keyPinSalt);

  @override
  Future<void> setPinSalt(String salt) =>
      _storage.setItem(_keyPinSalt, salt);

  @override
  Future<int> getPinAttempts() async {
    final stored = await _storage.getItem(_keyPinAttempts);
    return stored != null ? int.tryParse(stored) ?? 0 : 0;
  }

  @override
  Future<void> setPinAttempts(int attempts) =>
      _storage.setItem(_keyPinAttempts, attempts.toString());

  // ── Mnemonic ────────────────────────────────────────────────────────

  @override
  Future<String?> getEncryptedMnemonic() =>
      _storage.getItem(_keyMnemonicEncrypted);

  @override
  Future<void> setEncryptedMnemonic(String encrypted) =>
      _storage.setItem(_keyMnemonicEncrypted, encrypted);

  @override
  Future<String?> getMnemonicFingerprint() =>
      _storage.getItem(_keyFingerprint);

  @override
  Future<void> setMnemonicFingerprint(String fingerprint) =>
      _storage.setItem(_keyFingerprint, fingerprint);

  // ── Passphrase ──────────────────────────────────────────────────────

  @override
  Future<bool> getStorePassphrase() async {
    final v = await _storage.getItem(_keyStorePassphrase);
    return v == 'true';
  }

  @override
  Future<void> setStorePassphrase(bool store) =>
      _storage.setItem(_keyStorePassphrase, store.toString());

  @override
  Future<String?> getEncryptedPassphrase() =>
      _storage.getItem(_keyPassphrase);

  @override
  Future<void> setEncryptedPassphrase(String encrypted) =>
      _storage.setItem(_keyPassphrase, encrypted);

  // ── Accounts ────────────────────────────────────────────────────────

  @override
  Future<WalletAccounts?> getAccounts() async {
    final stored = await _storage.getItem(_keyAccounts);
    if (stored == null) return null;
    try {
      final json = jsonDecode(stored) as Map<String, dynamic>;
      return WalletAccounts.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> setAccounts(WalletAccounts accounts) async {
    final json = accounts.toJson();
    await _storage.setItem(_keyAccounts, jsonEncode(json));
  }

  // ── Clear ──────────────────────────────────────────────────────────

  @override
  Future<void> clearAll() async {
    await _storage.removeItem(_keyPinSalt);
    await _storage.removeItem(_keyPinKdf);
    await _storage.removeItem(_keyMnemonicEncrypted);
    await _storage.removeItem(_keyPassphrase);
    await _storage.removeItem(_keyStorePassphrase);
    await _storage.removeItem(_keyPinAttempts);
    await _storage.removeItem(_keyFingerprint);
    await _storage.removeItem(_keyAccounts);
  }
}
