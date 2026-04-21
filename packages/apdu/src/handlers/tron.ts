import {
  deriveEthPrivateKey, tronAddressFromPrivKey,
  sha256Single, keccak256, signSecp256k1Compact,
} from '@iron-vault/crypto';
import { parseBip32Path, bytesToHex } from '../parser';
import { requireSeed, maybeDeferred, ulog, clearTronSign, startTronSignTimer } from './shared';
import * as shared from './shared';

// ── Tron App handler (CLA 0x14) ───────────────────────────────────────────────

export async function handleTron(
  ins: number, p1: number, _p2: number, data: Uint8Array,
): Promise<string | null> {
  switch (ins) {
    case 0x01: return buildGetAppConfiguration();             // GET_APP_CONFIGURATION
    case 0x02: return handleGetTronPublicKey(data);           // GET_PUBLIC_KEY
    case 0x04: return handleTronSignTransaction(p1, data);    // SIGN_TRANSACTION
    case 0x08: return handleTronSignPersonalMessage(p1, data);// SIGN_PERSONAL_MESSAGE
    default:   return null;
  }
}

// ── GET_APP_CONFIGURATION — 0x14 01 ──────────────────────────────────────────

function buildGetAppConfiguration(): string {
  // blind_sign_enabled(1) + major(1) + minor(1) + patch(1) + 9000
  return bytesToHex(new Uint8Array([0x01, 0x00, 0x05, 0x00, 0x90, 0x00]));
}

// ── GET_PUBLIC_KEY — 0x14 02 ──────────────────────────────────────────────────

async function handleGetTronPublicKey(data: Uint8Array): Promise<string> {
  const { path } = parseBip32Path(data);
  const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);
  const { uncompressedPubKey, address } = tronAddressFromPrivKey(privKey);

  ulog(`[TRON] path: m/${pathStr} addr: ${address}`);

  // Response: pubKey_len(1) + pubKey(65 uncompressed) + addr_len(1) + addr_hex_ascii(34) + 9000
  const addrBytes = new TextEncoder().encode(address);

  const resp = new Uint8Array(1 + 65 + 1 + addrBytes.length + 2);
  let i = 0;
  resp[i++] = 0x41; // length of uncompressed pubkey
  resp.set(uncompressedPubKey, i); i += 65;
  resp[i++] = addrBytes.length;
  resp.set(addrBytes, i); i += addrBytes.length;
  resp[i++] = 0x90; resp[i] = 0x00;
  return bytesToHex(resp);
}

// ── SIGN_TRANSACTION — 0x14 04 ───────────────────────────────────────────────

async function handleTronSignTransaction(p1: number, data: Uint8Array): Promise<string> {
  if (p1 === 0x00) {
    // First frame: BIP32 path + tx bytes
    const { path, rest } = parseBip32Path(data);
    const seed = await requireSeed();
    const privKey = deriveEthPrivateKey(seed, path);
    clearTronSign();
    shared.S.tronSign = { privKey, tx: Array.from(rest) };
    startTronSignTimer();
    return finishTronSign();
  }
  if (p1 === 0x80) {
    if (!shared.S.tronSign) return '6f00';
    shared.S.tronSign.tx.push(...Array.from(data));
    return finishTronSign();
  }
  return '6b00';
}

async function finishTronSign(): Promise<string> {
  if (!shared.S.tronSign) return '6f00';
  const txBytes = new Uint8Array(shared.S.tronSign.tx);
  const savedKey = shared.S.tronSign.privKey;
  clearTronSign();

  // Tron signs the sha256 of raw transaction bytes
  const hash = sha256Single(txBytes);

  return await maybeDeferred(
    'tron', txBytes,
    () => {
      const { sig, recovery } = signSecp256k1Compact(hash, savedKey);
      // Tron signature: r(32) + s(32) + v(1), where v = recovery bit
      const resp = new Uint8Array(32 + 32 + 1 + 2);
      resp.set(sig, 0); // r(32) + s(32)
      resp[64] = recovery;
      resp[65] = 0x90; resp[66] = 0x00;
      return bytesToHex(resp);
    },
    { data: 'Tron transaction' },
  );
}

// ── SIGN_PERSONAL_MESSAGE — 0x14 08 ──────────────────────────────────────────

async function handleTronSignPersonalMessage(p1: number, data: Uint8Array): Promise<string> {
  if (p1 !== 0x00) return '6b00';

  const { path, rest } = parseBip32Path(data);
  if (rest.length < 4) return '6700';
  const msgLen = ((rest[0]! << 24) | (rest[1]! << 16) | (rest[2]! << 8) | rest[3]!) >>> 0;
  const msgBytes = rest.slice(4, 4 + msgLen);

  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);

  // Tron personal message prefix (same as Ethereum EIP-191)
  const prefix = new TextEncoder().encode(`\x19TRON Signed Message:\n${msgLen}`);
  const full = new Uint8Array(prefix.length + msgBytes.length);
  full.set(prefix, 0);
  full.set(msgBytes, prefix.length);
  const hash = keccak256(full);

  return await maybeDeferred(
    'tron', msgBytes,
    () => {
      const { sig, recovery } = signSecp256k1Compact(hash, privKey);
      const resp = new Uint8Array(32 + 32 + 1 + 2);
      resp.set(sig, 0);
      resp[64] = recovery + 27; // EIP-191 v = 27 or 28
      resp[65] = 0x90; resp[66] = 0x00;
      return bytesToHex(resp);
    },
    { data: `TRON personal_sign` },
  );
}
