import { INS, CLA } from '@iron-vault/apdu'

// ── Simple RLP encoder (for transaction serialization) ──────────

function rlpEncode(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 1 && bytes[0] < 0x80) return bytes
  if (bytes.length <= 55) {
    const out = new Uint8Array(1 + bytes.length)
    out[0] = 0x80 + bytes.length
    out.set(bytes, 1)
    return out
  }
  const lenBytes = toBigEndian(bytes.length)
  const out = new Uint8Array(1 + lenBytes.length + bytes.length)
  out[0] = 0xb7 + lenBytes.length
  out.set(lenBytes, 1)
  out.set(bytes, 1 + lenBytes.length)
  return out
}

function rlpList(items: Uint8Array[]): Uint8Array {
  const payload = concatBytes(items)
  if (payload.length <= 55) {
    const out = new Uint8Array(1 + payload.length)
    out[0] = 0xc0 + payload.length
    out.set(payload, 1)
    return out
  }
  const lenBytes = toBigEndian(payload.length)
  const out = new Uint8Array(1 + lenBytes.length + payload.length)
  out[0] = 0xf7 + lenBytes.length
  out.set(lenBytes, 1)
  out.set(payload, 1 + lenBytes.length)
  return out
}

function toBigEndian(n: number): Uint8Array {
  if (n === 0) return new Uint8Array([0])
  const bytes: number[] = []
  while (n > 0) {
    bytes.unshift(n & 0xff)
    n >>>= 8
  }
  return new Uint8Array(bytes)
}

function numToBytes(n: number | string | bigint, minLen = 0): Uint8Array {
  let hex: string
  if (typeof n === 'bigint') {
    hex = n.toString(16)
  } else if (typeof n === 'number') {
    hex = n.toString(16)
  } else {
    hex = n.startsWith('0x') ? n.slice(2) : n
  }
  if (hex.length % 2 !== 0) hex = '0' + hex
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  if (bytes.length < minLen) {
    const padded = new Uint8Array(minLen)
    padded.set(bytes, minLen - bytes.length)
    return padded
  }
  // Strip leading zero bytes for RLP (but keep one if all zeros)
  let start = 0
  while (start < bytes.length - 1 && bytes[start] === 0) start++
  return bytes.slice(start)
}

function toBytes(str: string): Uint8Array {
  if (str.startsWith('0x')) str = str.slice(2)
  if (str.length % 2 !== 0) str = '0' + str
  const bytes = new Uint8Array(str.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(str.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function concatBytes(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function encodeBip32Path(path: number[]): Uint8Array {
  const bytes = new Uint8Array(1 + path.length * 4)
  bytes[0] = path.length
  for (let i = 0; i < path.length; i++) {
    const val = path[i]
    bytes[1 + i * 4]     = (val >> 24) & 0xff
    bytes[1 + i * 4 + 1] = (val >> 16) & 0xff
    bytes[1 + i * 4 + 2] = (val >> 8) & 0xff
    bytes[1 + i * 4 + 3] = val & 0xff
  }
  return bytes
}

// ── Transaction parameters ──────────────────────────────────────

export interface EthTxParams {
  to: string
  value: string
  gasLimit: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
  nonce: string
  data?: string
  chainId: number
}

export interface EthTxApduResult {
  apdu: string
  description: string
  rlpTx: string
}

const ETH_BIP32_PATH = [0x8000002c, 0x8000003c, 0x80000000, 0x00000000, 0x00000000]
const ETH_SIGN_INS = INS.ETH_SIGN_TX

function buildEip1559Tx(params: EthTxParams): Uint8Array {
  // EIP-1559: 0x02 || RLP([chainId, nonce, maxPriorityFee, maxFee, gasLimit, to, value, data, []])
  const fields = [
    numToBytes(params.chainId),
    numToBytes(params.nonce),
    numToBytes(params.maxPriorityFeePerGas ?? '0x59682f00'),
    numToBytes(params.maxFeePerGas ?? '0x59682f00'),
    numToBytes(params.gasLimit),
    toBytes(params.to),
    numToBytes(params.value),
    toBytes(params.data ?? '0x'),
    new Uint8Array([0xc0]), // empty access list
  ]
  const rlpTx = rlpList(fields)
  const txType = new Uint8Array([0x02]) // EIP-1559 type prefix
  return concatBytes([txType, rlpTx])
}

export function buildEthSignTxApdu(params: EthTxParams): EthTxApduResult {
  const rlpTx = buildEip1559Tx(params)
  const pathBytes = encodeBip32Path(ETH_BIP32_PATH)
  const payload = concatBytes([pathBytes, rlpTx])
  const lc = payload.length

  const header = new Uint8Array([
    CLA.APP,
    ETH_SIGN_INS,
    0x00, // P1 = first chunk
    0x00, // P2
    lc,
  ])

  const apduBytes = concatBytes([header, payload])
  const apdu = Array.from(apduBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    apdu,
    description: `Sign ETH tx: ${params.value} wei → ${params.to.slice(0, 10)}...`,
    rlpTx: Array.from(rlpTx).map(b => b.toString(16).padStart(2, '0')).join(''),
  }
}
