export interface Apdu {
  cla: number;
  ins: number;
  p1: number;
  p2: number;
  data: Uint8Array;
}

export function parseApdu(hexApdu: string): Apdu {
  const bytes = hexToBytes(hexApdu);
  return {
    cla:  bytes[0] ?? 0,
    ins:  bytes[1] ?? 0,
    p1:   bytes[2] ?? 0,
    p2:   bytes[3] ?? 0,
    data: bytes.slice(5), // skip CLA INS P1 P2 Lc
  };
}

export function parseBip32Path(data: Uint8Array): { path: number[]; rest: Uint8Array } {
  const count = data[0] ?? 0;
  if (1 + count * 4 > data.length) throw new Error(`BIP32 path overflow: need ${1 + count * 4} bytes, got ${data.length}`);
  const path: number[] = [];
  for (let i = 0; i < count; i++) {
    const off = 1 + i * 4;
    path.push(
      ((data[off] & 0xff) << 24) |
      ((data[off + 1] & 0xff) << 16) |
      ((data[off + 2] & 0xff) << 8) |
      (data[off + 3] & 0xff)
    );
  }
  return { path, rest: data.slice(1 + count * 4) };
}

/** Returns expected total byte length from leading RLP byte(s), or -1 if incomplete.
 *  Handles EIP-2718 typed transactions (0x01, 0x02 prefix). */
export function rlpTotalLength(bytes: number[] | Uint8Array): number {
  if (bytes.length === 0) return -1;
  // Skip EIP-2718 transaction type byte (0x01 = EIP-2930, 0x02 = EIP-1559)
  const offset = (bytes[0] === 0x01 || bytes[0] === 0x02) ? 1 : 0;
  if (bytes.length <= offset) return -1;
  const first = bytes[offset];
  if (first < 0x80) return offset + 1;
  if (first < 0xb8) return offset + 1 + (first - 0x80);
  if (first < 0xc0) {
    const lb = first - 0xb7;
    if (bytes.length < offset + 1 + lb) return -1;
    let len = 0;
    for (let i = 1; i <= lb; i++) len = (len << 8) | bytes[offset + i];
    return offset + 1 + lb + len;
  }
  if (first < 0xf8) return offset + 1 + (first - 0xc0);
  const lb = first - 0xf7;
  if (bytes.length < offset + 1 + lb) return -1;
  let len = 0;
  for (let i = 1; i <= lb; i++) len = (len << 8) | bytes[offset + i];
  return offset + 1 + lb + len;
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/\s+/g, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function bip32PathToString(path: number[]): string {
  return 'm/' + path.map(c => {
    const hardened = (c & 0x80000000) !== 0;
    const index = c & 0x7fffffff;
    return hardened ? `${index}'` : `${index}`;
  }).join('/');
}
