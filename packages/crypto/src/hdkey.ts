import { HDKey } from '@scure/bip32';
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';

// ── ETH: BIP32 via @scure/bip32 ──────────────────────────────────────────────

export function deriveEthPrivateKey(seed: Uint8Array, pathComponents: number[]): Uint8Array {
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(bip32PathToString(pathComponents));
  if (!child.privateKey) throw new Error('No private key derived');
  return child.privateKey;
}

// ── Solana: SLIP-10 Ed25519 ───────────────────────────────────────────────────

const SLIP10_ED25519_KEY = new TextEncoder().encode('ed25519 seed');

export function deriveSolanaPrivateKey(seed: Uint8Array, pathComponents: number[]): Uint8Array {
  // Master key
  let I = hmac(sha512, SLIP10_ED25519_KEY, seed);
  let kL = I.slice(0, 32);
  let kR = I.slice(32);

  for (const component of pathComponents) {
    const hardened = (component & 0x80000000) !== 0;
    if (!hardened) throw new Error('SLIP-10 Ed25519 requires all-hardened paths');
    const index = component >>> 0; // keep as uint32

    const data = new Uint8Array(37);
    data[0] = 0x00;
    data.set(kL, 1);
    data[33] = (index >>> 24) & 0xff;
    data[34] = (index >>> 16) & 0xff;
    data[35] = (index >>> 8) & 0xff;
    data[36] = index & 0xff;

    const child = hmac(sha512, kR, data);
    kL = child.slice(0, 32);
    kR = child.slice(32);
  }

  return kL;
}

// Inlined from @iron-vault/apdu/parser to avoid circular dependency
function bip32PathToString(path: number[]): string {
  return 'm/' + path.map(c => {
    const hardened = (c & 0x80000000) !== 0;
    const index = c & 0x7fffffff;
    return hardened ? `${index}'` : `${index}`;
  }).join('/');
}
