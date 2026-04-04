import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim(), wordlist);
}

export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Uint8Array> {
  return bip39.mnemonicToSeed(mnemonic.trim(), passphrase);
}

export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(wordlist, strength);
}
