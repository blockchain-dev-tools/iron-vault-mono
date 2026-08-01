//! PIN-based cryptographic operations: PBKDF2 key derivation and
//! ChaCha20-Poly1305 authenticated encryption for mnemonic protection.

use crate::errors::{CryptoError, Result};
use chacha20poly1305::{aead::Aead, ChaCha20Poly1305, KeyInit, Nonce};
use hmac::Hmac;
use pbkdf2::pbkdf2;
use sha2::Sha256;

const PBKDF2_ITERATIONS: u32 = 100_000;

pub fn pbkdf2_derive(pin: &str, salt: &[u8], key_len: usize) -> Vec<u8> {
    let mut key = vec![0u8; key_len];
    pbkdf2::<Hmac<Sha256>>(pin.as_bytes(), salt, PBKDF2_ITERATIONS, &mut key)
        .expect("PBKDF2-HMAC-SHA256 should not fail");
    key
}

pub fn chacha20_encrypt(plaintext: &[u8], key: &[u8; 32]) -> Result<Vec<u8>> {
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;
    let nonce_bytes: [u8; 12] = {
        use rand::RngCore;
        let mut rng = rand::thread_rng();
        let mut buf = [0u8; 12];
        rng.fill_bytes(&mut buf);
        buf
    };
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;
    let mut out = Vec::with_capacity(12 + ciphertext.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

pub fn chacha20_decrypt(data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>> {
    if data.len() < 12 {
        return Err(CryptoError::DecryptionFailed("Ciphertext too short (missing nonce)".into()));
    }
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;
    let nonce = Nonce::from_slice(&data[..12]);
    cipher
        .decrypt(nonce, &data[12..])
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pbkdf2_derive_known_length() {
        let key = pbkdf2_derive("123456", b"salt", 32);
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn pbkdf2_derive_deterministic() {
        let a = pbkdf2_derive("test", b"fixed_salt", 16);
        let b = pbkdf2_derive("test", b"fixed_salt", 16);
        assert_eq!(a, b);
    }

    #[test]
    fn chacha20_roundtrip() {
        let key = [0xabu8; 32];
        let plaintext = b"hello world";
        let encrypted = chacha20_encrypt(plaintext, &key).unwrap();
        assert!(encrypted.len() > 12, "should have nonce + ciphertext");
        let decrypted = chacha20_decrypt(&encrypted, &key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn chacha20_wrong_key_fails() {
        let key = [0xabu8; 32];
        let wrong_key = [0xcdu8; 32];
        let encrypted = chacha20_encrypt(b"secret", &key).unwrap();
        assert!(chacha20_decrypt(&encrypted, &wrong_key).is_err());
    }
}
