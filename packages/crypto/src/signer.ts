import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { keccak_256 } from '@noble/hashes/sha3.js';

// ── ETH ───────────────────────────────────────────────────────────────────────

export function ethPubKeyToAddress(privKey: Uint8Array): { pubKey: Uint8Array; address: string } {
  const pubKey = secp256k1.getPublicKey(privKey, false); // uncompressed 65 bytes
  const hash = keccak_256(pubKey.slice(1));               // hash of X+Y (64 bytes)
  const raw = bufToHex(hash.slice(12));                   // last 20 bytes, lowercase hex
  const address = eip55Checksum(raw);                     // EIP-55 mixed-case checksum
  return { pubKey, address };
}

function eip55Checksum(addr: string): string {
  const hashed = bufToHex(keccak_256(new TextEncoder().encode(addr)));
  return addr
    .split('')
    .map((c, i) => (parseInt(hashed[i], 16) >= 8 ? c.toUpperCase() : c))
    .join('');
}

/**
 * Sign an Ethereum transaction (RLP-encoded, EIP-155 or typed).
 * Returns v(1) + r(32) + s(32) + 9000(2)
 */
export function signEthTransaction(privKey: Uint8Array, rlp: Uint8Array): Uint8Array {
  const hash = keccak_256(rlp);
  const sig = secp256k1.sign(hash, privKey, { lowS: true });
  const recoveryBit = sig.recovery ?? 0;
  const compact = sig.toCompactRawBytes();
  const r = compact.slice(0, 32);
  const s = compact.slice(32, 64);

  // EIP-2718 typed tx (first byte <= 0x7f): v = recovery bit only
  // Legacy EIP-155 (chainId=1): v = 37 + recovery
  const isTyped = rlp[0] <= 0x7f;
  const v = isTyped ? recoveryBit : 37 + recoveryBit;

  const result = new Uint8Array(1 + 32 + 32);
  result[0] = v;
  result.set(r, 1);
  result.set(s, 33);
  return result;
}

/**
 * Sign an Ethereum personal message (EIP-191).
 * Prefixes with "\x19Ethereum Signed Message:\n{len}" before hashing.
 * Returns v(1) + r(32) + s(32) + 9000(2)
 */
export function signEthPersonalMessage(privKey: Uint8Array, message: Uint8Array): Uint8Array {
  const prefix = new TextEncoder().encode(
    `\x19Ethereum Signed Message:\n${message.length}`
  );
  const payload = new Uint8Array(prefix.length + message.length);
  payload.set(prefix, 0);
  payload.set(message, prefix.length);
  const hash = keccak_256(payload);

  const sig = secp256k1.sign(hash, privKey, { lowS: true });
  const recoveryBit = sig.recovery ?? 0;
  const compact = sig.toCompactRawBytes();

  const result = new Uint8Array(1 + 32 + 32);
  result[0] = 27 + recoveryBit; // personal_sign uses 27/28
  result.set(compact.slice(0, 32), 1);
  result.set(compact.slice(32, 64), 33);
  return result;
}

/**
 * Sign EIP-712 typed data (hash-only mode).
 * Signs keccak256("\x19\x01" + domainHash + structHash).
 * Returns v(1) + r(32) + s(32) + 9000(2)
 */
export function signEthEip712(
  privKey: Uint8Array,
  domainHash: Uint8Array,
  structHash: Uint8Array,
): Uint8Array {
  const payload = new Uint8Array(2 + 32 + 32);
  payload[0] = 0x19;
  payload[1] = 0x01;
  payload.set(domainHash, 2);
  payload.set(structHash, 34);
  const hash = keccak_256(payload);

  const sig = secp256k1.sign(hash, privKey, { lowS: true });
  const recoveryBit = sig.recovery ?? 0;
  const compact = sig.toCompactRawBytes();

  const result = new Uint8Array(1 + 32 + 32);
  result[0] = 27 + recoveryBit;
  result.set(compact.slice(0, 32), 1);
  result.set(compact.slice(32, 64), 33);
  return result;
}

// ── Solana ────────────────────────────────────────────────────────────────────

export function solanaPubKey(privKey: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(privKey);
}

/**
 * Sign a Solana transaction message.
 * Returns raw 64-byte Ed25519 signature.
 */
export function signSolanaMessage(privKey: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, privKey);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
