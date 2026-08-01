import { describe, it, expect } from 'vitest';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import {
  generateMnemonicWithWordlist,
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  validateMnemonicWithWordlist,
  reencodeMnemonic,
  BIP39_WORDLISTS,
  type Bip39Language,
} from '../mnemonic';
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from '../hdkey';
import { ethPubKeyToAddress, solanaPubKey } from '../signer';

// ── Wordlist references ──────────────────────────────────────────────────────
const ZH_SIMP = BIP39_WORDLISTS['zh-Hans'];
const ZH_TRAD = BIP39_WORDLISTS['zh-Hant'];

/**
 * Split a mnemonic into words, handling Japanese ideographic space separator.
 */
function splitMnemonic(mnemonic: string, lang: Bip39Language): string[] {
  return lang === 'ja' ? mnemonic.split('\u3000') : mnemonic.split(' ');
}

describe('BIP-39 Chinese Wordlist — Simplified (zh-Hans)', () => {
  it('wordlist has exactly 2048 unique Chinese characters', () => {
    expect(ZH_SIMP).toHaveLength(2048);
    const unique = new Set(ZH_SIMP);
    expect(unique.size).toBe(2048);
  });

  it('generates a valid 12-word mnemonic from simplified Chinese', () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const words = splitMnemonic(mnemonic, 'zh-Hans');
    expect(words).toHaveLength(12);
    words.forEach(w => expect(ZH_SIMP).toContain(w));
    expect(validateMnemonicWithWordlist(mnemonic, 'zh-Hans')).toBe(true);
  });

  it('generates a valid 24-word mnemonic from simplified Chinese', () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 256);
    const words = splitMnemonic(mnemonic, 'zh-Hans');
    expect(words).toHaveLength(24);
    words.forEach(w => expect(ZH_SIMP).toContain(w));
    expect(validateMnemonicWithWordlist(mnemonic, 'zh-Hans')).toBe(true);
  });

  it('roundtrips: entropy -> Chinese mnemonic -> entropy', () => {
    const entropy = hexToBytes('7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f');
    const mnemonic = entropyToMnemonic(entropy, 'zh-Hans');
    const recovered = mnemonicToEntropy(mnemonic, 'zh-Hans');
    expect(bytesToHex(recovered)).toBe(bytesToHex(entropy));
  });

  it('rejects invalid Chinese mnemonic (word not in wordlist)', () => {
    const bad = '的 一 是 在 不 了 有 和 人 这 中 NOT_A_WORD';
    expect(validateMnemonicWithWordlist(bad, 'zh-Hans')).toBe(false);
  });

  it('rejects English mnemonic against Chinese wordlist', () => {
    const english = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    expect(validateMnemonicWithWordlist(english, 'zh-Hans')).toBe(false);
    expect(validateMnemonicWithWordlist(english, 'zh-Hant')).toBe(false);
    expect(validateMnemonicWithWordlist(english, 'en')).toBe(true);
  });
});

describe('BIP-39 Chinese Wordlist — Traditional (zh-Hant)', () => {
  it('wordlist has exactly 2048 unique Chinese characters', () => {
    expect(ZH_TRAD).toHaveLength(2048);
    const unique = new Set(ZH_TRAD);
    expect(unique.size).toBe(2048);
  });

  it('generates a valid 12-word mnemonic from traditional Chinese', () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hant', 128);
    const words = splitMnemonic(mnemonic, 'zh-Hant');
    expect(words).toHaveLength(12);
    words.forEach(w => expect(ZH_TRAD).toContain(w));
    expect(validateMnemonicWithWordlist(mnemonic, 'zh-Hant')).toBe(true);
  });

  it('roundtrips: entropy -> traditional Chinese mnemonic -> entropy', () => {
    const entropy = hexToBytes('ffffffffffffffffffffffffffffffff');
    const mnemonic = entropyToMnemonic(entropy, 'zh-Hant');
    const recovered = mnemonicToEntropy(mnemonic, 'zh-Hant');
    expect(bytesToHex(recovered)).toBe(bytesToHex(entropy));
  });
});

// ── Cross-language re-encoding ───────────────────────────────────────────────

