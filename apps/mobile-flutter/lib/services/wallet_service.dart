import '../biz/wallet_biz.dart';
import '../core/interfaces/account_service.dart';
import '../core/interfaces/mnemonic_service.dart';
import '../core/interfaces/pin_auth_service.dart';
import '../core/interfaces/wallet_repository.dart';
import '../core/interfaces/wallet_service.dart';
import '../core/models/wallet_accounts.dart';

/// Wallet lifecycle orchestration service.
///
/// Delegates core wallet lifecycle (setup, unlock, lock, account management,
/// mnemonic reveal) to [WalletBiz]. This service retains direct responsibility
/// for PIN management, wallet existence checks, and lockout queries.
///
/// The in-memory wallet state (_mnemonic, _passphrase, _seedHex, _accounts)
/// is managed by [WalletBiz]. WalletService proxies these as getters.
class WalletService implements IWalletService {
  final IPinAuthService _pinAuth;
  final IAccountService _accountService;
  final IMnemonicService _mnemonicService;
  final IWalletRepository _repo;
  final WalletBiz _biz;

  WalletService({
    required IPinAuthService pinAuth,
    required IAccountService accountService,
    required IMnemonicService mnemonicService,
    required IWalletRepository repo,
  })  : _pinAuth = pinAuth,
        _accountService = accountService,
        _mnemonicService = mnemonicService,
        _repo = repo,
        _biz = WalletBiz(pinAuth: pinAuth, accountService: accountService, mnemonicService: mnemonicService, repo: repo);

  // ── Public API ─────────────────────────────────────────────────────

  /// Whether a wallet exists on this device.
  @override
  Future<bool> hasWallet() => _repo.hasWallet();

  /// Check if the wallet is currently locked out.
  @override
  Future<bool> isLocked() => _pinAuth.isLocked();

  /// Current PIN attempt count.
  @override
  int get pinAttempts => _pinAuth.pinAttempts;

  /// Max allowed PIN attempts.
  int get maxPinAttempts => _pinAuth.maxPinAttempts;

  /// Whether the wallet is currently unlocked (mnemonic is cached).
  @override
  bool get isUnlocked => _biz.isUnlocked;

  /// The cached mnemonic (available only when unlocked).
  @override
  String? get mnemonic => _biz.mnemonic;

  /// The cached passphrase (empty string if none).
  String? get passphrase => _biz.passphrase;

  /// Pre-computed seed hex (mnemonic + passphrase).
  @override
  String? get seedHex => _biz.seedHex;

  // ── Wallet lifecycle ───────────────────────────────────────────────

  /// Set up a brand-new wallet.
  ///
  /// Delegates to [WalletBiz.setupWallet].
  @override
  Future<WalletAccounts> setupWallet(
    String mnemonic, {
    required String pin,
    String passphrase = '',
    bool storePassphrase = false,
  }) {
    return _biz.setupWallet(mnemonic, pin: pin, passphrase: passphrase, storePassphrase: storePassphrase);
  }

  /// Unlock the wallet: decrypt mnemonic, derive accounts.
  ///
  /// Caller MUST have already verified the PIN via [verifyPin].
  /// Delegates to [WalletBiz.unlockWallet].
  @override
  Future<WalletAccounts> unlockWallet(String pin) {
    return _biz.unlockWallet(pin);
  }

  /// Verify a PIN **without** decrypting the mnemonic.
  ///
  /// Used for PIN-change, backup-seed gate, and settings access.
  @override
  Future<bool> verifyPin(String pin) => _pinAuth.verifyPin(pin);

  /// Get the currently cached accounts (requires prior [unlockWallet]).
  @override
  WalletAccounts? getAccounts() => _biz.accounts;

  /// Add a new account for the given [chain] at the given derivation [path].
  ///
  /// Delegates to [WalletBiz.addAccount].
  @override
  Future<WalletAccounts> addAccount(String chain, String path) {
    return _biz.addAccount(chain, path);
  }

  /// Remove an account by [chain] and [address].
  ///
  /// Delegates to [WalletBiz.removeAccount].
  @override
  Future<WalletAccounts> removeAccount(String chain, String address) {
    return _biz.removeAccount(chain, address);
  }

  /// Reveal the mnemonic seed phrase.
  ///
  /// Requires PIN re-verification as a security gate.
  /// Delegates to [WalletBiz.revealMnemonic].
  @override
  Future<String?> revealMnemonic(String pin) => _biz.revealMnemonic(pin);

  /// Clear **all** wallet data from storage and memory.
  ///
  /// Delegates to [WalletBiz.clearWallet].
  @override
  Future<void> clearWallet() async {
    await _biz.clearWallet();
  }

  /// Change the wallet PIN.
  @override
  Future<bool> updatePin(String oldPin, String newPin) =>
      _pinAuth.updatePin(oldPin, newPin);

  // ── PIN attempt management ────────────────────────────────────────

  int getPinAttempts() => _pinAuth.pinAttempts;

  Future<void> incrementPinAttempts() => _pinAuth.incrementPinAttempts();

  Future<void> resetPinAttempts() => _pinAuth.resetPinAttempts();

  // ── Lock ───────────────────────────────────────────────────────────

  /// Lock the wallet: clear cached mnemonic, passphrase, and accounts.
  ///
  /// Delegates to [WalletBiz.lock].
  @override
  void lock() {
    _biz.lock();
  }
}
