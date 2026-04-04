import { deriveSolanaPrivateKey, solanaPubKey, signSolanaMessage } from '@iron-vault/crypto';
import { base58Encode } from '@iron-vault/crypto';
import { parseBip32Path, bytesToHex } from '../parser';
import { requireSeed, maybeDeferred, ulog, solSign, clearSolSign, startSolSignTimer } from './shared';
import * as shared from './shared';

// ── Solana App handler (CLA E0, when currentApp === 'Solana') ─────────────────

export async function handleSol(
  ins: number, p1: number, p2: number, data: Uint8Array,
): Promise<string | null> {
  switch (ins) {
    case 0x01: return buildGetAppConfiguration();          // GET_APP_CONFIGURATION
    case 0x03: return handleSolanaSign(p1, p2, data);     // SIGN_OFFLINE_MESSAGE
    case 0x04: return handleSolanaSign(p1, p2, data);     // SIGN_MESSAGE
    case 0x05: return handleGetSolanaPubkey(data);        // GET_PUBKEY (preserved E0 05)
    case 0x06: return handleSolanaSign(p1, p2, data);     // SIGN_TRANSACTION (preserved E0 06)
    case 0x07: return handleGetSolanaAddress(data);       // GET_ADDRESS (base58)
    case 0x08: return '9000';                             // GET_APP_CONFIGURATION_V2 (stub)
    default:   return null;
  }
}

// ── GET_APP_CONFIGURATION — E0 01 (in Solana) ────────────────────────────────

function buildGetAppConfiguration(): string {
  // blind_sign_enabled(1) + major(1) + minor(1) + patch(1) + 9000
  return bytesToHex(new Uint8Array([0x01, 0x01, 0x03, 0x00, 0x90, 0x00]));
}

// ── GET_PUBKEY — E0 05 ────────────────────────────────────────────────────────

async function handleGetSolanaPubkey(data: Uint8Array): Promise<string> {
  const { path } = parseBip32Path(data);
  const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
  const seed = await requireSeed();
  const privKey = deriveSolanaPrivateKey(seed, path);
  const pubKey = solanaPubKey(privKey);
  ulog(`[SOL PUBKEY] m/${pathStr} → ${bytesToHex(pubKey)}`);
  const resp = new Uint8Array(34);
  resp.set(pubKey, 0);
  resp[32] = 0x90; resp[33] = 0x00;
  return bytesToHex(resp);
}

// ── GET_ADDRESS — E0 07 (base58-encoded) ─────────────────────────────────────

async function handleGetSolanaAddress(data: Uint8Array): Promise<string> {
  const { path } = parseBip32Path(data);
  const seed = await requireSeed();
  const privKey = deriveSolanaPrivateKey(seed, path);
  const pubKey = solanaPubKey(privKey);
  const addrStr = base58Encode(pubKey);
  const addrBytes = new TextEncoder().encode(addrStr);
  ulog(`[SOL ADDR] ${addrStr}`);
  const resp = new Uint8Array(1 + addrBytes.length + 2);
  resp[0] = addrBytes.length;
  resp.set(addrBytes, 1);
  resp[1 + addrBytes.length] = 0x90;
  resp[2 + addrBytes.length] = 0x00;
  return bytesToHex(resp);
}

// ── SIGN_TRANSACTION / SIGN_MESSAGE / SIGN_OFFLINE_MESSAGE — E0 04/05/06 ─────

export async function handleSolanaSign(p1: number, p2: number, data: Uint8Array): Promise<string> {
  ulog(`[SOL SIGN] P1=0x${p1.toString(16).padStart(2,'0')} P2=0x${p2.toString(16).padStart(2,'0')} len=${data.length}`);
  const isFirst = p1 === 0x01 || !shared.S.solSign;
  const hasMore = (p2 & 0x01) !== 0;

  if (isFirst) {
    // OKX sends a num_signers prefix byte (0x01) before the BIP32 path
    const hasNumSignersPrefix = data[0] === 0x01 && data.length > 1 && (data[1] ?? 0) >= 2 && (data[1] ?? 0) <= 5;
    const { path, rest } = parseBip32Path(hasNumSignersPrefix ? data.slice(1) : data);
    const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
    const seed = await requireSeed();
    const privKey = deriveSolanaPrivateKey(seed, path);
    ulog(`[SOL SIGN] path: m/${pathStr} first chunk: ${rest.length}b`);
    startSolSignTimer();
    shared.S.solSign = { privKey, msg: Array.from(rest) };
  } else {
    if (!shared.S.solSign) return '6f00';
    shared.S.solSign.msg.push(...Array.from(data));
    ulog(`[SOL SIGN] +${data.length}b total: ${shared.S.solSign.msg.length}b`);
  }

  if (!hasMore) {
    ulog(`[SOL SIGN] final chunk — signing ${shared.S.solSign!.msg.length}b`);
    return finishSolanaSign();
  }
  return '9000';
}

async function finishSolanaSign(): Promise<string> {
  if (!shared.S.solSign) return '6f00';
  const msg = new Uint8Array(shared.S.solSign.msg);
  const savedKey = shared.S.solSign.privKey;
  clearSolSign();
  return maybeDeferred(
    'sol', msg,
    () => { const r = signSolanaMessage(savedKey, msg); ulog(`[SOL SIGN] sig: ${bytesToHex(r).slice(0, 32)}…`); return bytesToHex(r); },
    {},
  );
}
