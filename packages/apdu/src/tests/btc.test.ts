import { describe, it, expect, beforeEach } from 'vitest';
import { handleApdu, setMnemonicProvider, resetSharedState } from '../handler';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

beforeEach(() => {
  resetSharedState();
  setMnemonicProvider(async () => TEST_MNEMONIC);
});

// BIP84 path m/84'/0'/0' — count(1) + 3×4 bytes = 26 hex chars
const BIP84_PATH = '03' + '80000054' + '80000000' + '80000000';

describe('BTC New App (CLA E1)', () => {
  describe('GET_MASTER_FINGERPRINT — E1 05', () => {
    it('returns 4-byte fingerprint + 9000', async () => {
      const res = await handleApdu('e105000000');
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(12); // 4 bytes + 9000
    });

    it('returns same fingerprint on repeated calls (deterministic)', async () => {
      const r1 = await handleApdu('e105000000');
      const r2 = await handleApdu('e105000000');
      expect(r1).toBe(r2);
    });
  });

  describe('GET_EXTENDED_PUBKEY — E1 00', () => {
    it('returns xpub string + 9000', async () => {
      const lc = (BIP84_PATH.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e1000000${lc}${BIP84_PATH}`);
      expect(res).toMatch(/9000$/);
      const bodyHex = res.slice(0, -4);
      const len = parseInt(bodyHex.slice(0, 2), 16);
      const xpubAscii = Buffer.from(bodyHex.slice(2, 2 + len * 2), 'hex').toString('ascii');
      expect(xpubAscii).toMatch(/^xpub/);
    });
  });

  describe('REGISTER_WALLET — E1 02', () => {
    it('returns wallet_id(32) + hmac(32) + 9000', async () => {
      const name = Buffer.from('test').toString('hex');
      const data = '00' + '01' + '01' + '04' + name;
      const lc = (data.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e1020000${lc}${data}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBe(132); // 64 bytes + 9000
    });

    it('is deterministic for same wallet name', async () => {
      const name = Buffer.from('mywallet').toString('hex');
      const data = '00010108' + name;
      const lc = (data.length / 2).toString(16).padStart(2, '0');
      const r1 = await handleApdu(`e1020000${lc}${data}`);
      const r2 = await handleApdu(`e1020000${lc}${data}`);
      expect(r1).toBe(r2);
    });
  });

  describe('GET_WALLET_ADDRESS — E1 03', () => {
    it('returns bc1q... bech32 address + 9000', async () => {
      // display(1)=0 + wallet_id(32)=zeros + change(1)=0 + index(4)=0
      const data = '00' + '00'.repeat(32) + '00' + '00000000';
      const lc = (data.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e1030000${lc}${data}`);
      expect(res).toMatch(/9000$/);
      const body = res.slice(0, -4);
      const addrLen = parseInt(body.slice(0, 2), 16);
      const addr = Buffer.from(body.slice(2, 2 + addrLen * 2), 'hex').toString('ascii');
      expect(addr).toMatch(/^bc1q/);
    });
  });

  describe('SIGN_MESSAGE — E1 10', () => {
    it('returns DER signature + 9000', async () => {
      const msg = Buffer.from('hello btc').toString('hex');
      const msgLenHex = '00000009';
      const payload = BIP84_PATH + msgLenHex + msg;
      const lc = (payload.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e1100000${lc}${payload}`);
      expect(res).toMatch(/9000$/);
      const body = res.slice(0, -4);
      const derLen = parseInt(body.slice(0, 2), 16);
      const derHex = body.slice(2, 2 + derLen * 2);
      expect(derHex.slice(0, 2)).toBe('30'); // DER sequence marker
    });
  });

  describe('SIGN_PSBT + CONTINUE FSM — E1 04 / F8 01', () => {
    it('returns 0x61 CONTINUE status on first frame', async () => {
      const payload = BIP84_PATH + 'cafebabe';
      const lc = (payload.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`e1040000${lc}${payload}`);
      expect(res.slice(0, 2)).toBe('61');
    });

    it('CONTINUE (F8 01) with final data returns signature + 9000', async () => {
      const initPayload = BIP84_PATH + 'cafebabe';
      const lc1 = (initPayload.length / 2).toString(16).padStart(2, '0');
      await handleApdu(`e1040000${lc1}${initPayload}`);

      const continueData = 'deadbeef01020304';
      const lc2 = (continueData.length / 2).toString(16).padStart(2, '0');
      const res = await handleApdu(`f8010000${lc2}${continueData}`);
      expect(res).toMatch(/9000$/);
      expect(res.length).toBeGreaterThan(20);
    });

    it('CONTINUE without active session returns 6f00', async () => {
      const res = await handleApdu('f801000000');
      expect(res).toBe('6f00');
    });
  });

  describe('Unknown INS', () => {
    it('returns 6d00 for unrecognised E1 command', async () => {
      const res = await handleApdu('e1ff000000');
      expect(res).toBe('6d00');
    });
  });
});
