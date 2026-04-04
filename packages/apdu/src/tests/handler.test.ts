import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleApdu, setMnemonicProvider, setCurrentApp,
  setSignRequestHandler, resetSharedState, clearSignSessions,
  getLastToken, getLastNft, getLastDomain,
} from '../handler';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

beforeEach(() => {
  resetSharedState();
  setMnemonicProvider(async () => TEST_MNEMONIC);
});

describe('APDU router (handler.ts)', () => {
  describe('OPEN_APP / QUIT_APP', () => {
    it('OPEN_APP sets currentApp and returns 9000', async () => {
      const appName = 'Solana';
      const nameHex = Buffer.from(appName).toString('hex');
      const lc = (nameHex.length / 2).toString(16).padStart(2, '0');
      // CLA=E0 INS=D8 P1=00 P2=00 Lc data
      const res = await handleApdu(`e0d80000${lc}${nameHex}`);
      expect(res).toBe('9000');
    });

    it('QUIT_APP resets to BOLOS and returns 9000', async () => {
      const res = await handleApdu('e0a7000000');
      expect(res).toBe('9000');
    });
  });

  describe('CLA routing', () => {
    it('CLA E1 routes to BTC handler', async () => {
      // E1 05 = GET_MASTER_FINGERPRINT (no data)
      const res = await handleApdu('e105000000');
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(12);
    });

    it('CLA 0x14 routes to Tron handler', async () => {
      // 14 01 = GET_APP_CONFIGURATION
      const res = await handleApdu('1401000000');
      expect(res).toMatch(/9000$/);
    });

    it('CLA 0x07 routes to Sui handler', async () => {
      // 07 01 = GET_APP_CONFIGURATION
      const res = await handleApdu('0701000000');
      expect(res).toMatch(/9000$/);
    });

    it('CLA E0 with currentApp=Solana routes to SOL handler', async () => {
      setCurrentApp('Solana');
      const res = await handleApdu('e001000000'); // GET_APP_CONFIGURATION
      expect(res).toMatch(/9000$/);
      // Solana blind_sign_enabled = 0x01 at byte 0
      expect(res.slice(0, 2)).toBe('01');
    });

    it('CLA E0 with currentApp=Ethereum routes to ETH handler', async () => {
      setCurrentApp('Ethereum');
      const res = await handleApdu('e006000000'); // GET_APP_CONFIGURATION
      expect(res).toMatch(/9000$/);
    });

    it('CLA F8 routes to BTC CONTINUE handler', async () => {
      // No active session → 6f00
      const res = await handleApdu('f801000000');
      expect(res).toBe('6f00');
    });

    it('Unknown CLA returns 6d00', async () => {
      const res = await handleApdu('ff00000000');
      expect(res).toBe('6d00');
    });
  });

  describe('Error handling', () => {
    it('returns 6f00 on internal error (no mnemonic provider)', async () => {
      resetSharedState(); // clears mnemonic provider
      // m/44'/60'/0'/0/0 — correct 21-byte path
      const path = '058000002c8000003c800000000000000000000000';
      const lc = (path.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e0020000${lc}${path}`);
      expect(res).toBe('6f00');
    });
  });

  describe('setSignRequestHandler (deferred signing)', () => {
    it('calls custom sign handler for ETH tx and returns its result', async () => {
      let capturedReq: any;
      setSignRequestHandler(async (req) => {
        capturedReq = req;
        // Return a fake 65-byte signature (v=1b, r=00..., s=00...)
        return '1b' + '00'.repeat(32) + '00'.repeat(32);
      });

      // m/44'/60'/0'/0/0 path + c0 (empty RLP list — minimal complete tx)
      const path = '058000002c8000003c800000000000000000000000';
      const tx = 'c0';
      const payload = path + tx;
      const lc = (payload.length / 2).toString(16).padStart(2, '0');
      // P1=0x00 (first chunk), P2=0x00
      const res = await handleApdu(`e0040000${lc}${payload}`);

      expect(capturedReq).toBeDefined();
      expect(capturedReq.chain).toBe('eth');
      expect(res).toMatch(/9000$/);
    });
  });

  describe('clearSignSessions / resetSharedState', () => {
    it('clearSignSessions does not throw', () => {
      expect(() => clearSignSessions()).not.toThrow();
    });

    it('resetSharedState does not throw', () => {
      expect(() => resetSharedState()).not.toThrow();
    });
  });

  describe('Exported getters', () => {
    it('getLastToken returns null initially', () => {
      expect(getLastToken()).toBeNull();
    });

    it('getLastNft returns null initially', () => {
      expect(getLastNft()).toBeNull();
    });

    it('getLastDomain returns null initially', () => {
      expect(getLastDomain()).toBeNull();
    });
  });
});
