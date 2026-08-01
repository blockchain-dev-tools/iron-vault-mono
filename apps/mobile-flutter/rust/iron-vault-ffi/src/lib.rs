pub mod types;

use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use zeroize::Zeroize;

use types::FfiResult;

unsafe fn cstr_to_str<'a>(ptr: *const c_char) -> Option<&'a str> {
    if ptr.is_null() { return None; }
    CStr::from_ptr(ptr).to_str().ok()
}

unsafe fn cstr_to_hex(ptr: *const c_char) -> Option<Vec<u8>> {
    let s = cstr_to_str(ptr)?;
    hex::decode(s).ok()
}

fn null_err() -> *mut FfiResult {
    FfiResult::err(99, "null pointer".into()).into_ptr()
}

fn result_to_ffi<T: AsRef<[u8]>>(result: iron_vault_biz::errors::Result<T>) -> *mut FfiResult {
    match result {
        Ok(v) => FfiResult::ok_hex(v.as_ref()).into_ptr(),
        Err(e) => FfiResult::from_chain_error(e).into_ptr(),
    }
}

fn result_str_to_ffi(result: iron_vault_biz::errors::Result<String>) -> *mut FfiResult {
    match result {
        Ok(s) => FfiResult::ok(s).into_ptr(),
        Err(e) => FfiResult::from_chain_error(e).into_ptr(),
    }
}

// ── BIP-39 mnemonic ──────────────────────────────────────────────────

