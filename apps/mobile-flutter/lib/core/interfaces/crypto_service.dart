import 'dart:typed_data';

/// Abstract interface for all cryptographic operations.
///
/// Implemented by [CryptoBridge] (`lib/infrastructure/ffi/crypto_bridge.dart`)
/// which delegates to the Rust `iron_vault_crypto` crate via `dart:ffi`.
///
/// Services depend on this interface, never on the concrete FFI implementation.
/// This enables unit testing with mock crypto providers (no Rust .so required).
abstract class ICryptoService {
  // ── BIP-39 Mnemonic ─────────────────────────────────────────────────

  /// Generate a BIP-39 mnemonic phrase.
  /// [strength] must be 128 (12 words) or 256 (24 words).
  String generateMnemonic({int strength = 128});

  /// Validate a BIP-39 mnemonic phrase.
  bool validateMnemonic(String mnemonic);

  /// Re-encode a mnemonic (normalize, validate, canonical form).
  String reencodeMnemonic(String mnemonic);

  /// Generate a BIP-39 mnemonic with a specific language.
  String? generateMnemonicLang({int strength = 128, required int language});

  /// Validate a BIP-39 mnemonic against a specific language.
  bool validateMnemonicLang(String mnemonic, int language);

  // ── HD Key Derivation ───────────────────────────────────────────────

  /// Derive a secp256k1 (Ethereum/Bitcoin) private key from seed.
  Uint8List? deriveSecp256k1PrivateKey(String seedHex, String path);

  /// Derive an Ed25519 (Solana/Sui) private key from seed.
  Uint8List? deriveEd25519PrivateKey(String seedHex, String path);

  // ── Signing ─────────────────────────────────────────────────────────

  /// Sign an Ethereum transaction (raw RLP).
  Uint8List? signEthTransaction(String privkeyHex, String rlpHex);

  /// Sign an Ethereum personal message (EIP-191).
  Uint8List? signEthPersonalMessage(String privkeyHex, String messageHex);

  /// Sign Ethereum EIP-712 typed structured data.
  Uint8List? signEthEIP712(
      String privkeyHex, String domainHashHex, String structHashHex);

  /// Sign a Solana message (Ed25519).
  Uint8List? signSolanaMessage(String privkeyHex, String messageHex);

  // ── Address from Private Key ────────────────────────────────────────

  /// Derive EIP-55 checksummed Ethereum address from private key.
  String? ethAddressFromPrivateKey(String privkeyHex);

  /// Get uncompressed secp256k1 public key (65 bytes).
  Uint8List? ethPublicKeyBytes(String privkeyHex);

  /// Extract Ed25519 public key bytes from Solana private key.
  Uint8List? solanaPublicKeyBytes(String privkeyHex);

  // ── Address from Seed + Path ────────────────────────────────────────

  /// Derive an Ethereum address from BIP-39 seed + BIP-32 path.
  String? deriveEthAddress(String seedHex, String path);

  /// Derive a Solana address from BIP-39 seed + SLIP-10 path.
  String? deriveSolAddress(String seedHex, String path);

  /// Derive a Bitcoin P2WPKH address (bech32) from seed + BIP-84 path.
  String? deriveBtcAddress(String seedHex, String path);

  /// Derive a Tron address (base58check) from seed + BIP-44 path.
  String? deriveTronAddress(String seedHex, String path);

  /// Derive a Sui address from seed + SLIP-10 path.
  String? deriveSuiAddress(String seedHex, String path);

  // ── Address from Public Key ─────────────────────────────────────────

  /// Derive a Bitcoin P2WPKH bech32 address from compressed public key.
  String? p2wpkhAddress(String compressedPubkeyHex);

  /// Derive a Tron base58check address from uncompressed public key.
  String? tronAddressFromPubkey(String uncompressedPubkeyHex);

  /// Derive a Sui address from an Ed25519 public key.
  String? suiAddress(String ed25519PubkeyHex);

  // ── Enigma ─────────────────────────────────────────────────────────

  /// Generate a deterministic 24-word Enigma mnemonic from riddle + secret.
  ///
  /// [language] is the [Bip39Language] code (0–9). Uses that language for
  /// riddle tokenization and output wordlist. Returns null on error.
  String? enigmaDeriveMnemonic(String riddle, String secret, int language);

  /// Get the raw entropy hex for an Enigma mnemonic (before BIP-39 encoding).
  String? enigmaEntropyHex(String riddle, String secret, int language);

  /// Convert raw entropy hex to a BIP-39 mnemonic with the given language.
  String? mnemonicFromEntropy(String entropyHex, int language);

  // ── APDU Sign Data Parser ───────────────────────────────────────────

  /// Parse APDU signing payload into a JSON display structure.
  ///
  /// [chain] is one of: ethereum, personal_msg, eip712, solana, bitcoin, tron, sui.
  /// [payloadHex] is the hex-encoded payload (RLP/message) after the derivation path.
  /// Returns a JSON string on success, null on parse failure.
  String? parseSignData(String chain, String payloadHex);

  // ── PIN auth + Mnemonic Encryption ─────────────────────────────────

  /// Derive a key from PIN + salt using PBKDF2-HMAC-SHA256 (100k iterations).
  String? pbkdf2Derive(String pin, String saltHex, int keyLen);

  /// Derive a 64-byte BIP-39 seed from mnemonic + optional passphrase.
  String? mnemonicToSeed(String mnemonic, {String passphrase = ''});

  /// Encrypt plaintext using ChaCha20-Poly1305 with a PIN-derived key.
  String? chacha20Encrypt(String plaintext, String pin, String saltHex);

  /// Decrypt hex-encoded ciphertext (12B nonce || ciphertext+tag).
  String? chacha20Decrypt(String ciphertextHex, String pin, String saltHex);

  // ── Hex Utilities ──────────────────────────────────────────────────

  /// Encode bytes to lowercase hex string.
  String hexEncode(Uint8List bytes);

  /// Decode hex string to bytes.
  Uint8List hexToBytes(String hex);
}
