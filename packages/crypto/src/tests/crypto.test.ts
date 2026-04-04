import { describe, it, expect } from 'vitest';
import { bytesToHex } from '@noble/hashes/utils.js';
import { mnemonicToSeed } from '../mnemonic';
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from '../hdkey';
import { ethPubKeyToAddress, solanaPubKey } from '../signer';

// Standard BIP-39 test mnemonic — all derivations from this are well-known
const ABANDON_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// ── EIP-55 checksum ───────────────────────────────────────────────────────────

describe('ethPubKeyToAddress — EIP-55 checksum', () => {
  it('produces correct mixed-case checksum for abandon mnemonic ETH account 0', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const path = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const priv = deriveEthPrivateKey(seed, path);
    const { address } = ethPubKeyToAddress(priv);
    // Known BIP-44 ETH address for this mnemonic/path
    expect(address).toBe('9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('address is neither all-upper nor all-lower (checksum is mixed case)', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const path = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const priv = deriveEthPrivateKey(seed, path);
    const { address } = ethPubKeyToAddress(priv);
    expect(address).not.toBe(address.toLowerCase());
    expect(address).not.toBe(address.toUpperCase());
  });

  it('checksum is deterministic across calls', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const path = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const priv = deriveEthPrivateKey(seed, path);
    const a1 = ethPubKeyToAddress(priv).address;
    const a2 = ethPubKeyToAddress(priv).address;
    expect(a1).toBe(a2);
  });

  it('different accounts produce different addresses', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const mkPath = (i: number) => [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, i];
    const addr0 = ethPubKeyToAddress(deriveEthPrivateKey(seed, mkPath(0))).address;
    const addr1 = ethPubKeyToAddress(deriveEthPrivateKey(seed, mkPath(1))).address;
    expect(addr0).not.toBe(addr1);
  });
});

// ── SLIP-10 Ed25519 (Solana) ──────────────────────────────────────────────────

describe('deriveSolanaPrivateKey — SLIP-10 Ed25519', () => {
  // SLIP-10 official test vectors: https://github.com/satoshilabs/slips/blob/master/slip-0010.md
  // Test vector 1 seed: 000102030405060708090a0b0c0d0e0f
  const SLIP10_SEED = Uint8Array.from(
    '000102030405060708090a0b0c0d0e0f'.match(/.{2}/g)!.map(b => parseInt(b, 16))
  );

  it('derives correct private key for SLIP-10 test vector 1, chain m/0h', () => {
    const priv = deriveSolanaPrivateKey(SLIP10_SEED, [0x80000000 | 0]);
    expect(bytesToHex(priv)).toBe('68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3');
  });

  it('derives correct private key for SLIP-10 test vector 1, chain m/0h/1h/2h', () => {
    const priv = deriveSolanaPrivateKey(SLIP10_SEED, [
      0x80000000 | 0,
      0x80000000 | 1,
      0x80000000 | 2,
    ]);
    expect(bytesToHex(priv)).toBe('92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9');
  });

  it('throws on non-hardened path component', () => {
    expect(() => deriveSolanaPrivateKey(SLIP10_SEED, [0])).toThrow('SLIP-10');
  });

  it('returns 32-byte private key', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const path = [0x80000000 | 44, 0x80000000 | 501, 0x80000000 | 0, 0x80000000 | 0];
    const priv = deriveSolanaPrivateKey(seed, path);
    expect(priv).toHaveLength(32);
  });

  it('produces valid Ed25519 public key (32 bytes) from abandon mnemonic', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const path = [0x80000000 | 44, 0x80000000 | 501, 0x80000000 | 0, 0x80000000 | 0];
    const priv = deriveSolanaPrivateKey(seed, path);
    const pub = solanaPubKey(priv);
    expect(pub).toHaveLength(32);
  });

  it('different account indices produce different keys', async () => {
    const seed = await mnemonicToSeed(ABANDON_MNEMONIC);
    const mkPath = (i: number) => [0x80000000 | 44, 0x80000000 | 501, 0x80000000 | i, 0x80000000 | 0];
    const k0 = bytesToHex(deriveSolanaPrivateKey(seed, mkPath(0)));
    const k1 = bytesToHex(deriveSolanaPrivateKey(seed, mkPath(1)));
    expect(k0).not.toBe(k1);
  });
});