#[no_mangle]
pub unsafe extern "C" fn generate_mnemonic(strength: u32) -> *mut FfiResult {
    FfiResult::ok(iron_vault_biz::mnemonic::generate(strength)).into_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn validate_mnemonic(mnemonic_ptr: *const c_char) -> u8 {
    match cstr_to_str(mnemonic_ptr) {
        Some(s) => u8::from(iron_vault_biz::mnemonic::validate(s)),
        None => 0,
    }
}

#[no_mangle]
pub unsafe extern "C" fn reencode_mnemonic(mnemonic_ptr: *const c_char) -> *mut FfiResult {
    let s = match cstr_to_str(mnemonic_ptr) { Some(s) => s, None => return null_err() };
    FfiResult::ok(iron_vault_biz::mnemonic::reencode(s)).into_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mnemonic_to_seed(
    mnemonic_ptr: *const c_char, passphrase_ptr: *const c_char,
) -> *mut FfiResult {
    let mnemonic = match cstr_to_str(mnemonic_ptr) { Some(s) => s, None => return null_err() };
    let passphrase = match cstr_to_str(passphrase_ptr) { Some(s) => s, None => "" };
    result_to_ffi(iron_vault_crypto::bip39::mnemonic_to_seed(mnemonic, passphrase).map_err(Into::into))
}

#[no_mangle]
pub unsafe extern "C" fn generate_mnemonic_lang(strength: u32, language: u32) -> *mut FfiResult {
    let lang = match iron_vault_biz::mnemonic::Bip39Language::from_u32(language) {
        Some(l) => l.to_bip39_language(),
        None => return FfiResult::err(99, "invalid language code".into()).into_ptr(),
    };
    FfiResult::ok(iron_vault_biz::mnemonic::generate_with_language(strength, lang)).into_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn validate_mnemonic_lang(mnemonic_ptr: *const c_char, language: u32) -> u8 {
    let s = match cstr_to_str(mnemonic_ptr) { Some(s) => s, None => return 0 };
    let lang = match iron_vault_biz::mnemonic::Bip39Language::from_u32(language) {
        Some(l) => l.to_bip39_language(),
        None => return 0,
    };
    u8::from(iron_vault_biz::mnemonic::validate_with_language(s, lang))
}

// ── Enigma ────────────────────────────────────────────────────────────

#[no_mangle]
pub unsafe extern "C" fn enigma_derive_mnemonic(
    riddle_ptr: *const c_char, secret_ptr: *const c_char, language: u32,
) -> *mut FfiResult {
    let riddle = match cstr_to_str(riddle_ptr) { Some(s) => s, None => return null_err() };
    let secret = match cstr_to_str(secret_ptr) { Some(s) => s, None => return null_err() };
    let lang = match iron_vault_biz::mnemonic::Bip39Language::from_u32(language) {
        Some(l) => l, None => return FfiResult::err(99, "invalid language code".into()).into_ptr(),
    };
    result_str_to_ffi(iron_vault_biz::enigma::generate(riddle, secret, lang))
}

#[no_mangle]
pub unsafe extern "C" fn enigma_entropy_hex(
    riddle_ptr: *const c_char, secret_ptr: *const c_char, language: u32,
) -> *mut FfiResult {
    let riddle = match cstr_to_str(riddle_ptr) { Some(s) => s, None => return null_err() };
    let secret = match cstr_to_str(secret_ptr) { Some(s) => s, None => return null_err() };
    let lang = match iron_vault_biz::mnemonic::Bip39Language::from_u32(language) {
        Some(l) => l, None => return FfiResult::err(99, "invalid language code".into()).into_ptr(),
    };
    FfiResult::ok(iron_vault_biz::enigma::entropy_hex(riddle, secret, lang)).into_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mnemonic_from_entropy(entropy_hex_ptr: *const c_char, language: u32) -> *mut FfiResult {
    let entropy = match cstr_to_str(entropy_hex_ptr) { Some(s) => s, None => return null_err() };
    let lang = match iron_vault_biz::mnemonic::Bip39Language::from_u32(language) {
        Some(l) => l, None => return FfiResult::err(99, "invalid language code".into()).into_ptr(),
    };
    result_str_to_ffi(iron_vault_biz::enigma::mnemonic_from_entropy(entropy, lang))
}

// ── HD key derivation ────────────────────────────────────────────────

#[cfg(any(feature = "eth", feature = "btc", feature = "tron"))]
#[no_mangle]
pub unsafe extern "C" fn derive_secp256k1_private_key_ffi(
    seed_hex_ptr: *const c_char, path_ptr: *const c_char,
) -> *mut FfiResult {
    let mut seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => { seed.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::hdkey::derive_secp256k1_private_key(&seed, path));
    seed.zeroize();
    result
}

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn eth_public_key_bytes_ffi(private_key_hex_ptr: *const c_char) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(private_key_hex_ptr) { Some(v) => v, None => return null_err() };
    let result = result_to_ffi(iron_vault_crypto::secp256k1::public_key_bytes(&privkey, false).map_err(Into::into));
    privkey.zeroize();
    result
}

#[cfg(any(feature = "sol", feature = "sui"))]
#[no_mangle]
pub unsafe extern "C" fn derive_ed25519_private_key_ffi(
    seed_hex_ptr: *const c_char, path_ptr: *const c_char,
) -> *mut FfiResult {
    let mut seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => { seed.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::hdkey::derive_ed25519_private_key(&seed, path));
    seed.zeroize();
    result
}

// ── Signing ───────────────────────────────────────────────────────────

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn sign_eth_transaction_ffi(
    privkey_hex_ptr: *const c_char, rlp_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let rlp = match cstr_to_hex(rlp_hex_ptr) { Some(v) => v, None => { privkey.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::eth::sign_transaction(&privkey, &rlp));
    privkey.zeroize();
    result
}

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn sign_eth_personal_message_ffi(
    privkey_hex_ptr: *const c_char, message_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let message = match cstr_to_hex(message_hex_ptr) { Some(v) => v, None => { privkey.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::eth::sign_personal_message(&privkey, &message));
    privkey.zeroize();
    result
}

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn sign_eth_eip712_ffi(
    privkey_hex_ptr: *const c_char, domain_hash_hex_ptr: *const c_char, struct_hash_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let domain_hash = match cstr_to_hex(domain_hash_hex_ptr) { Some(v) => v, None => { privkey.zeroize(); return null_err(); } };
    let struct_hash = match cstr_to_hex(struct_hash_hex_ptr) { Some(v) => v, None => { privkey.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::eth::sign_eip712(&privkey, &domain_hash, &struct_hash));
    privkey.zeroize();
    result
}

#[cfg(feature = "sol")]
#[no_mangle]
pub unsafe extern "C" fn sign_solana_message_ffi(
    privkey_hex_ptr: *const c_char, message_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let message = match cstr_to_hex(message_hex_ptr) { Some(v) => v, None => { privkey.zeroize(); return null_err(); } };
    let result = result_to_ffi(iron_vault_biz::solana::sign_message(&privkey, &message));
    privkey.zeroize();
    result
}

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn eth_address_from_private_key_ffi(privkey_hex_ptr: *const c_char) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let result = result_str_to_ffi(iron_vault_biz::eth::address_from_private_key(&privkey));
    privkey.zeroize();
    result
}

#[cfg(feature = "sol")]
#[no_mangle]
pub unsafe extern "C" fn solana_public_key_bytes_ffi(privkey_hex_ptr: *const c_char) -> *mut FfiResult {
    let mut privkey = match cstr_to_hex(privkey_hex_ptr) { Some(v) => v, None => return null_err() };
    let result = result_to_ffi(iron_vault_biz::solana::public_key_bytes(&privkey));
    privkey.zeroize();
    result
}

// ── Address derivation ───────────────────────────────────────────────

#[cfg(feature = "eth")]
#[no_mangle]
pub unsafe extern "C" fn derive_eth_address_ffi(seed_hex_ptr: *const c_char, path_ptr: *const c_char) -> *mut FfiResult {
    let seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::eth::derive_address(&seed, path))
}

#[cfg(feature = "sol")]
#[no_mangle]
pub unsafe extern "C" fn derive_sol_address_ffi(seed_hex_ptr: *const c_char, path_ptr: *const c_char) -> *mut FfiResult {
    let seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::solana::derive_address(&seed, path))
}

#[cfg(feature = "btc")]
#[no_mangle]
pub unsafe extern "C" fn derive_btc_address_ffi(seed_hex_ptr: *const c_char, path_ptr: *const c_char) -> *mut FfiResult {
    let seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::btc::derive_address(&seed, path))
}

#[cfg(feature = "tron")]
#[no_mangle]
pub unsafe extern "C" fn derive_tron_address_ffi(seed_hex_ptr: *const c_char, path_ptr: *const c_char) -> *mut FfiResult {
    let seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::tron::derive_address(&seed, path))
}

#[cfg(feature = "sui")]
#[no_mangle]
pub unsafe extern "C" fn derive_sui_address_ffi(seed_hex_ptr: *const c_char, path_ptr: *const c_char) -> *mut FfiResult {
    let seed = match cstr_to_hex(seed_hex_ptr) { Some(v) => v, None => return null_err() };
    let path = match cstr_to_str(path_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::sui::derive_address(&seed, path))
}

// ── BTC/address utilities ───────────────────────────────────────────

#[cfg(feature = "btc")]
#[no_mangle]
pub unsafe extern "C" fn p2wpkh_address_ffi(compressed_pubkey_hex_ptr: *const c_char) -> *mut FfiResult {
    let pubkey = match cstr_to_hex(compressed_pubkey_hex_ptr) { Some(v) => v, None => return null_err() };
    FfiResult::ok(iron_vault_biz::btc::p2wpkh_address(&pubkey)).into_ptr()
}

#[cfg(feature = "tron")]
#[no_mangle]
pub unsafe extern "C" fn tron_address_from_pubkey_ffi(uncompressed_pubkey_hex_ptr: *const c_char) -> *mut FfiResult {
    let pubkey = match cstr_to_hex(uncompressed_pubkey_hex_ptr) { Some(v) => v, None => return null_err() };
    FfiResult::ok(iron_vault_biz::tron::tron_address_from_pubkey(&pubkey)).into_ptr()
}

#[cfg(feature = "sui")]
#[no_mangle]
pub unsafe extern "C" fn sui_address_ffi(ed25519_pubkey_hex_ptr: *const c_char) -> *mut FfiResult {
    let pubkey = match cstr_to_hex(ed25519_pubkey_hex_ptr) { Some(v) => v, None => return null_err() };
    FfiResult::ok(iron_vault_biz::sui::sui_address(&pubkey)).into_ptr()
}

// ── PBKDF2 + ChaCha20 ───────────────────────────────────────────────

#[no_mangle]
pub unsafe extern "C" fn pbkdf2_derive(pin_ptr: *const c_char, salt_hex_ptr: *const c_char, key_len: u32) -> *mut FfiResult {
    let pin = match cstr_to_str(pin_ptr) { Some(s) => s, None => return null_err() };
    let salt = match cstr_to_hex(salt_hex_ptr) { Some(v) => v, None => return null_err() };
    let key = iron_vault_crypto::pbkdf2_chacha20::pbkdf2_derive(pin, &salt, key_len as usize);
    FfiResult::ok_hex(&key).into_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn chacha20_encrypt(
    plaintext_ptr: *const c_char, pin_ptr: *const c_char, salt_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let plaintext = match cstr_to_str(plaintext_ptr) { Some(s) => s, None => return null_err() };
    let pin = match cstr_to_str(pin_ptr) { Some(s) => s, None => return null_err() };
    let salt = match cstr_to_hex(salt_hex_ptr) { Some(v) => v, None => return null_err() };
    let mut key = [0u8; 32];
    let derived = iron_vault_crypto::pbkdf2_chacha20::pbkdf2_derive(pin, &salt, 32);
    key.copy_from_slice(&derived);
    let result = match iron_vault_crypto::pbkdf2_chacha20::chacha20_encrypt(plaintext.as_bytes(), &key) {
        Ok(out) => FfiResult::ok_hex(&out).into_ptr(),
        Err(e) => FfiResult::from_chain_error(iron_vault_biz::errors::ChainError::CryptoError(e)).into_ptr(),
    };
    key.zeroize();
    result
}

#[no_mangle]
pub unsafe extern "C" fn chacha20_decrypt(
    ciphertext_hex_ptr: *const c_char, pin_ptr: *const c_char, salt_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let data = match cstr_to_hex(ciphertext_hex_ptr) { Some(v) => v, None => return null_err() };
    let pin = match cstr_to_str(pin_ptr) { Some(s) => s, None => return null_err() };
    let salt = match cstr_to_hex(salt_hex_ptr) { Some(v) => v, None => return null_err() };
    let mut key = [0u8; 32];
    let derived = iron_vault_crypto::pbkdf2_chacha20::pbkdf2_derive(pin, &salt, 32);
    key.copy_from_slice(&derived);
    let result = match iron_vault_crypto::pbkdf2_chacha20::chacha20_decrypt(&data, &key) {
        Ok(plaintext) => match String::from_utf8(plaintext) {
            Ok(s) => FfiResult::ok(s).into_ptr(),
            Err(_) => FfiResult::err(99, "UTF-8 decode failed".into()).into_ptr(),
        },
        Err(e) => FfiResult::from_chain_error(iron_vault_biz::errors::ChainError::CryptoError(e)).into_ptr(),
    };
    key.zeroize();
    result
}

// ── APDU parser ─────────────────────────────────────────────────────

#[no_mangle]
pub unsafe extern "C" fn parse_sign_data(
    chain_ptr: *const c_char, payload_hex_ptr: *const c_char,
) -> *mut FfiResult {
    let chain = match cstr_to_str(chain_ptr) { Some(s) => s, None => return null_err() };
    let payload_hex = match cstr_to_str(payload_hex_ptr) { Some(s) => s, None => return null_err() };
    result_str_to_ffi(iron_vault_biz::parser::parse_sign_data(chain, payload_hex))
}

// ── Memory ──────────────────────────────────────────────────────────

#[no_mangle]
pub unsafe extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() { let _ = CString::from_raw(ptr); }
}