describe('cross-language re-encoding', () => {
  it('re-encodes English mnemonic to simplified Chinese (same entropy)', () => {
    const english = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    expect(validateMnemonicWithWordlist(english, 'en')).toBe(true);

    const chinese = reencodeMnemonic(english, 'en', 'zh-Hans');
    const chineseWords = splitMnemonic(chinese, 'zh-Hans');
    expect(chineseWords).toHaveLength(12);
    chineseWords.forEach(w => expect(ZH_SIMP).toContain(w));

    const backToEnglish = reencodeMnemonic(chinese, 'zh-Hans', 'en');
    expect(backToEnglish).toBe(english);
  });

  it('re-encodes between simplified and traditional Chinese (same entropy)', () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const trad = reencodeMnemonic(mnemonic, 'zh-Hans', 'zh-Hant');
    const back = reencodeMnemonic(trad, 'zh-Hant', 'zh-Hans');
    expect(back).toBe(mnemonic);
  });

  it('all languages encode identical entropy deterministically', () => {
    const langs: Bip39Language[] = ['en', 'zh-Hans', 'zh-Hant', 'fr', 'es', 'ja', 'ko'];
    const ent = hexToBytes('7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f');

    for (const lang of langs) {
      const mn = entropyToMnemonic(ent, lang);
      expect(validateMnemonicWithWordlist(mn, lang)).toBe(true);

      const recovered = mnemonicToEntropy(mn, lang);
      expect(bytesToHex(recovered)).toBe(bytesToHex(ent));
    }
  });
});

// ── Seed derivation from Chinese mnemonics ────────────────────────────────────

describe('key derivation from Chinese mnemonics', () => {
  it('derives a 64-byte seed from Chinese mnemonic (with passphrase)', async () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const seed = await mnemonicToSeed(mnemonic, 'test-passphrase');
    expect(seed).toHaveLength(64);
  });

  it('derives ETH address from deterministic Chinese mnemonic', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const mnemonic = entropyToMnemonic(ent, 'zh-Hans');
    const seed = await mnemonicToSeed(mnemonic, '');

    const path = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const priv = deriveEthPrivateKey(seed, path);
    const { address } = ethPubKeyToAddress(priv);

    // Address is 40 hex chars WITHOUT 0x prefix (EIP-55 mixed-case)
    expect(address).toMatch(/^[0-9A-Fa-f]{40}$/);
    expect(address).not.toBe(address.toLowerCase());
    expect(address).not.toBe(address.toUpperCase());
  });

  it('derives different ETH accounts from Chinese mnemonic', async () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const seed = await mnemonicToSeed(mnemonic, '');

    const mkPath = (i: number) => [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, i];
    const addrs = await Promise.all(
      [0, 1, 2].map(async i => {
        const priv = deriveEthPrivateKey(seed, mkPath(i));
        return ethPubKeyToAddress(priv).address;
      })
    );
    expect(new Set(addrs).size).toBe(3);
  });

  it('derives Solana keys from Chinese mnemonic', async () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const seed = await mnemonicToSeed(mnemonic, '');

    const path = [0x80000000 | 44, 0x80000000 | 501, 0x80000000 | 0, 0x80000000 | 0];
    const priv = deriveSolanaPrivateKey(seed, path);
    expect(priv).toHaveLength(32);

    const pub = solanaPubKey(priv);
    expect(pub).toHaveLength(32);
  });

  it('same mnemonic + passphrase gives deterministic seed', async () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const seed1 = await mnemonicToSeed(mnemonic, 'riddle-secret');
    const seed2 = await mnemonicToSeed(mnemonic, 'riddle-secret');
    expect(bytesToHex(seed1)).toBe(bytesToHex(seed2));
  });

  it('different passphrases produce different seeds from same mnemonic', async () => {
    const mnemonic = generateMnemonicWithWordlist('zh-Hans', 128);
    const seedNoPass = await mnemonicToSeed(mnemonic, '');
    const seedWithPass = await mnemonicToSeed(mnemonic, 'different');
    expect(bytesToHex(seedNoPass)).not.toBe(bytesToHex(seedWithPass));
  });
});

// ── "Riddle mode": Chinese content + password -> entropy -> mnemonic ──────────

