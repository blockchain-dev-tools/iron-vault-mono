import { sha256 } from '@noble/hashes/sha2.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';
import {
  generateMnemonic, validateMnemonic, deriveAccountsFromPaths,
  generateMnemonicWithWordlist, validateMnemonicWithWordlist,
  mnemonicToEntropy, entropyToMnemonic, reencodeMnemonic, BIP39_WORDLISTS,
} from '@iron-vault/crypto';
import type { WalletStorage, WalletAccounts } from './types';

export {
  generateMnemonic, validateMnemonic,
  generateMnemonicWithWordlist, validateMnemonicWithWordlist,
  mnemonicToEntropy, entropyToMnemonic, reencodeMnemonic, BIP39_WORDLISTS,
};
export type { Bip39Language } from '@iron-vault/crypto';

export type Chain = 'eth' | 'sol' | 'btc' | 'tron' | 'sui';

// Storage keys
const PIN_KDF_KEY       = 'wallet.pinKdf';
const PIN_HASH_KEY      = 'wallet.pinHash';
const MNEMONIC_KEY      = 'wallet.mnemonic';
const ACCOUNT_PATHS_KEY = 'wallet.accountPaths';
const PIN_ATTEMPTS_KEY  = 'wallet.pinAttempts';

interface PathEntry { path: string; custom: boolean; }
interface AccountPaths {
  eth: PathEntry[];
  sol: PathEntry[];
  btc: PathEntry[];
  tron: PathEntry[];
  sui: PathEntry[];
}

const DEFAULT_PATHS: AccountPaths = {
  eth:  [{ path: "m/44'/60'/0'/0/0",    custom: false }],
  sol:  [{ path: "m/44'/501'/0'/0'",    custom: false }],
  btc:  [{ path: "m/84'/0'/0'/0/0",     custom: false }],
  tron: [{ path: "m/44'/195'/0'/0/0",   custom: false }],
  sui:  [{ path: "m/44'/784'/0'/0'/0'", custom: false }],
};

// PBKDF2 parameters
const KDF_ITERATIONS = 10_000;
const KDF_LEN = 32;

async function kdfPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  return pbkdf2Async(sha256, new TextEncoder().encode(pin), salt, {
    c: KDF_ITERATIONS,
    dkLen: KDF_LEN,
  });
}

/** @deprecated Used only for transparent migration of existing SHA-256 hashes. */
function legacyHash(pin: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(pin)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i]! ^ bb[i]!;
  return diff === 0;
}

export async function getPinAttempts(s: WalletStorage): Promise<number> {
  const raw = await s.getItem(PIN_ATTEMPTS_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function incrementPinAttempts(s: WalletStorage): Promise<number> {
  const current = await getPinAttempts(s);
  const next = current + 1;
  await s.setItem(PIN_ATTEMPTS_KEY, String(next));
  return next;
}

export async function resetPinAttempts(s: WalletStorage): Promise<void> {
  await s.removeItem(PIN_ATTEMPTS_KEY);
}

export async function updatePin(s: WalletStorage, newPin: string): Promise<void> {
  const salt = randomBytes(16);
  const hash = await kdfPin(newPin, salt);
  await s.setItem(PIN_KDF_KEY, `${bytesToHex(salt)}:${bytesToHex(hash)}`);
  await s.removeItem(PIN_HASH_KEY);
}

function migrateEntries(arr: unknown[]): PathEntry[] {
  return arr.map(item =>
    typeof item === 'string'
      ? { path: item, custom: false }
      : { path: (item as PathEntry).path, custom: (item as PathEntry).custom ?? false },
  );
}

async function readPaths(s: WalletStorage): Promise<AccountPaths> {
  const raw = await s.getItem(ACCOUNT_PATHS_KEY);
  if (!raw) return DEFAULT_PATHS;
  try {
    const parsed = JSON.parse(raw);
    const eth  = Array.isArray(parsed.eth)  && parsed.eth.length  > 0 ? migrateEntries(parsed.eth)  : DEFAULT_PATHS.eth;
    const sol  = Array.isArray(parsed.sol)  && parsed.sol.length  > 0 ? migrateEntries(parsed.sol)  : DEFAULT_PATHS.sol;
    const btc  = Array.isArray(parsed.btc)  && parsed.btc.length  > 0 ? migrateEntries(parsed.btc)  : DEFAULT_PATHS.btc;
    const tron = Array.isArray(parsed.tron) && parsed.tron.length > 0 ? migrateEntries(parsed.tron) : DEFAULT_PATHS.tron;
    const sui  = Array.isArray(parsed.sui)  && parsed.sui.length  > 0 ? migrateEntries(parsed.sui)  : DEFAULT_PATHS.sui;
    return { eth, sol, btc, tron, sui };
  } catch {
    return DEFAULT_PATHS;
  }
}

function deriveFrom(mnemonic: string, paths: AccountPaths, passphrase = '') {
  return deriveAccountsFromPaths({
    mnemonic,
    passphrase,
    eth:  { paths: paths.eth.map(e => e.path),  custom: paths.eth.map(e => e.custom)  },
    sol:  { paths: paths.sol.map(e => e.path),  custom: paths.sol.map(e => e.custom)  },
    btc:  { paths: paths.btc.map(e => e.path),  custom: paths.btc.map(e => e.custom)  },
    tron: { paths: paths.tron.map(e => e.path), custom: paths.tron.map(e => e.custom) },
    sui:  { paths: paths.sui.map(e => e.path),  custom: paths.sui.map(e => e.custom)  },
  });
}

export async function hasWallet(s: WalletStorage): Promise<boolean> {
  return (await s.getItem(MNEMONIC_KEY)) !== null;
}

export async function setupWallet(
  s: WalletStorage,
  mnemonic: string,
  pin: string,
  passphrase = '',
): Promise<WalletAccounts> {
  const salt = randomBytes(16);
  const hash = await kdfPin(pin, salt);
  await s.setItem(PIN_KDF_KEY, `${bytesToHex(salt)}:${bytesToHex(hash)}`);
  await s.removeItem(PIN_HASH_KEY);
  await s.setItem(MNEMONIC_KEY, mnemonic);
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(DEFAULT_PATHS));
  return deriveFrom(mnemonic, DEFAULT_PATHS, passphrase);
}

export async function unlockWallet(
  s: WalletStorage,
  pin: string,
): Promise<WalletAccounts | null> {
  if (!(await verifyPin(s, pin))) return null;
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);
  return deriveFrom(mnemonic, paths);
}

