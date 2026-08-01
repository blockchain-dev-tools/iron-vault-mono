import '../core/interfaces/account_service.dart';
import '../core/interfaces/mnemonic_service.dart';
import '../core/interfaces/pin_auth_service.dart';
import '../core/interfaces/wallet_repository.dart';
import '../core/models/wallet_accounts.dart';

/// Pure wallet lifecycle business logic extracted from [WalletService].
///
/// This class orchestrates wallet creation, unlocking, locking, and account
/// management. It depends on four abstract interfaces (injected via constructor)
/// and contains no crypto, no PIN hashing, no account derivation itself —
/// it delegates all of that to the injected services.
///
/// WalletBiz is UI-framework-agnostic: it imports only from `core/interfaces/`
/// and `core/models/`. It has no knowledge of Flutter, BuildContext, GoRouter,
/// or any presentation-layer concern.
class WalletBiz {
  final IPinAuthService _pinAuth;
  final IAccountService _accountService;
  final IMnemonicService _mnemonicService;
  final IWalletRepository _repo;

  /// Max allowed PIN attempts before lockout.
  static const int _maxPinAttempts = 5;

  // ── In-memory wallet state ──────────────────────────────────────────

  /// Cached mnemonic — cleared on [lock].
  String? _mnemonic;

  /// Cached passphrase (if user opts to store it).
  String? _passphrase;

  /// Pre-computed seed hex (mnemonic + passphrase).
  String? _seedHex;

  /// Cached accounts — cleared on [lock].
  WalletAccounts? _accounts;

  WalletBiz({
    required IPinAuthService pinAuth,
    required IAccountService accountService,
    required IMnemonicService mnemonicService,
    required IWalletRepository repo,
  })  : _pinAuth = pinAuth,
        _accountService = accountService,
        _mnemonicService = mnemonicService,
        _repo = repo;

  // ── Public API ─────────────────────────────────────────────────────

  /// Whether the wallet is currently unlocked (mnemonic is cached).
  bool get isUnlocked => _mnemonic != null;

  /// The cached mnemonic (available only when unlocked).
  String? get mnemonic => _mnemonic;

  /// Pre-computed seed hex (mnemonic + passphrase).
  String? get seedHex => _seedHex;

  /// The cached passphrase (empty string if none).
  String? get passphrase => _passphrase;

  /// The currently cached accounts (requires prior [unlockWallet] or [setupWallet]).
  WalletAccounts? get accounts => _accounts;

  // ── Wallet lifecycle ───────────────────────────────────────────────

  /// Set up a brand-new wallet.
  ///
  /// 1. Generate salt + hash PIN (via [IPinAuthService])
  /// 2. Encrypt mnemonic with PIN (via [IPinAuthService])
  /// 3. Generate mnemonic fingerprint (via [IMnemonicService])
  /// 4. Derive seed + default accounts (via [IMnemonicService] + [IAccountService])
  /// 5. Persist everything to storage (via [IWalletRepository])
  /// 6. Cache mnemonic + accounts in memory
  Future<WalletAccounts> setupWallet(
    String mnemonic, {
    required String pin,
    String passphrase = '',
    bool storePassphrase = false,
  }) async {
    // Generate salt and hash PIN
    final salt = _pinAuth.randomHex(16);
    final pinHash = _pinAuth.hashPin(pin, salt);

    // Encrypt mnemonic
    final encryptedMnemonic = _pinAuth.encryptWithPin(mnemonic, pin, salt);

    // Generate fingerprint
    final fingerprint = _mnemonicService.fingerprintMnemonic(mnemonic);

    // Persist salt first so seed derivation can read it if needed
    await _repo.setPinSalt(salt);

    // Derive seed and accounts
    final seed = _mnemonicService.mnemonicToSeedHex(mnemonic, passphrase);
    final accounts =
        await _accountService.deriveDefaultAccounts(mnemonic, passphrase, seed);

    // Persist remaining data
    await _repo.setPinHash(pinHash);
    await _repo.setEncryptedMnemonic(encryptedMnemonic);
    await _repo.setMnemonicFingerprint(fingerprint);
    await _repo.setStorePassphrase(storePassphrase);

    if (passphrase.isNotEmpty) {
      _passphrase = passphrase;
      if (storePassphrase) {
        final encPassphrase = _pinAuth.encryptWithPin(passphrase, pin, salt);
        await _repo.setEncryptedPassphrase(encPassphrase);
      }
    }

    // Cache in memory
    _mnemonic = mnemonic;
    _seedHex = seed;
    _accounts = accounts.copyWith(mnemonicFingerprint: fingerprint);
    await _repo.setAccounts(_accounts!);
    await _pinAuth.resetPinAttempts();

    return _accounts!;
  }

