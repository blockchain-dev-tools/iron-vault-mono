/// Abstract interface for PIN authentication.
///
/// Implemented by [PinAuthService] in `lib/services/`.
/// [WalletService] depends on this interface, never on the concrete implementation.
abstract class IPinAuthService {
  /// Hash a PIN with a salt using PBKDF2-HMAC-SHA256 (100k iterations).
  /// Returns 64-char hex string.
  String hashPin(String pin, String salt);

  /// Verify a PIN against the stored hash and salt.
  ///
  /// Side effects: auto-increments failed attempts on mismatch,
  /// resets attempt counter to zero on successful match.
  Future<bool> verifyPin(String pin);

  /// Change the PIN: re-encrypt mnemonic and passphrase with new PIN.
  /// Returns `true` on success, `false` if old PIN was wrong.
  Future<bool> updatePin(String oldPin, String newPin);

  /// Current PIN attempt count.
  int get pinAttempts;

  /// Max allowed PIN attempts before lockout.
  int get maxPinAttempts;

  /// Whether the wallet is currently locked out.
  Future<bool> isLocked();

  /// Increment the failed PIN attempt counter.
  Future<void> incrementPinAttempts();

  /// Reset the PIN attempt counter to zero.
  Future<void> resetPinAttempts();

  /// Encrypt plaintext using PIN-derived key (ChaCha20-Poly1305).
  String encryptWithPin(String plaintext, String pin, String salt);

  /// Decrypt ciphertext using PIN-derived key (ChaCha20-Poly1305).
  String decryptWithPin(String ciphertextHex, String pin, String salt);

  /// Generate [length] random bytes as a hex string.
  String randomHex(int length);
}