export async function verifyPin(s: WalletStorage, pin: string): Promise<boolean> {
  const kdfEntry = await s.getItem(PIN_KDF_KEY);
  if (kdfEntry) {
    const colon = kdfEntry.indexOf(':');
    if (colon === -1) return false;
    const salt = hexToBytes(kdfEntry.slice(0, colon));
    const storedHash = kdfEntry.slice(colon + 1);
    const computed = await kdfPin(pin, salt);
    return timingSafeEqual(bytesToHex(computed), storedHash);
  }

  // Legacy SHA-256 migration path
  const legacyEntry = await s.getItem(PIN_HASH_KEY);
  if (legacyEntry && timingSafeEqual(legacyEntry, legacyHash(pin))) {
    const salt = randomBytes(16);
    const hash = await kdfPin(pin, salt);
    await s.setItem(PIN_KDF_KEY, `${bytesToHex(salt)}:${bytesToHex(hash)}`);
    await s.removeItem(PIN_HASH_KEY);
    return true;
  }

  return false;
}

export async function getAccounts(s: WalletStorage): Promise<WalletAccounts | null> {
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);
  return deriveFrom(mnemonic, paths);
}

export async function addAccount(
  s: WalletStorage,
  chain: Chain,
  path: string,
  custom: boolean,
): Promise<WalletAccounts | null> {
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);

  if (paths[chain].some(e => e.path === path)) {
    return deriveFrom(mnemonic, paths);
  }
  const newPaths: AccountPaths = {
    ...paths,
    [chain]: [...paths[chain], { path, custom }],
  };
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(newPaths));
  return deriveFrom(mnemonic, newPaths);
}

export async function removeAccount(
  s: WalletStorage,
  chain: Chain,
  path: string,
): Promise<WalletAccounts | null> {
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);
  const filtered = paths[chain].filter(e => e.path !== path);
  if (filtered.length === paths[chain].length) {
    return deriveFrom(mnemonic, paths);
  }
  const newPaths: AccountPaths = { ...paths, [chain]: filtered };
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(newPaths));
  return deriveFrom(mnemonic, newPaths);
}

export async function revealMnemonic(s: WalletStorage, pin: string): Promise<string | null> {
  if (!(await verifyPin(s, pin))) return null;
  return s.getItem(MNEMONIC_KEY);
}

export async function clearWallet(s: WalletStorage): Promise<void> {
  await s.removeItem(PIN_KDF_KEY);
  await s.removeItem(PIN_HASH_KEY);
  await s.removeItem(MNEMONIC_KEY);
  await s.removeItem(ACCOUNT_PATHS_KEY);
  await s.removeItem(PIN_ATTEMPTS_KEY);
}
