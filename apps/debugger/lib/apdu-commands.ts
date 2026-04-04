// ── Path encoding helpers ─────────────────────────────────────────────────────

function encodePathData(components: number[]): Uint8Array {
  const buf = new Uint8Array(1 + components.length * 4);
  buf[0] = components.length;
  for (let i = 0; i < components.length; i++) {
    const v = components[i] >>> 0;
    buf[1 + i * 4 + 0] = (v >> 24) & 0xff;
    buf[1 + i * 4 + 1] = (v >> 16) & 0xff;
    buf[1 + i * 4 + 2] = (v >>  8) & 0xff;
    buf[1 + i * 4 + 3] = (v      ) & 0xff;
  }
  return buf;
}

const H = (n: number) => 0x80000000 | n;

// Common BIP-32 paths
const ETH_PATH  = [H(44), H(60), H(0), 0, 0]; // m/44'/60'/0'/0/0
const ETH_PATH1 = [H(44), H(60), H(0), 0, 1]; // m/44'/60'/0'/0/1
const SOL_PATH  = [H(44), H(501), H(0), H(0)]; // m/44'/501'/0'/0'

// ── APDU builders ─────────────────────────────────────────────────────────────

function apdu(cla: number, ins: number, p1: number, p2: number, data?: Uint8Array): Uint8Array {
  const lc = data?.length ?? 0;
  const buf = new Uint8Array(5 + lc);
  buf[0] = cla; buf[1] = ins; buf[2] = p1; buf[3] = p2; buf[4] = lc;
  if (data) buf.set(data, 5);
  return buf;
}

// ── Preset commands ───────────────────────────────────────────────────────────

export interface Command {
  label: string;
  group: string;
  description: string;
  build: () => Uint8Array[];  // returns array of APDUs (usually 1, sign can be multi)
}

// Mock EIP-1559 transaction (type 2) - simple ETH transfer
// RLP prefix + path + tx bytes
const MOCK_ETH_TX_RLP = new Uint8Array([
  // This is a minimal EIP-1559 rlp for testing purposes
  0x02, 0xed, 0x01, 0x01, 0x84, 0x77, 0x35, 0x94, 0x00, 0x85,
  0x01, 0x2a, 0x05, 0xf2, 0x00, 0x82, 0x52, 0x08, 0x94, 0xb3,
  0x85, 0x53, 0xa5, 0xee, 0x90, 0x6b, 0xea, 0x5b, 0x8a, 0x01,
  0x95, 0xb7, 0x72, 0x5b, 0x58, 0xb3, 0xf8, 0x9c, 0x23, 0x88,
  0x01, 0x6b, 0x28, 0xc5, 0x27, 0x89, 0x00, 0x00, 0x80, 0xc0,
]);

// Mock Solana message (just 32 zero bytes as placeholder)
const MOCK_SOL_MSG = new Uint8Array(32);

export const COMMANDS: Command[] = [
  // ── Info ──────────────────────────────────────────────────────────────────
  {
    group: '设备信息',
    label: 'GET_VERSION',
    description: '获取设备固件版本',
    build: () => [apdu(0xe0, 0x01, 0x00, 0x00)],
  },
  {
    group: '设备信息',
    label: 'GET_APP_AND_VERSION',
    description: '获取当前 App 名称和版本',
    build: () => [apdu(0xb0, 0x01, 0x00, 0x00)],
  },

  // ── App switching ─────────────────────────────────────────────────────────
  {
    group: 'App 切换',
    label: 'OPEN_APP Ethereum',
    description: '切换到 Ethereum App',
    build: () => {
      const name = new TextEncoder().encode('Ethereum');
      return [apdu(0xe0, 0xd8, 0x00, 0x00, name)];
    },
  },
  {
    group: 'App 切换',
    label: 'OPEN_APP Solana',
    description: '切换到 Solana App',
    build: () => {
      const name = new TextEncoder().encode('Solana');
      return [apdu(0xe0, 0xd8, 0x00, 0x00, name)];
    },
  },

  // ── ETH ───────────────────────────────────────────────────────────────────
  {
    group: 'Ethereum',
    label: 'GET_ETH_ADDRESS #0',
    description: "获取 ETH 地址  m/44'/60'/0'/0/0",
    build: () => [apdu(0xe0, 0x02, 0x00, 0x00, encodePathData(ETH_PATH))],
  },
  {
    group: 'Ethereum',
    label: 'GET_ETH_ADDRESS #1',
    description: "获取 ETH 地址  m/44'/60'/0'/0/1",
    build: () => [apdu(0xe0, 0x02, 0x00, 0x00, encodePathData(ETH_PATH1))],
  },
  {
    group: 'Ethereum',
    label: 'SIGN_ETH_TX',
    description: '签名模拟 EIP-1559 交易',
    build: () => {
      const pathData = encodePathData(ETH_PATH);
      // First chunk: path + start of tx
      const data0 = new Uint8Array(pathData.length + MOCK_ETH_TX_RLP.length);
      data0.set(pathData, 0);
      data0.set(MOCK_ETH_TX_RLP, pathData.length);
      return [apdu(0xe0, 0x04, 0x00, 0x00, data0)];
    },
  },

  // ── Solana ────────────────────────────────────────────────────────────────
  {
    group: 'Solana',
    label: 'GET_SOL_PUBKEY',
    description: "获取 Solana 公钥  m/44'/501'/0'/0'",
    build: () => [apdu(0xe0, 0x05, 0x00, 0x00, encodePathData(SOL_PATH))],
  },
  {
    group: 'Solana',
    label: 'SIGN_SOL_MSG',
    description: '签名模拟 Solana 消息',
    build: () => {
      const pathData = encodePathData(SOL_PATH);
      const data = new Uint8Array(pathData.length + MOCK_SOL_MSG.length);
      data.set(pathData, 0);
      data.set(MOCK_SOL_MSG, pathData.length);
      return [apdu(0xe0, 0x06, 0x00, 0x00, data)];
    },
  },
];

