import { sha256 } from '@noble/hashes/sha2.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';
import { generateMnemonic, validateMnemonic, deriveAccountsFromPaths } from '@iron-vault/crypto';
import type { WalletStorage, WalletAccounts } from './types';

export { generateMnemonic, validateMnemonic };

// Storage keys
const PIN_KDF_KEY       = 'wallet.pinKdf';
const PIN_HASH_KEY      = 'wallet.pinHash';
const MNEMONIC_KEY      = 'wallet.mnemonic';
const ACCOUNT_PATHS_KEY = 'wallet.accountPaths';

interface AccountPaths { eth: string[]; sol: string[]; }

const DEFAULT_PATHS: AccountPaths = {
  eth: ["m/44'/60'/0'/0/0"],
  sol: ["m/44'/501'/0'/0'"],
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

async function readPaths(s: WalletStorage): Promise<AccountPaths> {
  const raw = await s.getItem(ACCOUNT_PATHS_KEY);
  if (!raw) return DEFAULT_PATHS;
  try {
    const parsed = JSON.parse(raw);
    return {
      eth: Array.isArray(parsed.eth) && parsed.eth.length > 0 ? parsed.eth : DEFAULT_PATHS.eth,
      sol: Array.isArray(parsed.sol) && parsed.sol.length > 0 ? parsed.sol : DEFAULT_PATHS.sol,
    };
  } catch {
    return DEFAULT_PATHS;
  }
}

export async function hasWallet(s: WalletStorage): Promise<boolean> {
  return (await s.getItem(MNEMONIC_KEY)) !== null;
}

export async function setupWallet(
  s: WalletStorage,
  mnemonic: string,
  pin: string,
  _passphrase = '',
): Promise<WalletAccounts> {
  const salt = randomBytes(16);
  const hash = await kdfPin(pin, salt);
  await s.setItem(PIN_KDF_KEY, `${bytesToHex(salt)}:${bytesToHex(hash)}`);
  await s.removeItem(PIN_HASH_KEY);
  await s.setItem(MNEMONIC_KEY, mnemonic);
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(DEFAULT_PATHS));
  return deriveAccountsFromPaths(mnemonic, DEFAULT_PATHS.eth, DEFAULT_PATHS.sol);
}

export async function unlockWallet(
  s: WalletStorage,
  pin: string,
): Promise<WalletAccounts | null> {
  if (!(await verifyPin(s, pin))) return null;
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const { eth, sol } = await readPaths(s);
  return deriveAccountsFromPaths(mnemonic, eth, sol);
}

export async function verifyPin(s: WalletStorage, pin: string): Promise<boolean> {
  const kdfEntry = await s.getItem(PIN_KDF_KEY);
  if (kdfEntry) {
    const colon = kdfEntry.indexOf(':');
    if (colon === -1) return false;
    const salt = hexToBytes(kdfEntry.slice(0, colon));
    const storedHash = kdfEntry.slice(colon + 1);
    const computed = await kdfPin(pin, salt);
    return bytesToHex(computed) === storedHash;
  }

  // Legacy SHA-256 migration path
  const legacyEntry = await s.getItem(PIN_HASH_KEY);
  if (legacyEntry && legacyEntry === legacyHash(pin)) {
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
  const { eth, sol } = await readPaths(s);
  return deriveAccountsFromPaths(mnemonic, eth, sol);
}

export async function addAccount(
  s: WalletStorage,
  chain: 'eth' | 'sol',
  path: string,
): Promise<WalletAccounts | null> {
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);
  if (paths[chain].includes(path)) {
    return deriveAccountsFromPaths(mnemonic, paths.eth, paths.sol);
  }
  const newPaths: AccountPaths = {
    ...paths,
    [chain]: [...paths[chain], path],
  };
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(newPaths));
  return deriveAccountsFromPaths(mnemonic, newPaths.eth, newPaths.sol);
}

export async function removeAccount(
  s: WalletStorage,
  chain: 'eth' | 'sol',
  path: string,
): Promise<WalletAccounts | null> {
  const mnemonic = await s.getItem(MNEMONIC_KEY);
  if (!mnemonic) return null;
  const paths = await readPaths(s);
  const filtered = paths[chain].filter(p => p !== path);
  if (filtered.length === paths[chain].length) return deriveAccountsFromPaths(mnemonic, paths.eth, paths.sol);
  const newPaths: AccountPaths = { ...paths, [chain]: filtered };
  await s.setItem(ACCOUNT_PATHS_KEY, JSON.stringify(newPaths));
  return deriveAccountsFromPaths(mnemonic, newPaths.eth, newPaths.sol);
}

export async function clearWallet(s: WalletStorage): Promise<void> {
  await s.removeItem(PIN_KDF_KEY);
  await s.removeItem(PIN_HASH_KEY);
  await s.removeItem(MNEMONIC_KEY);
  await s.removeItem(ACCOUNT_PATHS_KEY);
}
