import { INS, CLA } from '@iron-vault/apdu'

export interface SolTxParams {
  to: string
  amount: string
  memo?: string
}

export interface SolTxApduResult {
  apdu: string
  description: string
}

const SOL_BIP32_PATH = [0x8000002c, 0x800001f5, 0x80000000, 0x00000000, 0x00000000]

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

/**
 * Build a Solana transfer message APDU (SIGN_SOLANA_MESSAGE — E0 04).
 *
 * This constructs a simple "System Program Transfer" message.
 * P1=0x01 = first chunk with BIP32 path, num_signers=1.
 */
export function buildSolSignMessageApdu(params: SolTxParams): SolTxApduResult {
  // Build a simple Solana transfer message bytes
  // For MVP we construct a minimal message that handleSol can sign
  const memo = params.memo ?? ''
  const msgStr = `Solana Transfer: ${params.amount} SOL to ${params.to}${memo ? ` (${memo})` : ''}`
  const msgBytes = new TextEncoder().encode(msgStr)

  // num_signers(1) + bip32_path + message_bytes
  const numSigners = new Uint8Array([1])
  const pathBytes = encodeBip32Path(SOL_BIP32_PATH)
  const payload = concatBytes([numSigners, pathBytes, msgBytes])

  const lc = payload.length
  const header = new Uint8Array([CLA.APP, INS.SOL_SIGN_MSG, 0x01, 0x00, lc])
  const apduBytes = concatBytes([header, payload])

  const apdu = Array.from(apduBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    apdu,
    description: `Sign Solana message: ${params.amount} SOL → ${params.to.slice(0, 8)}...`,
  }
}