// ── Response decoder ──────────────────────────────────────────────────────────

export interface DecodedResponse {
  sw: string;        // status word, e.g. "9000"
  swLabel: string;   // human readable
  fields: { key: string; value: string }[];
}

export function decodeResponse(bytes: Uint8Array, sentCommand?: Command): DecodedResponse {
  if (bytes.length < 2) return { sw: '??', swLabel: 'Too short', fields: [] };
  const sw = ((bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1])
    .toString(16).toUpperCase().padStart(4, '0');
  const swLabel = SW_LABELS[sw] ?? `Unknown (${sw})`;
  const payload = bytes.slice(0, -2);
  const fields: { key: string; value: string }[] = [];

  if (sw !== '9000') {
    fields.push({ key: 'payload', value: toHexStr(payload) });
    return { sw, swLabel, fields };
  }

  // Best-effort decode based on label
  const label = sentCommand?.label ?? '';

  if (label === 'GET_VERSION') {
    const ti = toHexStr(payload.slice(0, 4));
    let off = 4;
    const seLen = payload[off++];
    const se = new TextDecoder().decode(payload.slice(off, off + seLen)); off += seLen;
    const flagsLen = payload[off++]; off += flagsLen;
    const mcuLen = payload[off++];
    const mcu = new TextDecoder().decode(payload.slice(off, off + mcuLen));
    fields.push({ key: 'target_id', value: ti }, { key: 'SE version', value: se }, { key: 'MCU version', value: mcu });
  } else if (label === 'GET_APP_AND_VERSION') {
    let off = 1;
    const nameLen = payload[off++];
    const name = new TextDecoder().decode(payload.slice(off, off + nameLen)); off += nameLen;
    const verLen = payload[off++];
    const ver = new TextDecoder().decode(payload.slice(off, off + verLen));
    fields.push({ key: 'app', value: name }, { key: 'version', value: ver });
  } else if (label.startsWith('GET_ETH_ADDRESS')) {
    // pubkey_len(1) + pubkey + addr_len(1) + addr
    const pkLen = payload[0];
    const pk = toHexStr(payload.slice(1, 1 + pkLen));
    const addrLen = payload[1 + pkLen];
    const addr = new TextDecoder().decode(payload.slice(2 + pkLen, 2 + pkLen + addrLen));
    fields.push({ key: 'pubkey', value: pk }, { key: 'address', value: '0x' + addr });
  } else if (label === 'GET_SOL_PUBKEY') {
    fields.push({ key: 'pubkey (base58 input)', value: toHexStr(payload) });
  } else if (label.startsWith('SIGN')) {
    if (payload.length >= 65) {
      fields.push(
        { key: 'v', value: payload[0].toString(16).padStart(2, '0') },
        { key: 'r', value: toHexStr(payload.slice(1, 33)) },
        { key: 's', value: toHexStr(payload.slice(33, 65)) },
      );
    } else {
      fields.push({ key: 'signature', value: toHexStr(payload) });
    }
  } else {
    fields.push({ key: 'payload', value: toHexStr(payload) });
  }

  return { sw, swLabel, fields };
}

const SW_LABELS: Record<string, string> = {
  '9000': '✓ Success',
  '6985': '✗ Conditions not satisfied (user rejected)',
  '6982': '✗ Security not satisfied',
  '6A80': '✗ Incorrect data',
  '6B00': '✗ Incorrect params',
  '6D00': '✗ INS not supported',
  '6E00': '✗ CLA not supported',
  '6F00': '✗ Unknown error',
};

function toHexStr(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
