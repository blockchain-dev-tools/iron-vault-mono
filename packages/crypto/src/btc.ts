import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { base58, bech32 } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1';

// Inlined to avoid circular dep with @iron-vault/apdu
function bip32PathToString(path: number[]): string {
  return 'm/' + path.map(c => {
    const h = (c & 0x80000000) !== 0;
    const i = c & 0x7fffffff;
    return h ? `${i}'` : `${i}`;
  }).join('/');
}

/** Single SHA-256 (e.g. for Tron transaction hashing) */
export function sha256Single(data: Uint8Array): Uint8Array {
  return sha256(data);
}

/** Double SHA-256 */
export function sha256d(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/** SHA-256 then RIPEMD-160 (Bitcoin hash160) */
export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/** keccak-256 hash (for Tron personal message) */
export function keccak256(data: Uint8Array): Uint8Array {
  return keccak_256(data);
}

/** 4-byte BIP-32 master fingerprint (first 4 bytes of hash160(masterPubKey)) */
export function btcMasterFingerprint(seed: Uint8Array): Uint8Array {
  const root = HDKey.fromMasterSeed(seed);
  return hash160(root.publicKey!).slice(0, 4);
}

/** Serialize BIP-32 xpub string at given path (e.g. "xpub6...") */
export function serializeXpub(seed: Uint8Array, pathComponents: number[]): string {
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(bip32PathToString(pathComponents));
  return child.publicExtendedKey;
}

/** secp256k1 public key from private key */
export function secp256k1PublicKey(privKey: Uint8Array, compressed: boolean): Uint8Array {
  return secp256k1.getPublicKey(privKey, compressed);
}

/** Sign a pre-hashed message with secp256k1, returns DER-encoded signature (for BTC) */
export function signSecp256k1DER(hash: Uint8Array, privKey: Uint8Array): Uint8Array {
  return secp256k1.sign(hash, privKey).toDERRawBytes();
}

/** Sign a pre-hashed message with secp256k1, returns compact r(32)+s(32) and recovery bit (for Tron) */
export function signSecp256k1Compact(hash: Uint8Array, privKey: Uint8Array): { sig: Uint8Array; recovery: number } {
  const s = secp256k1.sign(hash, privKey);
  return { sig: s.toCompactRawBytes(), recovery: s.recovery ?? 0 };
}

/** Base58 encode (no checksum) — used for Solana addresses */
export function base58Encode(data: Uint8Array): string {
  return base58.encode(data);
}

/** P2WPKH (native SegWit) bech32 address: bc1q... */
export function p2wpkhAddress(pubKey: Uint8Array): string {
  const pubKeyHash = hash160(pubKey);
  const words = bech32.toWords(pubKeyHash);
  return bech32.encode('bc', [0, ...words]);
}

/** Tron address from secp256k1 private key — returns T... base58check string */
export function tronAddressFromPrivKey(privKey: Uint8Array): {
  pubKey: Uint8Array;
  uncompressedPubKey: Uint8Array;
  address: string;
} {
  const pubUncompressed = secp256k1.getPublicKey(privKey, false); // 65 bytes, starts with 0x04
  const pubBytes = pubUncompressed.slice(1); // 64 bytes
  const hash = keccak_256(pubBytes);
  const last20 = hash.slice(12); // last 20 bytes

  // Tron prefix: 0x41
  const addrRaw = new Uint8Array(21);
  addrRaw[0] = 0x41;
  addrRaw.set(last20, 1);

  // base58check: addrRaw + first-4-bytes-of-sha256d(addrRaw)
  const checksum = sha256d(addrRaw).slice(0, 4);
  const full = new Uint8Array(25);
  full.set(addrRaw);
  full.set(checksum, 21);

  return {
    pubKey: secp256k1.getPublicKey(privKey, true), // compressed 33 bytes
    uncompressedPubKey: pubUncompressed,            // uncompressed 65 bytes
    address: base58.encode(full),
  };
}
