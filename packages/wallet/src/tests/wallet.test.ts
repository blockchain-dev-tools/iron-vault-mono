import { describe, it, expect, beforeEach } from 'vitest';
import { setupWallet, unlockWallet, verifyPin, hasWallet, getAccounts, clearWallet, hasStoredPassphrase } from '../service';
import type { WalletStorage } from '../types';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/** In-memory WalletStorage for tests */
function makeStorage(): WalletStorage {
  const store = new Map<string, string>();
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    removeItem: async (key) => { store.delete(key); },
  };
}

describe('hasWallet', () => {
  it('returns false when no mnemonic stored', async () => {
    expect(await hasWallet(makeStorage())).toBe(false);
  });

  it('returns true after setupWallet', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    expect(await hasWallet(s)).toBe(true);
  });
});

describe('setupWallet + verifyPin', () => {
  it('correct PIN verifies successfully', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    expect(await verifyPin(s, '123456')).toBe(true);
  });

  it('wrong PIN is rejected', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    expect(await verifyPin(s, '000000')).toBe(false);
  });

  it('stores PBKDF2 hash (wallet.pinKdf), not legacy SHA-256', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    const kdf = await s.getItem('wallet.pinKdf');
    const legacy = await s.getItem('wallet.pinHash');
    expect(kdf).not.toBeNull();
    expect(kdf).toContain(':'); // format: "saltHex:hashHex"
    expect(legacy).toBeNull();  // legacy key must not be present
  });

  it('PIN hash includes a unique salt (two setups with same PIN produce different hashes)', async () => {
    const s1 = makeStorage();
    const s2 = makeStorage();
    await setupWallet(s1, TEST_MNEMONIC, '123456');
    await setupWallet(s2, TEST_MNEMONIC, '123456');
    expect(await s1.getItem('wallet.pinKdf')).not.toBe(await s2.getItem('wallet.pinKdf'));
  });

  it('encrypts passphrase in storage so unlock re-derives correctly', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456', 'secret-passphrase');
    // Stored encrypted, not plaintext
    expect(await s.getItem('wallet.passphrase')).toBeNull();
    expect(await hasStoredPassphrase(s)).toBe(true);
  });

  it('does not persist empty passphrase', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    expect(await s.getItem('wallet.passphrase')).toBeNull();
    expect(await hasStoredPassphrase(s)).toBe(false);
  });
});

describe('legacy SHA-256 migration', () => {
  it('transparently upgrades old SHA-256 hash to PBKDF2 on first verify', async () => {
    // Simulate legacy storage with bare SHA-256 hash
    const s = makeStorage();
    const { sha256 } = await import('@noble/hashes/sha2.js');
    const { bytesToHex } = await import('@noble/hashes/utils.js');
    const legacyHash = bytesToHex(sha256(new TextEncoder().encode('123456')));
    await s.setItem('wallet.pinHash', legacyHash);
    await s.setItem('wallet.mnemonic', TEST_MNEMONIC);

    // First verify with new code — should succeed and upgrade
    expect(await verifyPin(s, '123456')).toBe(true);

    // After upgrade: new PBKDF2 entry present, legacy entry gone
    expect(await s.getItem('wallet.pinKdf')).not.toBeNull();
    expect(await s.getItem('wallet.pinHash')).toBeNull();

    // Subsequent verify still works
    expect(await verifyPin(s, '123456')).toBe(true);
  });

  it('rejects wrong PIN during legacy migration', async () => {
    const s = makeStorage();
    const { sha256 } = await import('@noble/hashes/sha2.js');
    const { bytesToHex } = await import('@noble/hashes/utils.js');
    const legacyHash = bytesToHex(sha256(new TextEncoder().encode('123456')));
    await s.setItem('wallet.pinHash', legacyHash);
    expect(await verifyPin(s, '000000')).toBe(false);
    // Legacy entry should still be present (no upgrade on wrong PIN)
    expect(await s.getItem('wallet.pinHash')).not.toBeNull();
  });
});

describe('unlockWallet + passphrase', () => {
  it('unlockWallet returns same addresses as setupWallet when passphrase is set', async () => {
    const s = makeStorage();
    const setup = await setupWallet(s, TEST_MNEMONIC, '123456', 'my-passphrase');
    const unlock = await unlockWallet(s, '123456');
    expect(unlock).not.toBeNull();
    expect(unlock!.accounts.eth[0].full).toBe(setup.eth[0].full);
    expect(unlock!.accounts.sol[0].full).toBe(setup.sol[0].full);
  });

  it('passphrase-derived address differs from no-passphrase address', async () => {
    const s1 = makeStorage();
    const s2 = makeStorage();
    const withPassphrase = await setupWallet(s1, TEST_MNEMONIC, '123456', 'my-passphrase');
    const noPassphrase  = await setupWallet(s2, TEST_MNEMONIC, '123456', '');
    expect(withPassphrase.eth[0].full).not.toBe(noPassphrase.eth[0].full);
  });

  it('clearWallet removes persisted passphrase', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456', 'secret');
    await clearWallet(s);
    expect(await s.getItem('wallet.passphraseEnc')).toBeNull();
    expect(await hasStoredPassphrase(s)).toBe(false);
  });
});

describe('unlockWallet', () => {
  it('returns WalletAccounts on correct PIN', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    const accounts = await unlockWallet(s, '123456');
    expect(accounts).not.toBeNull();
    expect(accounts!.accounts.eth).toHaveLength(1);
    expect(accounts!.accounts.sol).toHaveLength(1);
  });

  it('returns null on wrong PIN', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    const accounts = await unlockWallet(s, '000000');
    expect(accounts).toBeNull();
  });

  it('ETH address starts with 0x', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    const accounts = await unlockWallet(s, '123456');
    expect(accounts!.accounts.eth[0].full.startsWith('0x')).toBe(true);
  });

  it('known ETH address for abandon mnemonic account 0', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '000000');
    const accounts = await unlockWallet(s, '000000');
    // Known BIP-44 ETH m/44'/60'/0'/0/0 address
    expect(accounts!.accounts.eth[0].full).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });
});

describe('clearWallet', () => {
  it('removes all wallet data', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    await clearWallet(s);
    expect(await hasWallet(s)).toBe(false);
    expect(await verifyPin(s, '123456')).toBe(false);
  });
});

describe('getAccounts', () => {
  it('returns accounts without PIN', async () => {
    const s = makeStorage();
    await setupWallet(s, TEST_MNEMONIC, '123456');
    const accounts = await getAccounts(s);
    expect(accounts).not.toBeNull();
    expect(accounts!.eth[0].full).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('returns null when no wallet', async () => {
    expect(await getAccounts(makeStorage())).toBeNull();
  });
});
