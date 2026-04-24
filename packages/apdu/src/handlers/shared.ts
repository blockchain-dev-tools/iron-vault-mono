import { mnemonicToSeed } from '@iron-vault/crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EthSignSession { privKey: Uint8Array; rlp: number[]; }
export interface EthPersonalSession { privKey: Uint8Array; msgLen: number; msg: number[]; }
export interface SolSignSession { privKey: Uint8Array; msg: number[]; }
export interface BtcSession {
  command: string; frames: number[]; expectingContinue: boolean;
  clientCmd: number; privKey?: Uint8Array;
}
export interface TronSignSession { privKey: Uint8Array; tx: number[]; }
export interface SuiSignSession { privKey: Uint8Array; msg: number[]; }

export interface SignRequestData {
  chain: 'eth' | 'sol' | 'btc' | 'tron' | 'sui';
  raw: Uint8Array;
  data?: string;
  decoded?: Record<string, unknown>;
  sign: () => string;
}

// ── Mutable state container ────────────────────────────────────────────────────
// ESM namespace bindings are read-only from external modules.
// All mutable state lives here so handlers can freely mutate S.xxx.
export const S = {
  currentApp: 'Ethereum' as string,
  _uiLog: null as ((msg: string) => void) | null,
  _mnemonicProvider: null as (() => Promise<string | null>) | null,
  _signHandler: null as ((req: SignRequestData) => Promise<string>) | null,
  _seedCache: null as { mnemonicHash: string; seed: Uint8Array } | null,
  ethSign: null as EthSignSession | null,
  ethPersonal: null as EthPersonalSession | null,
  solSign: null as SolSignSession | null,
  btcSession: null as BtcSession | null,
  tronSign: null as TronSignSession | null,
  suiSign: null as SuiSignSession | null,
};

export const SIGN_TIMEOUT_MS = 120_000;

let _ethSignTimer: ReturnType<typeof setTimeout> | null = null;
let _ethPersonalTimer: ReturnType<typeof setTimeout> | null = null;
let _solTimer: ReturnType<typeof setTimeout> | null = null;
let _btcTimer: ReturnType<typeof setTimeout> | null = null;
let _tronTimer: ReturnType<typeof setTimeout> | null = null;
let _suiTimer: ReturnType<typeof setTimeout> | null = null;

export function ulog(msg: string): void { if (S._uiLog) S._uiLog(msg); }

export async function requireSeed(): Promise<Uint8Array> {
  if (!S._mnemonicProvider) throw new Error('No mnemonic provider set');
  const mnemonic = await S._mnemonicProvider();
  if (!mnemonic) throw new Error('No mnemonic available');
  const mnemonicHash = bytesToHex(sha256(new TextEncoder().encode(mnemonic)));
  if (S._seedCache && S._seedCache.mnemonicHash === mnemonicHash) return S._seedCache.seed;
  const seed = await mnemonicToSeed(mnemonic);
  S._seedCache = { mnemonicHash, seed };
  return seed;
}

export function clearEthSign(): void {
  S.ethSign = null;
  if (_ethSignTimer) { clearTimeout(_ethSignTimer); _ethSignTimer = null; }
}
export function clearEthPersonal(): void {
  S.ethPersonal = null;
  if (_ethPersonalTimer) { clearTimeout(_ethPersonalTimer); _ethPersonalTimer = null; }
}
export function startEthSignTimer(): void {
  if (_ethSignTimer) clearTimeout(_ethSignTimer);
  _ethSignTimer = setTimeout(() => { ulog('[ETH] sign session timed out'); clearEthSign(); }, SIGN_TIMEOUT_MS);
}
export function startEthPersonalTimer(): void {
  if (_ethPersonalTimer) clearTimeout(_ethPersonalTimer);
  _ethPersonalTimer = setTimeout(() => { ulog('[ETH] personal sign session timed out'); clearEthPersonal(); }, SIGN_TIMEOUT_MS);
}
export function clearSolSign(): void {
  S.solSign = null;
  if (_solTimer) { clearTimeout(_solTimer); _solTimer = null; }
}
export function startSolSignTimer(): void {
  if (_solTimer) clearTimeout(_solTimer);
  _solTimer = setTimeout(() => { ulog('[SOL] sign session timed out'); clearSolSign(); }, SIGN_TIMEOUT_MS);
}
export function clearBtcSession(): void {
  S.btcSession = null;
  if (_btcTimer) { clearTimeout(_btcTimer); _btcTimer = null; }
}
export function startBtcSessionTimer(): void {
  if (_btcTimer) clearTimeout(_btcTimer);
  _btcTimer = setTimeout(() => { ulog('[BTC] PSBT session timed out'); clearBtcSession(); }, SIGN_TIMEOUT_MS);
}
export function clearTronSign(): void {
  S.tronSign = null;
  if (_tronTimer) { clearTimeout(_tronTimer); _tronTimer = null; }
}
export function startTronSignTimer(): void {
  if (_tronTimer) clearTimeout(_tronTimer);
  _tronTimer = setTimeout(() => { ulog('[TRON] sign session timed out'); clearTronSign(); }, SIGN_TIMEOUT_MS);
}
export function clearSuiSign(): void {
  S.suiSign = null;
  if (_suiTimer) { clearTimeout(_suiTimer); _suiTimer = null; }
}
export function startSuiSignTimer(): void {
  if (_suiTimer) clearTimeout(_suiTimer);
  _suiTimer = setTimeout(() => { ulog('[SUI] sign session timed out'); clearSuiSign(); }, SIGN_TIMEOUT_MS);
}

export function clearSignSessions(): void {
  clearEthSign(); clearEthPersonal(); clearSolSign();
  clearBtcSession(); clearTronSign(); clearSuiSign();
}
export function resetSharedState(): void {
  S.currentApp = 'Ethereum'; S._uiLog = null; S._mnemonicProvider = null;
  S._signHandler = null; S._seedCache = null;
  clearSignSessions();
}

export async function maybeDeferred(
  chain: SignRequestData['chain'], raw: Uint8Array,
  sign: () => string, extra: Partial<SignRequestData>,
): Promise<string> {
  if (!S._signHandler) { ulog('[APDU] no sign handler — rejecting'); return '6985'; }
  try {
    const result = await S._signHandler({ chain, raw, sign, ...extra } as SignRequestData);
    return result === '6985' ? '6985' : result + '9000';
  } catch (e) { ulog('[APDU] sign handler error: ' + (e as Error)?.message); return '6985'; }
}

export interface ERC20Info { ticker: string; contractAddr: string; decimals: number; chainId: number; }
export interface NftInfo { name: string; contractAddr: string; chainId: number; }
let _lastToken: ERC20Info | null = null;
let _lastNft: NftInfo | null = null;
let _lastDomain: string | null = null;
export function setLastToken(t: ERC20Info | null): void { _lastToken = t; }
export function setLastNft(n: NftInfo | null): void { _lastNft = n; }
export function setLastDomain(d: string | null): void { _lastDomain = d; }
export function getLastToken(): ERC20Info | null { return _lastToken; }
export function getLastNft(): NftInfo | null { return _lastNft; }
export function getLastDomain(): string | null { return _lastDomain; }
