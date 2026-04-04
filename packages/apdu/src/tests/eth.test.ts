import { describe, it, expect, beforeEach } from 'vitest';
import { handleApdu, setMnemonicProvider, setCurrentApp, resetSharedState } from '../handler';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// m/44'/60'/0'/0/0 — correct 21-byte encoding: count(1) + 5×4 bytes = 42 hex chars
const PATH_ETH_0 = '058000002c8000003c800000000000000000000000';

// Known ETH address for "abandon ×11 about" at m/44'/60'/0'/0/0
const ETH_ADDR_0 = '9858effd232b4033e47d90003d41ec34ecaeda94';

beforeEach(() => {
  resetSharedState();
  setMnemonicProvider(async () => TEST_MNEMONIC);
  setCurrentApp('Ethereum');
});

describe('ETH App (CLA E0)', () => {
  describe('GET_APP_CONFIGURATION — E0 06', () => {
    it('returns blind_sign_enabled + version + 9000', async () => {
      const res = await handleApdu('e006000000');
      expect(res).toMatch(/9000$/);
      // 5 bytes of config (blind_sign + flags + major + minor + patch) + 9000
      expect(res.length).toBe(14);
    });
  });

  describe('GET_ADDRESS — E0 02', () => {
    it('returns pubkey + address + 9000', async () => {
      const lc = (PATH_ETH_0.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e0020000${lc}${PATH_ETH_0}`);
      expect(res).toMatch(/9000$/);
      // Response: 0x41(1) + pubKey(65) + 0x28(1) + addrAscii(40) + status(2) = 109 bytes = 218 hex
      // Address ASCII starts at byte offset 67 = hex offset 134
      const bodyHex = res.slice(0, -4);
      const addrAsciiHex = bodyHex.slice(134, 134 + 80); // 40 ASCII bytes = 80 hex chars
      const addr = Buffer.from(addrAsciiHex, 'hex').toString('ascii');
      expect(addr.toLowerCase()).toBe(ETH_ADDR_0);
    });
  });

  describe('SIGN_TRANSACTION — E0 04 (single frame)', () => {
    it('returns v(1)+r(32)+s(32) + 9000 on final chunk', async () => {
      // c0 = empty RLP list (1 byte, self-contained) — minimal complete RLP tx
      const txHex = PATH_ETH_0 + 'c0';
      const lc = (txHex.length / 2).toString(16).padStart(2, '0');
      // P1=0x00 (first+only chunk), P2=0x00
      const res = await handleApdu(`e0040000${lc}${txHex}`);
      expect(res).toMatch(/9000$/);
      // v(1) + r(32) + s(32) = 65 bytes + 9000 = 67 bytes = 134 hex chars
      expect(res.length).toBe(134);
    });
  });

  describe('SIGN_PERSONAL_MESSAGE — E0 08', () => {
    it('returns signature + 9000', async () => {
      const msg = Buffer.from('hello', 'utf8').toString('hex');
      const msgLenHex = '00000005'; // 5 bytes, big-endian
      const payload = `${PATH_ETH_0}${msgLenHex}${msg}`;
      const lc = (payload.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e0080000${lc}${payload}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(134); // v(1)+r(32)+s(32)+9000
    });
  });

  describe('Stub / info commands', () => {
    it('E0 22 (GET_CHALLENGE) returns 9000', async () => {
      const res = await handleApdu('e022000000');
      expect(res).toMatch(/9000$/);
    });
  });
});
