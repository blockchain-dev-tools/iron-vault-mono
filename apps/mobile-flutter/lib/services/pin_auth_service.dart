import 'dart:math';
import 'dart:typed_data';

import '../biz/pin_biz.dart';
import '../core/interfaces/pin_auth_service.dart';
import '../core/interfaces/crypto_service.dart';
import '../core/interfaces/wallet_repository.dart';

/// PIN authentication service — extracted from WalletService.
///
/// Responsibilities:
/// - PIN hashing via PBKDF2-HMAC-SHA256 (100k iterations)
/// - PIN verification against stored hash + salt
/// - PIN change with mnemonic/passphrase re-encryption
/// - PIN attempt tracking with lockout (max 5)
/// - ChaCha20-Poly1305 encryption/decryption with PIN-derived keys
///
/// Depends on [ICryptoService] for all cryptographic operations,
/// and [IWalletRepository] for persistence.
class PinAuthService implements IPinAuthService {
  final ICryptoService _crypto;
  final IWalletRepository _repo;

  late final PinBiz _biz;

  PinAuthService({
    required ICryptoService crypto,
    required IWalletRepository repo,
  })  : _crypto = crypto,
        _repo = repo {
    _biz = PinBiz(crypto: _crypto, repo: _repo);
  }

  // ── PIN hashing (Rust PBKDF2-SHA256, 100k iterations) ─────────────

  @override
  String hashPin(String pin, String salt) {
    final result = _crypto.pbkdf2Derive(pin, salt, 32);
    if (result == null) {
      print(
          '[PinAuthService] hashPin: PBKDF2 FAILED (pin=${pin.length} chars, salt=${salt.length} hex)');
      throw StateError(
        'PBKDF2 derivation failed (pin=${pin.length} chars, salt=${salt.length} hex chars)',
      );
    }
    return result;
  }

  // ── Mnemonic encryption (Rust ChaCha20-Poly1305) ───────────────────

  @override
  String encryptWithPin(String plaintext, String pin, String salt) {
    final result = _crypto.chacha20Encrypt(plaintext, pin, salt);
    if (result == null) {
      print('[PinAuthService] encryptWithPin: ChaCha20 encrypt FAILED');
      throw StateError(
        'ChaCha20 encryption failed (plaintext=${plaintext.length} chars, '
        'pin=${pin.length} chars, salt=${salt.length} hex chars)',
      );
    }
    return result;
  }

  @override
  String decryptWithPin(String ciphertextHex, String pin, String salt) {
    final result = _crypto.chacha20Decrypt(ciphertextHex, pin, salt);
    if (result == null) {
      print('[PinAuthService] decryptWithPin: ChaCha20 decrypt FAILED');
      throw StateError(
        'ChaCha20 decryption failed (ciphertext=${ciphertextHex.length} hex chars, '
        'pin=${pin.length} chars, salt=${salt.length} hex chars). '
        'Possible wrong PIN or corrupted data.',
      );
    }
    return result;
  }

  // ── Random salt generation ─────────────────────────────────────────

  @override
  String randomHex(int length) {
    final random = Random.secure();
    final bytes = Uint8List(length);
    for (int i = 0; i < length; i++) {
      bytes[i] = random.nextInt(256);
    }
    return _crypto.hexEncode(bytes);
  }

  // ── PIN verification ───────────────────────────────────────────────

  @override
  Future<bool> verifyPin(String pin) async {
    return _biz.verifyPin(pin);
  }

  // ── PIN change ─────────────────────────────────────────────────────

  @override
  Future<bool> updatePin(String oldPin, String newPin) async {
    return _biz.updatePin(oldPin, newPin);
  }

  // ── PIN attempt tracking (delegated to PinBiz) ────────────────────

  @override
  int get pinAttempts => _biz.pinAttempts;

  @override
  int get maxPinAttempts => PinBiz.maxPinAttempts;

  @override
  Future<bool> isLocked() async {
    return _biz.isLocked();
  }

  @override
  Future<void> incrementPinAttempts() async {
    await _biz.incrementPinAttempts();
  }

  @override
  Future<void> resetPinAttempts() async {
    await _biz.resetPinAttempts();
  }
}
