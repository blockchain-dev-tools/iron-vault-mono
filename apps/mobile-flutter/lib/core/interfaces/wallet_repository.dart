import '../models/wallet_accounts.dart';

/// Abstract repository for wallet data persistence.
///
/// Implemented by [WalletRepositoryImpl] in `lib/data/repositories/`.
/// WalletService depends on this interface, never on concrete storage.
abstract class IWalletRepository {
  // ── Wallet existence ────────────────────────────────────────────────

  /// Whether a wallet exists on this device (checks for stored PIN hash).
  Future<bool> hasWallet();

  // ── PIN auth ────────────────────────────────────────────────────────

  /// Load the stored PBKDF2 PIN hash.
  Future<String?> getPinHash();

  /// Store the PBKDF2 PIN hash.
  Future<void> setPinHash(String hash);

  /// Load the stored PIN salt.
  Future<String?> getPinSalt();

  /// Store the PIN salt.
  Future<void> setPinSalt(String salt);

  /// Load the PIN attempt counter.
  Future<int> getPinAttempts();

  /// Store the PIN attempt counter.
  Future<void> setPinAttempts(int attempts);

  // ── Mnemonic ────────────────────────────────────────────────────────

  /// Load the encrypted mnemonic.
  Future<String?> getEncryptedMnemonic();

  /// Store the encrypted mnemonic.
  Future<void> setEncryptedMnemonic(String encrypted);

  /// Load the mnemonic fingerprint.
  Future<String?> getMnemonicFingerprint();

  /// Store the mnemonic fingerprint.
  Future<void> setMnemonicFingerprint(String fingerprint);

  // ── Passphrase ──────────────────────────────────────────────────────

  /// Whether the passphrase should be stored encrypted.
  Future<bool> getStorePassphrase();

  /// Set whether to store the passphrase.
  Future<void> setStorePassphrase(bool store);

  /// Load the encrypted passphrase.
  Future<String?> getEncryptedPassphrase();

  /// Store the encrypted passphrase.
  Future<void> setEncryptedPassphrase(String encrypted);

  // ── Accounts ────────────────────────────────────────────────────────

  /// Load all persisted accounts.
  Future<WalletAccounts?> getAccounts();

  /// Save accounts to storage.
  Future<void> setAccounts(WalletAccounts accounts);

  // ── Clear ──────────────────────────────────────────────────────────

  /// Remove all wallet data from storage.
  Future<void> clearAll();
}
