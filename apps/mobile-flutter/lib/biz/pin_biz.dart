import 'dart:math';
import 'dart:typed_data';

import '../core/interfaces/crypto_service.dart';
import '../core/interfaces/wallet_repository.dart';

/// PIN authentication business logic.
///
/// Extracts orchestration (verify, update, attempt tracking) from
/// [PinAuthService] (`lib/services/pin_auth_service.dart`). PinBiz depends
/// only on the two `core/interfaces/` abstractions — it contains no Flutter
/// dependency and no knowledge of the services layer.
///
/// The plumbing (hashPin, encryptWithPin, decryptWithPin, randomHex) stays
/// in `lib/services/pin_auth_service.dart` — PinBiz calls [ICryptoService]
/// directly for all crypto operations.
class PinBiz {
  final ICryptoService _crypto;
  final IWalletRepository _repo;

  /// Cached PIN attempt count. Initialized to -1 as sentinel for "not yet loaded".
  int _pinAttempts = -1;

  static const int maxPinAttempts = 5;

  PinBiz({
    required ICryptoService crypto,
    required IWalletRepository repo,
  })  : _crypto = crypto,
        _repo = repo;

  // ── Public API ───────────────────────────────────────────────────────

  /// Current failed PIN attempt count (0 before first failure).
  int get pinAttempts => _pinAttempts < 0 ? 0 : _pinAttempts;

  /// Whether the wallet is currently locked out (attempts exhausted).
  Future<bool> isLocked() async {
    await _ensurePinAttemptsLoaded();
    return _pinAttempts >= maxPinAttempts;
  }

  /// Increment the failed-attempt counter and persist.
  Future<void> incrementPinAttempts() async {
    await _ensurePinAttemptsLoaded();
    _pinAttempts++;
    await _repo.setPinAttempts(_pinAttempts);
  }

  /// Reset the failed-attempt counter to zero and persist.
  Future<void> resetPinAttempts() async {
    _pinAttempts = 0;
    await _repo.setPinAttempts(0);
  }

  // ── Verify PIN ───────────────────────────────────────────────────────

  /// Verify [pin] against the stored hash + salt.
  ///
  /// **Side effects:** automatically increments failed attempts on mismatch
  /// and resets the counter to zero on a successful match. Callers do NOT
  /// need to manage attempt tracking separately.
  Future<bool> verifyPin(String pin) async {
    await _ensurePinAttemptsLoaded();

    final salt = await _repo.getPinSalt();
    final storedHash = await _repo.getPinHash();
    if (salt == null || storedHash == null) return false;

    final computedHash = _hashPin(pin, salt);
    // ignore: unsafe_comparison
    // TODO: Use constant-time comparison from Rust SDK
    final matched = computedHash == storedHash;

    if (matched) {
      await resetPinAttempts();
    } else {
      await incrementPinAttempts();
    }

    return matched;
  }

  // ── Update PIN ───────────────────────────────────────────────────────

  /// Change the PIN: re-encrypt mnemonic and passphrase with the new PIN.
  ///
  /// Flow:
  /// 1. Verify [oldPin].
  /// 2. Generate fresh salt, hash [newPin].
  /// 3. Decrypt mnemonic with old PIN → re-encrypt with new PIN → persist.
  /// 4. If passphrase was stored, decrypt → re-encrypt → persist as well.
  /// 5. Persist new salt + hash, reset attempt counter.
  ///
  /// Returns `true` on success, `false` if [oldPin] was wrong.
  Future<bool> updatePin(String oldPin, String newPin) async {
    if (!await verifyPin(oldPin)) return false;

    final salt = _randomHex(16);
    final newHash = _hashPin(newPin, salt);

    // Re-encrypt mnemonic: decrypt with old PIN → re-encrypt with new PIN
    final oldSalt = await _repo.getPinSalt();
    final oldEncrypted = await _repo.getEncryptedMnemonic();
    if (oldSalt != null && oldEncrypted != null) {
      final decrypted = _decryptWithPin(oldEncrypted, oldPin, oldSalt);
      final reencrypted = _encryptWithPin(decrypted, newPin, salt);
      await _repo.setEncryptedMnemonic(reencrypted);
    }

    // Re-encrypt passphrase if stored
    final storePassphrase = await _repo.getStorePassphrase();
    if (storePassphrase) {
      if (oldSalt != null) {
        final encPassphrase = await _repo.getEncryptedPassphrase();
        if (encPassphrase != null) {
          final passphrase = _decryptWithPin(encPassphrase, oldPin, oldSalt);
          final reencrypted = _encryptWithPin(passphrase, newPin, salt);
          await _repo.setEncryptedPassphrase(reencrypted);
        }
      }
    }

    // Store new PIN auth
    await _repo.setPinSalt(salt);
    await _repo.setPinHash(newHash);
    await resetPinAttempts();

    return true;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /// Lazy-load the PIN attempt counter from storage on first access.
  Future<void> _ensurePinAttemptsLoaded() async {
    if (_pinAttempts < 0) {
      _pinAttempts = await _repo.getPinAttempts();
    }
  }

  /// Hash a PIN with a salt using PBKDF2-HMAC-SHA256 (100k iterations).
  /// Thin wrapper: delegates to [ICryptoService] and throws on failure.
  String _hashPin(String pin, String salt) {
    final result = _crypto.pbkdf2Derive(pin, salt, 32);
    if (result == null) {
      throw StateError(
        'PBKDF2 derivation failed (pin=${pin.length} chars, '
        'salt=${salt.length} hex chars)',
      );
    }
    return result;
  }

  /// Encrypt plaintext using PIN-derived ChaCha20-Poly1305 key.
  String _encryptWithPin(String plaintext, String pin, String salt) {
    final result = _crypto.chacha20Encrypt(plaintext, pin, salt);
    if (result == null) {
      throw StateError(
        'ChaCha20 encryption failed (plaintext=${plaintext.length} chars, '
        'pin=${pin.length} chars, salt=${salt.length} hex chars)',
      );
    }
    return result;
  }

  /// Decrypt hex-encoded ciphertext (12B nonce || ciphertext+tag).
  String _decryptWithPin(String ciphertextHex, String pin, String salt) {
    final result = _crypto.chacha20Decrypt(ciphertextHex, pin, salt);
    if (result == null) {
      throw StateError(
        'ChaCha20 decryption failed (ciphertext=${ciphertextHex.length} hex chars, '
        'pin=${pin.length} chars, salt=${salt.length} hex chars). '
        'Possible wrong PIN or corrupted data.',
      );
    }
    return result;
  }

  /// Generate [length] random bytes as a lowercase hex string.
  String _randomHex(int length) {
    final random = Random.secure();
    final bytes = Uint8List(length);
    for (int i = 0; i < length; i++) {
      bytes[i] = random.nextInt(256);
    }
    return _crypto.hexEncode(bytes);
  }
}
