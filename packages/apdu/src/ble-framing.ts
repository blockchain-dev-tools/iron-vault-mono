export const CHANNEL = [0x01, 0x01] as const;
export const TAG = 0x05 as const;
export const MTU = 20 as const;

const HEADER_LEN_FIRST = 7;
const HEADER_LEN_CONT = 5;

/**
 * Split an APDU byte array into MTU-sized BLE packets with Ledger framing headers.
 *
 * First packet:  7-byte header = CHANNEL(2) + TAG(1) + SEQ(2) + TOTAL_LEN(2)
 * Continuation:  5-byte header = CHANNEL(2) + TAG(1) + SEQ(2)
 */
export function frameAPDU(apdu: Uint8Array): Uint8Array[] {
  const packets: Uint8Array[] = [];
  let offset = 0;
  let seq = 0;

  while (offset < apdu.length || seq === 0) {
    const headerLen = seq === 0 ? HEADER_LEN_FIRST : HEADER_LEN_CONT;
    const chunkLen  = Math.min(MTU - headerLen, apdu.length - offset);
    const pkt       = new Uint8Array(headerLen + chunkLen);
    let i = 0;
    pkt[i++] = CHANNEL[0]; pkt[i++] = CHANNEL[1];
    pkt[i++] = TAG;
    pkt[i++] = (seq >> 8) & 0xff; pkt[i++] = seq & 0xff;
    if (seq === 0) {
      pkt[i++] = (apdu.length >> 8) & 0xff;
      pkt[i++] = apdu.length & 0xff;
    }
    pkt.set(apdu.slice(offset, offset + chunkLen), i);
    packets.push(pkt);
    offset += chunkLen;
    seq++;
    if (offset >= apdu.length) break;
  }
  return packets;
}

/**
 * Reassemble a response APDU from a sequence of BLE chunks.
 * The first chunk contains the total response length in bytes 5-6.
 */
export function unframeResponse(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) throw new Error('No chunks');
  const first = chunks[0];
  const totalLen = (first[5] << 8) | first[6];
  const result = new Uint8Array(totalLen);
  let offset = 0;

  for (let seq = 0; seq < chunks.length && offset < totalLen; seq++) {
    const headerLen = seq === 0 ? HEADER_LEN_FIRST : HEADER_LEN_CONT;
    const payload   = chunks[seq].slice(headerLen);
    const toCopy    = Math.min(payload.length, totalLen - offset);
    result.set(payload.slice(0, toCopy), offset);
    offset += toCopy;
  }
  return result;
}

export interface BleFrameDescription {
  seq: number;
  isFirst: boolean;
  header: {
    channel: string;
    tag: number;
    seq: number;
    totalLen?: number;
  };
  payloadHex: string;
  payloadBytes: number;
}

/**
 * Parse raw BLE packets into human-readable descriptions.
 * Used by the education tool to visualize APDU → BLE framing.
 */
export function describeFrames(packets: Uint8Array[]): BleFrameDescription[] {
  return packets.map((pkt, idx) => {
    const isFirst = idx === 0;
    const seq = ((pkt[3] & 0xff) << 8) | (pkt[4] & 0xff);
    const headerLen = isFirst ? HEADER_LEN_FIRST : HEADER_LEN_CONT;
    const payload = pkt.slice(headerLen);

    return {
      seq,
      isFirst,
      header: {
        channel: `0x${CHANNEL[0].toString(16).padStart(2, '0')}${CHANNEL[1].toString(16).padStart(2, '0')}`,
        tag: pkt[2],
        seq,
        totalLen: isFirst ? ((pkt[5] & 0xff) << 8) | (pkt[6] & 0xff) : undefined,
      },
      payloadHex: Array.from(payload).map(b => b.toString(16).padStart(2, '0')).join(' '),
      payloadBytes: payload.length,
    };
  });
}
