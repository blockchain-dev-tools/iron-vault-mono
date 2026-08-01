import '../models/wallet_accounts.dart';

/// Interface for wallet lifecycle orchestration.
///
/// Screens depend on this interface, never on the concrete [WalletService].
/// This allows widget tests to mock wallet behavior without touching storage,
/// crypto, or any platform code.
abstract class IWalletService {
  // ── Wallet existence ───────────────────────────────────────────────

  /// Whether a wallet exists on this device.
  Future<bool> hasWallet();

  // ── Lock state ─────────────────────────────────────────────────────

  /// Whether the wallet is locked out after too many failed PIN attempts.
  Future<bool> isLocked();

  /// Whether the wallet is currently unlocked (mnemonic cached).
  bool get isUnlocked;

  /// Lock the wallet — clear cached mnemonic, seed, accounts.
  void lock();

  // ── PIN auth ───────────────────────────────────────────────────────

  /// Verify a PIN without decrypting the mnemonic.
  Future<bool> verifyPin(String pin);

  /// Current PIN attempt count.
  int get pinAttempts;

  // ── Wallet lifecycle ───────────────────────────────────────────────

  /// Set up a brand-new wallet.
  Future<WalletAccounts> setupWallet(
    String mnemonic, {
    required String pin,
    String passphrase = '',
    bool storePassphrase = false,
  });

  /// Unlock the wallet — decrypt mnemonic, derive accounts.
  Future<WalletAccounts> unlockWallet(String pin);

  /// Clear all wallet data from storage and memory.
  Future<void> clearWallet();

  // ── Account management ─────────────────────────────────────────────

  /// Get cached accounts.
  WalletAccounts? getAccounts();

  /// Add a new account for [chain] at derivation [path].
  Future<WalletAccounts> addAccount(String chain, String path);

  /// Remove an account by [chain] and [address].
  Future<WalletAccounts> removeAccount(String chain, String address);

  // ── Mnemonic / Seed ────────────────────────────────────────────────

  /// Reveal the mnemonic seed phrase (PIN-gated).
  Future<String?> revealMnemonic(String pin);

  /// The pre-computed seed hex (available only when unlocked).
  String? get seedHex;

  /// The cached mnemonic (available only when unlocked).
  String? get mnemonic;

  // ── PIN management ─────────────────────────────────────────────────

  /// Change the wallet PIN.
  Future<bool> updatePin(String oldPin, String newPin);
}
