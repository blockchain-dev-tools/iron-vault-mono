import { describe, it, expect } from 'vitest';
import { parseBip32Path, rlpTotalLength, bytesToHex, hexToBytes } from '../parser';

// ── BIP32 path parsing ────────────────────────────────────────────────────────

describe('parseBip32Path', () => {
  /**
   * Build a BIP32 path buffer: [depth(1)] + [component(4) * depth]
   * Each component is big-endian uint32.
   */
  function encodePath(components: number[]): Uint8Array {
    const buf = new Uint8Array(1 + components.length * 4);
    buf[0] = components.length;
    components.forEach((c, i) => {
      buf[1 + i * 4 + 0] = (c >>> 24) & 0xff;
      buf[1 + i * 4 + 1] = (c >>> 16) & 0xff;
      buf[1 + i * 4 + 2] = (c >>> 8) & 0xff;
      buf[1 + i * 4 + 3] = c & 0xff;
    });
    return buf;
  }

  it('parses m/44h/60h/0h/0/0 (ETH account 0)', () => {
    const expected = [
      0x80000000 | 44,
      0x80000000 | 60,
      0x80000000 | 0,
      0,
      0,
    ];
    const { path, rest } = parseBip32Path(encodePath(expected));
    expect(path).toEqual(expected);
    expect(rest).toHaveLength(0);
  });

  it('parses m/44h/501h/0h/0h (Solana account 0)', () => {
    const expected = [
      0x80000000 | 44,
      0x80000000 | 501,
      0x80000000 | 0,
      0x80000000 | 0,
    ];
    const { path } = parseBip32Path(encodePath(expected));
    expect(path).toEqual(expected);
  });

  it('splits path from trailing data (rest)', () => {
    const components = [0x80000000 | 44, 0x80000000 | 60, 0x80000000 | 0, 0, 0];
    const pathBuf = encodePath(components);
    const trailing = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const combined = new Uint8Array([...pathBuf, ...trailing]);
    const { path, rest } = parseBip32Path(combined);
    expect(path).toEqual(components);
    expect(bytesToHex(rest)).toBe('deadbeef');
  });

  it('handles depth 0 (empty path)', () => {
    const buf = new Uint8Array([0x00, 0x01, 0x02]); // depth=0, rest=[01,02]
    const { path, rest } = parseBip32Path(buf);
    expect(path).toHaveLength(0);
    expect(rest).toHaveLength(2);
  });
});

// ── RLP length detection ──────────────────────────────────────────────────────

describe('rlpTotalLength', () => {
  it('detects single-byte RLP item', () => {
    // A single byte < 0x80 is its own RLP encoding; total length = 1
    expect(rlpTotalLength([0x7f])).toBe(1);
  });

  it('detects short string (0x80–0xb7)', () => {
    // 0x83 means 3-byte string: 1 prefix byte + 3 data bytes = 4 total
    expect(rlpTotalLength([0x83, 0x01, 0x02, 0x03])).toBe(4);
  });

  it('detects short list (0xc0–0xf7)', () => {
    // 0xc3 means 3-byte list body: 1 prefix + 3 body bytes = 4 total
    expect(rlpTotalLength([0xc3, 0x01, 0x02, 0x03])).toBe(4);
  });

  it('returns -1 when buffer is empty', () => {
    expect(rlpTotalLength([])).toBe(-1);
  });

  it('returns -1 when buffer too short to determine full length', () => {
    // 0xb8 means long string: next 1 byte gives string length
    // but if that length byte is missing, should return 0 (incomplete)
    expect(rlpTotalLength([0xb8])).toBe(-1);
  });
});

// ── Hex utilities ─────────────────────────────────────────────────────────────

describe('bytesToHex / hexToBytes', () => {
  it('round-trips correctly', () => {
    const original = new Uint8Array([0x00, 0xff, 0x12, 0xab]);
    expect(hexToBytes(bytesToHex(original))).toEqual(original);
  });

  it('handles empty buffer', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
    expect(hexToBytes('')).toEqual(new Uint8Array([]));
  });
});