  /// Unlock the wallet: decrypt mnemonic, derive accounts.
  ///
  /// Caller MUST have already verified the PIN via [IPinAuthService.verifyPin].
  Future<WalletAccounts> unlockWallet(String pin) async {
    // Check lockout
    if (await _pinAuth.isLocked()) {
      throw StateError(
        'Wallet is locked after $_maxPinAttempts failed attempts. '
        'Reset the wallet and import your mnemonic to recover.',
      );
    }

    // Decrypt mnemonic
    final salt = await _repo.getPinSalt();
    if (salt == null) {
      throw StateError(
        'Wallet data corrupted: missing PIN salt. Reset your wallet.',
      );
    }

    final encryptedMnemonic = await _repo.getEncryptedMnemonic();
    if (encryptedMnemonic == null) {
      throw StateError(
        'Wallet data corrupted: missing encrypted mnemonic. Reset your wallet.',
      );
    }

    final mnemonic = _pinAuth.decryptWithPin(encryptedMnemonic, pin, salt);

    // Load passphrase if stored
    String passphrase = '';
    final storePassphrase = await _repo.getStorePassphrase();
    if (storePassphrase) {
      final encPassphrase = await _repo.getEncryptedPassphrase();
      if (encPassphrase != null) {
        passphrase = _pinAuth.decryptWithPin(encPassphrase, pin, salt);
      }
    }

    // Cache
    _mnemonic = mnemonic;
    _passphrase = passphrase;
    _seedHex = _mnemonicService.mnemonicToSeedHex(mnemonic, passphrase);

    // Derive accounts
    _accounts = await _accountService.deriveDefaultAccounts(
        mnemonic, passphrase, _seedHex!);

    // Load all stored accounts (merge with derived defaults)
    final persisted = await _repo.getAccounts();
    if (persisted != null) {
      final defaultAddresses =
          _accounts!.accounts.map((a) => a.address).toSet();
      final extras = persisted.accounts
          .where((a) => !defaultAddresses.contains(a.address));
      _accounts = _accounts!.copyWith(
        accounts: [..._accounts!.accounts, ...extras],
      );
    }

    await _pinAuth.resetPinAttempts();
    return _accounts!;
  }

  /// Reveal the mnemonic seed phrase.
  ///
  /// Requires PIN re-verification as a security gate.
  /// Returns `null` if PIN verification fails or mnemonic cannot be decrypted.
  Future<String?> revealMnemonic(String pin) async {
    if (!await _pinAuth.verifyPin(pin)) return null;
    if (_mnemonic != null) return _mnemonic;

    final salt = await _repo.getPinSalt();
    final encrypted = await _repo.getEncryptedMnemonic();
    if (salt == null || encrypted == null) return null;

    return _pinAuth.decryptWithPin(encrypted, pin, salt);
  }

  /// Add a new account for the given [chain] at the given derivation [path].
  Future<WalletAccounts> addAccount(String chain, String path) async {
    _assertUnlocked();

    final account = await _accountService.deriveSingleAccount(
        chain, path, _seedHex!);
    if (account == null) {
      throw StateError('Failed to derive account for $chain at $path');
    }

    // Check for duplicates
    final existing = _accounts?.accounts
        .where((a) => a.address == account.address && a.chain == account.chain);
    if (existing != null && existing.isNotEmpty) {
      return _accounts!;
    }

    _accounts = _accountService.addAccountToList(_accounts!, account);
    await _repo.setAccounts(_accounts!);
    return _accounts!;
  }

  /// Remove an account by [chain] and [address].
  Future<WalletAccounts> removeAccount(String chain, String address) async {
    _assertUnlocked();
    _accounts =
        _accountService.removeAccountFromList(_accounts!, chain, address);
    await _repo.setAccounts(_accounts!);
    return _accounts!;
  }

  // ── Lock / clear ───────────────────────────────────────────────────

  /// Lock the wallet: clear cached mnemonic, passphrase, seed, and accounts
  /// from memory. Wallet can be re-unlocked via [unlockWallet].
  void lock() {
    _mnemonic = null;
    _passphrase = null;
    _seedHex = null;
    _accounts = null;
  }

  /// Clear **all** wallet data from storage and memory.
  Future<void> clearWallet() async {
    await _repo.clearAll();
    lock();
  }

  // ── Private helpers ────────────────────────────────────────────────

  void _assertUnlocked() {
    if (_mnemonic == null) {
      throw StateError('Wallet is locked. Call unlockWallet() first.');
    }
  }
}
