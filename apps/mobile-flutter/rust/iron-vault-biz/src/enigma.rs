//! Enigma 确定性助记词。
//!
//! 谜语 + 密钥 → keccak256 → 24 词 BIP-39 mnemonic。

use crate::errors::{ChainError, Result};
use bip39::{Language, Mnemonic};
use sha3::{Digest, Keccak256};
use crate::mnemonic::Bip39Language;

const HEX_CAP: usize = 64;

fn is_cjk(lang: Language) -> bool {
    matches!(lang, Language::SimplifiedChinese | Language::TraditionalChinese | Language::Japanese)
}

fn tokenize(text: &str, lang: Language) -> Vec<String> {
    if is_cjk(lang) {
        text.chars().filter(|c| !c.is_whitespace()).map(|c| c.to_string()).collect()
    } else {
        text.split_whitespace().map(|w| w.to_lowercase()).collect()
    }
}

fn derive_entropy(riddle: &str, secret: &str, lang: Language) -> [u8; 32] {
    let tokens = tokenize(riddle, lang);
    let mut entropy_hex = String::with_capacity(HEX_CAP);
    for token in &tokens {
        if entropy_hex.len() >= HEX_CAP { break; }
        if let Some(index) = lang.find_word(token) {
            let chunk = format!("{:x}", index);
            if entropy_hex.len() + chunk.len() <= HEX_CAP {
                entropy_hex.push_str(&chunk);
            } else { break; }
        }
    }
    if entropy_hex.len() % 2 != 0 { entropy_hex.insert(0, '0'); }
    let entropy_bytes = hex::decode(&entropy_hex).expect("even-length hex");
    let entropy_hash = Keccak256::digest(&entropy_bytes);
    let entropy_hash_hex = hex::encode(entropy_hash);
    let salt_hash_hex = if !secret.is_empty() {
        hex::encode(Keccak256::digest(secret.as_bytes()))
    } else { String::new() };
    let combined_hex = format!("{}{}", entropy_hash_hex, salt_hash_hex);
    let combined_bytes = hex::decode(&combined_hex).expect("128 hex chars");
    Keccak256::digest(&combined_bytes).into()
}

pub fn generate(riddle: &str, secret: &str, language: Bip39Language) -> Result<String> {
    let bip39_lang = language.to_bip39_language();
    let entropy = derive_entropy(riddle, secret, bip39_lang);
    let mnemonic = Mnemonic::from_entropy_in(Language::English, &entropy)
        .map_err(|e| ChainError::EnigmaError(e.to_string()))?;
    Ok(mnemonic.to_string())
}

pub fn entropy_hex(riddle: &str, secret: &str, language: Bip39Language) -> String {
    let bip39_lang = language.to_bip39_language();
    let entropy = derive_entropy(riddle, secret, bip39_lang);
    hex::encode(entropy)
}

pub fn mnemonic_from_entropy(entropy_hex: &str, language: Bip39Language) -> Result<String> {
    let bytes = hex::decode(entropy_hex)
        .map_err(|e| ChainError::EnigmaError(format!("invalid entropy hex: {e}")))?;
    if bytes.len() != 32 {
        return Err(ChainError::EnigmaError("entropy must be 32 bytes".into()));
    }
    let mnemonic = Mnemonic::from_entropy_in(language.to_bip39_language(), &bytes)
        .map_err(|e| ChainError::EnigmaError(e.to_string()))?;
    Ok(mnemonic.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn en(riddle: &str, secret: &str) -> String {
        generate(riddle, secret, Bip39Language::English).unwrap()
    }

    #[test]
    fn same_input_produces_same_mnemonic() {
        let a = en("What is the answer to life?", "42");
        let b = en("What is the answer to life?", "42");
        assert_eq!(a, b);
    }

    #[test]
    fn different_riddle_produces_different_mnemonic() {
        assert_ne!(en("abandon ability about", "test"), en("abandon ability above", "test"));
    }

    #[test]
    fn different_secret_produces_different_mnemonic() {
        assert_ne!(en("test riddle", "secret A"), en("test riddle", "secret B"));
    }

    #[test]
    fn deterministic_across_10_calls() {
        let reference = en("Satoshi Nakamoto", "Bitcoin");
        for _ in 0..10 {
            assert_eq!(en("Satoshi Nakamoto", "Bitcoin"), reference);
        }
    }

    #[test]
    fn produces_24_words() {
        assert_eq!(en("hello", "world").split_whitespace().count(), 24);
    }

    #[test]
    fn produces_valid_bip39_mnemonic() {
        let phrase = en("test", "test");
        assert!(Mnemonic::parse(&phrase).is_ok());
    }

    #[test]
    fn empty_inputs_produce_deterministic_mnemonic() {
        assert_eq!(en("", ""), en("", ""));
    }

    #[test]
    fn mixed_case_riddle_is_normalized() {
        assert_eq!(en("ABANDON ABILITY ABOUT", "test"), en("abandon ability about", "test"));
    }
}
