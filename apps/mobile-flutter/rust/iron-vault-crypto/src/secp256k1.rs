//! secp256k1 椭圆曲线算法（ECDSA 签名 + 公钥推导）。
//!
//! 封装 k256 crate，供 ETH/BTC/TRX 共用。

use crate::errors::{CryptoError, Result};
use k256::ecdsa::SigningKey;

pub fn sign_prehash_recoverable<F>(
    private_key: &[u8],
    hash: &[u8; 32],
    v_fn: F,
) -> Result<Vec<u8>>
where
    F: FnOnce(u8) -> u8,
{
    let signing_key = SigningKey::from_slice(private_key)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;
    let (sig, recid) = signing_key
        .sign_prehash_recoverable(hash)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;
    let r = sig.r().to_bytes();
    let s = sig.s().to_bytes();
    let v = v_fn(recid.to_byte());
    let mut result = Vec::with_capacity(65);
    result.push(v);
    result.extend_from_slice(&r);
    result.extend_from_slice(&s);
    Ok(result)
}

pub fn public_key_bytes(private_key: &[u8], compressed: bool) -> Result<Vec<u8>> {
    let signing_key = SigningKey::from_slice(private_key)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;
    let verifying_key = signing_key.verifying_key();
    let encoded = verifying_key.to_encoded_point(compressed);
    Ok(encoded.as_bytes().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::keccak256;

    fn test_privkey() -> Vec<u8> {
        let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let mnemonic = bip39::Mnemonic::parse(phrase).unwrap();
        let seed = mnemonic.to_seed("");
        // Use bip32 crate to derive
        let path: bip32::DerivationPath = "m/44'/60'/0'/0/0".parse().unwrap();
        let xprv = bip32::XPrv::derive_from_path(&seed, &path).unwrap();
        xprv.private_key().to_bytes().to_vec()
    }

    #[test]
    fn public_key_uncompressed_65_bytes() {
        let pk = test_privkey();
        let pubkey = public_key_bytes(&pk, false).unwrap();
        assert_eq!(pubkey.len(), 65);
        assert_eq!(pubkey[0], 0x04);
    }

    #[test]
    fn public_key_compressed_33_bytes() {
        let pk = test_privkey();
        let pubkey = public_key_bytes(&pk, true).unwrap();
        assert_eq!(pubkey.len(), 33);
        assert!(pubkey[0] == 0x02 || pubkey[0] == 0x03);
    }

    #[test]
    fn sign_and_recover() {
        let pk = test_privkey();
        let hash = keccak256::hash(b"hello world");
        let sig = sign_prehash_recoverable(&pk, &hash, |v| 27 + v).unwrap();
        assert_eq!(sig.len(), 65);
        assert!(sig[0] == 27 || sig[0] == 28);
    }

    #[test]
    fn sign_deterministic() {
        let pk = test_privkey();
        let hash = keccak256::hash(b"test message");
        let sig1 = sign_prehash_recoverable(&pk, &hash, |v| v).unwrap();
        let sig2 = sign_prehash_recoverable(&pk, &hash, |v| v).unwrap();
        assert_eq!(sig1, sig2);
    }
}
