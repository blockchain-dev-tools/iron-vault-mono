import { deriveSolanaPrivateKey, solanaPubKey, signSolanaMessage } from '@iron-vault/crypto';
import { parseBip32Path, bytesToHex } from '../parser';
import { requireSeed, maybeDeferred, ulog, clearSuiSign, startSuiSignTimer } from './shared';
import * as shared from './shared';

// ── Sui App handler (CLA 0x07) ────────────────────────────────────────────────
// Sui uses SLIP-10 Ed25519 (same as Solana), derivation path m/44'/784'/0'/0'/0'

export async function handleSui(
  ins: number, p1: number, _p2: number, data: Uint8Array,
): Promise<string | null> {
  switch (ins) {
    case 0x01: return buildGetAppConfiguration();          // GET_APP_CONFIGURATION
    case 0x02: return handleGetSuiPublicKey(data);         // GET_PUBLIC_KEY
    case 0x03: return handleSuiSign(p1, data);             // SIGN_TRANSACTION
    case 0x04: return handleSuiSign(p1, data);             // SIGN_PERSONAL_MESSAGE
    default:   return null;
  }
}

// ── GET_APP_CONFIGURATION — 0x07 01 ──────────────────────────────────────────

function buildGetAppConfiguration(): string {
  // blind_sign_enabled(1) + major(1) + minor(1) + patch(1) + 9000
  return bytesToHex(new Uint8Array([0x01, 0x00, 0x01, 0x00, 0x90, 0x00]));
}

// ── GET_PUBLIC_KEY — 0x07 02 ──────────────────────────────────────────────────

async function handleGetSuiPublicKey(data: Uint8Array): Promise<string> {
  const { path } = parseBip32Path(data);
  const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
  const seed = await requireSeed();
  const privKey = deriveSolanaPrivateKey(seed, path);
  const pubKey = solanaPubKey(privKey);
  ulog(`[SUI] path: m/${pathStr} pubkey: ${bytesToHex(pubKey)}`);
  const resp = new Uint8Array(32 + 2);
  resp.set(pubKey, 0);
  resp[32] = 0x90; resp[33] = 0x00;
  return bytesToHex(resp);
}

// ── SIGN_TRANSACTION / SIGN_PERSONAL_MESSAGE — 0x07 03 / 04 ─────────────────

async function handleSuiSign(p1: number, data: Uint8Array): Promise<string> {
  ulog(`[SUI SIGN] P1=0x${p1.toString(16).padStart(2,'0')} len=${data.length}`);

  if (p1 === 0x00) {
    // First (and possibly only) frame: BIP32 path + message bytes
    const { path, rest } = parseBip32Path(data);
    const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
    const seed = await requireSeed();
    const privKey = deriveSolanaPrivateKey(seed, path);
    ulog(`[SUI SIGN] path: m/${pathStr}`);
    clearSuiSign();
    shared.S.suiSign = { privKey, msg: Array.from(rest) };
    startSuiSignTimer();
    // For single-frame sign (rest contains full message)
    return finishSuiSign();
  }

  if (p1 === 0x80) {
    // Continuation frame
    if (!shared.S.suiSign) return '6f00';
    shared.S.suiSign.msg.push(...Array.from(data));
    ulog(`[SUI SIGN] +${data.length}b total: ${shared.S.suiSign.msg.length}b`);
    return '9000';
  }

  if (p1 === 0x90) {
    // Final continuation frame
    if (!shared.S.suiSign) return '6f00';
    shared.S.suiSign.msg.push(...Array.from(data));
    return finishSuiSign();
  }

  return '6b00';
}

async function finishSuiSign(): Promise<string> {
  if (!shared.S.suiSign) return '6f00';
  const msg = new Uint8Array(shared.S.suiSign.msg);
  const savedKey = shared.S.suiSign.privKey;
  clearSuiSign();

  return maybeDeferred(
    'sui', msg,
    () => {
      const result = signSolanaMessage(savedKey, msg);
      ulog(`[SUI SIGN] sig: ${bytesToHex(result).slice(0, 32)}…`);
      return bytesToHex(result);
    },
    { data: 'Sui transaction' },
  );
}
