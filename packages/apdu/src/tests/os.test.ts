import { describe, it, expect, beforeEach } from 'vitest';
import { handleApdu, setMnemonicProvider, resetSharedState } from '../handler';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

beforeEach(() => {
  resetSharedState();
  setMnemonicProvider(async () => TEST_MNEMONIC);
});

describe('OS layer — CLA E0', () => {
  describe('GET_APP_AND_VERSION — B0 01 00 00 00', () => {
    it('returns format 01 + name + 9000', async () => {
      const res = await handleApdu('b001000000');
      expect(res).toMatch(/9000$/);
      // first byte 01 = format flag
      expect(res.slice(0, 2)).toBe('01');
    });
  });

  describe('GET_DEVICE_INFO — E0 E2 00 00 00', () => {
    it('returns device info bytes + 9000', async () => {
      const res = await handleApdu('e0e2000000');
      expect(res).toMatch(/9000$/);
    });
  });

  describe('OPEN_APP — E0 D8 00 00 07 426974636f696e', () => {
    it('switches currentApp and returns 9000', async () => {
      // "Bitcoin" in hex
      const res = await handleApdu('e0d8000007426974636f696e');
      expect(res).toBe('9000');
    });
  });

  describe('QUIT_APP — E0 A7 00 00 00', () => {
    it('returns 9000', async () => {
      const res = await handleApdu('e0a7000000');
      expect(res).toBe('9000');
    });
  });

  describe('Unknown INS', () => {
    it('returns 6d00 for unknown CLA/INS in E0', async () => {
      // CLA E0 with an INS not handled by any app
      const res = await handleApdu('e0ff000000');
      // Goes to ETH app by default; ETH returns null → 6d00
      expect(res).toBe('6d00');
    });
  });
});