describe('"Riddle mode" — Chinese content to mnemonic', () => {
  const CHINESE_RIDDLE = '床前明月光疑是地上霜举头望明月低头思故乡';

  /**
   * Derives entropy from Chinese content + password via PBKDF2.
   * This is a conceptual scheme — not a standardized BIP extension.
   */
  function riddleToEntropy(
    chineseContent: string,
    password: string,
    entropyBytes: 16 | 20 | 24 | 28 | 32 = 16,
  ): Uint8Array {
    const salt = new TextEncoder().encode(`iron-vault-riddle:${chineseContent}`);
    const pass = new TextEncoder().encode(password);
    return pbkdf2(sha512, pass, salt, { c: 2048, dkLen: entropyBytes });
  }

  it('generates deterministic mnemonic from riddle + password', () => {
    const entropy = riddleToEntropy(CHINESE_RIDDLE, 'secret123', 16);
    expect(entropy).toHaveLength(16);

    const mnemonic = entropyToMnemonic(entropy, 'zh-Hans');
    const words = splitMnemonic(mnemonic, 'zh-Hans');
    expect(words).toHaveLength(12);
    words.forEach(w => expect(ZH_SIMP).toContain(w));

    const entropy2 = riddleToEntropy(CHINESE_RIDDLE, 'secret123', 16);
    const mnemonic2 = entropyToMnemonic(entropy2, 'zh-Hans');
    expect(mnemonic2).toBe(mnemonic);
  });

  it('different passwords produce different mnemonics (same riddle)', () => {
    const e1 = riddleToEntropy(CHINESE_RIDDLE, 'password-a', 16);
    const e2 = riddleToEntropy(CHINESE_RIDDLE, 'password-b', 16);
    const m1 = entropyToMnemonic(e1, 'zh-Hans');
    const m2 = entropyToMnemonic(e2, 'zh-Hans');
    expect(m1).not.toBe(m2);
  });

  it('derives wallet keys from riddle-based mnemonic', async () => {
    const entropy = riddleToEntropy(CHINESE_RIDDLE, 'wallet-pass', 16);
    const mnemonic = entropyToMnemonic(entropy, 'zh-Hans');

    const seed = await mnemonicToSeed(mnemonic, 'wallet-passphrase');

    // ETH
    const ethPath = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const ethPriv = deriveEthPrivateKey(seed, ethPath);
    const ethAddr = ethPubKeyToAddress(ethPriv).address;
    expect(ethAddr).toMatch(/^[0-9A-Fa-f]{40}$/);

    // Solana
    const solPath = [0x80000000 | 44, 0x80000000 | 501, 0x80000000 | 0, 0x80000000 | 0];
    const solPriv = deriveSolanaPrivateKey(seed, solPath);
    expect(solPriv).toHaveLength(32);
  });

  it('riddle -> mnemonic roundtrip via entropy', () => {
    const entropy = riddleToEntropy(CHINESE_RIDDLE, 'roundtrip', 16);
    const mnemonic = entropyToMnemonic(entropy, 'zh-Hans');
    const recovered = mnemonicToEntropy(mnemonic, 'zh-Hans');
    expect(bytesToHex(recovered)).toBe(bytesToHex(entropy));
  });
});

// ── All languages ────────────────────────────────────────────────────────────

describe('all 10 BIP-39 wordlists', () => {
  it('generates mnemonics for every supported language', () => {
    const langs: Bip39Language[] = [
      'en', 'zh-Hans', 'zh-Hant', 'cs', 'fr', 'it', 'ja', 'ko', 'pt', 'es',
    ];
    for (const lang of langs) {
      const mnemonic = generateMnemonicWithWordlist(lang, 128);
      const words = splitMnemonic(mnemonic, lang);
      expect(words).toHaveLength(12);
      words.forEach(w => expect(BIP39_WORDLISTS[lang]).toContain(w));
    }
  });

  it('supports 15/18/21-word mnemonics from wider entropy', () => {
    // 20 bytes = 160 bits = 15 words
    const e15 = hexToBytes('000102030405060708090a0b0c0d0e0f10111213');
    expect(e15).toHaveLength(20);
    const m15 = entropyToMnemonic(e15, 'zh-Hans');
    expect(splitMnemonic(m15, 'zh-Hans')).toHaveLength(15);
    expect(validateMnemonicWithWordlist(m15, 'zh-Hans')).toBe(true);

    // 24 bytes = 192 bits = 18 words
    const e18 = hexToBytes('000102030405060708090a0b0c0d0e0f1011121314151617');
    expect(e18).toHaveLength(24);
    const m18 = entropyToMnemonic(e18, 'zh-Hans');
    expect(splitMnemonic(m18, 'zh-Hans')).toHaveLength(18);
    expect(validateMnemonicWithWordlist(m18, 'zh-Hans')).toBe(true);

    // 28 bytes = 224 bits = 21 words
    const e21 = hexToBytes('000102030405060708090a0b0c0d0e0f101112131415161718191a1b');
    expect(e21).toHaveLength(28);
    const m21 = entropyToMnemonic(e21, 'zh-Hans');
    expect(splitMnemonic(m21, 'zh-Hans')).toHaveLength(21);
    expect(validateMnemonicWithWordlist(m21, 'zh-Hans')).toBe(true);
  });
});
