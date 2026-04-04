import { describe, it, expect, beforeEach } from 'vitest';
import { handleApdu, setMnemonicProvider, setCurrentApp, resetSharedState } from '../handler';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

beforeEach(() => {
  resetSharedState();
  setMnemonicProvider(async () => TEST_MNEMONIC);
  setCurrentApp('Solana');
});

// m/44'/501'/0'/0'/0' — count(1) + 5×4 bytes = 42 hex chars
const SOL_PATH_5 = '05' +
  '8000002c' + // 44'
  '800001f5' + // 501'
  '80000000' + // 0'
  '80000000' + // 0'
  '80000000';  // 0'

describe('Solana App (CLA E0, currentApp=Solana)', () => {
  describe('GET_APP_CONFIGURATION — E0 01', () => {
    it('returns blind_sign + version + 9000', async () => {
      const res = await handleApdu('e001000000');
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(12); // 4 bytes config + 2 bytes status = 6 bytes = 12 hex
    });
  });

  describe('GET_PUBKEY — E0 05', () => {
    it('returns 32-byte pubkey + 9000', async () => {
      const lc = (SOL_PATH_5.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e0050000${lc}${SOL_PATH_5}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(68); // 32 bytes + 2 status = 34 bytes = 68 hex
    });
  });

  describe('GET_ADDRESS — E0 07', () => {
    it('returns base58 address + 9000', async () => {
      const lc = (SOL_PATH_5.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e0070000${lc}${SOL_PATH_5}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBeGreaterThan(10);
    });
  });

  describe('SIGN_MESSAGE — E0 04 (single frame, P1=0x01, P2=0x00=final)', () => {
    it('returns 64-byte Ed25519 signature + 9000', async () => {
      const txBytes = '01020304050607080910'; // 10 bytes of fake tx
      const payload = SOL_PATH_5 + txBytes;
      const lc = (payload.length / 2).toString(16).padStart(2, '0');
      // P1=0x01 (first chunk), P2=0x00 (final — no more data)
      const res = await handleApdu(`e0040100${lc}${payload}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(132); // 64-byte sig + 2 status = 66 bytes = 132 hex
    });
  });

  describe('Multi-frame SIGN — E0 04', () => {
    it('accumulates chunks (P2=0x01 = more) then signs on final (P2=0x00)', async () => {
      const chunk1 = SOL_PATH_5 + 'aabbccdd';
      const lc1 = (chunk1.length / 2).toString(16).padStart(2, '0');
      // P1=0x01 first, P2=0x01 has more
      const apdu1 = `e0` + `04` + `01` + `01` + lc1 + chunk1;
      const res1 = await handleApdu(apdu1);
      expect(res1).toBe('9000'); // intermediate chunk returns just 9000

      const chunk2 = 'eeff0011';
      const lc2 = (chunk2.length / 2).toString(16).padStart(2, '0');
      // P1=0x02 (not first), P2=0x00 (final)
      const apdu2 = `e0` + `04` + `02` + `00` + lc2 + chunk2;
      const res2 = await handleApdu(apdu2);
      expect(res2).toMatch(/9000$/);
      expect(res2.length).toBe(132); // 64-byte Ed25519 sig + 9000
    });
  });
});
