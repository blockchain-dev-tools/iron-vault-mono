import * as bip39 from '@scure/bip39';
import { wordlist as EN } from '@scure/bip39/wordlists/english.js';
import { wordlist as ZH_SIMP } from '@scure/bip39/wordlists/simplified-chinese.js';
import { wordlist as ZH_TRAD } from '@scure/bip39/wordlists/traditional-chinese.js';
import { wordlist as CS } from '@scure/bip39/wordlists/czech.js';
import { wordlist as FR } from '@scure/bip39/wordlists/french.js';
import { wordlist as IT } from '@scure/bip39/wordlists/italian.js';
import { wordlist as JA } from '@scure/bip39/wordlists/japanese.js';
import { wordlist as KO } from '@scure/bip39/wordlists/korean.js';
import { wordlist as PT } from '@scure/bip39/wordlists/portuguese.js';
import { wordlist as ES } from '@scure/bip39/wordlists/spanish.js';

export type Bip39Language =
  | 'en' | 'zh-Hans' | 'zh-Hant'
  | 'cs' | 'fr' | 'it' | 'ja' | 'ko' | 'pt' | 'es';

export const BIP39_WORDLISTS: Record<Bip39Language, string[]> = {
  en: EN, 'zh-Hans': ZH_SIMP, 'zh-Hant': ZH_TRAD,
  cs: CS, fr: FR, it: IT, ja: JA, ko: KO, pt: PT, es: ES,
};

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim(), EN);
}

export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Uint8Array> {
  return bip39.mnemonicToSeed(mnemonic.trim(), passphrase);
}

export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(EN, strength);
}

export function generateMnemonicWithWordlist(lang: Bip39Language = 'en', strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(BIP39_WORDLISTS[lang], strength);
}

export function mnemonicToEntropy(mnemonic: string, lang: Bip39Language = 'en'): Uint8Array {
  return bip39.mnemonicToEntropy(mnemonic.trim(), BIP39_WORDLISTS[lang]);
}

export function entropyToMnemonic(entropy: Uint8Array, lang: Bip39Language = 'en'): string {
  return bip39.entropyToMnemonic(entropy, BIP39_WORDLISTS[lang]);
}

export function reencodeMnemonic(mnemonic: string, fromLang: Bip39Language, toLang: Bip39Language): string {
  const entropy = mnemonicToEntropy(mnemonic, fromLang);
  return entropyToMnemonic(entropy, toLang);
}

export function validateMnemonicWithWordlist(mnemonic: string, lang: Bip39Language): boolean {
  return bip39.validateMnemonic(mnemonic.trim(), BIP39_WORDLISTS[lang]);
}
