import { CLA, INS, P1 } from '@iron-vault/apdu'

// ── Helpers ──────────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
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

function buildApdu(cla: number, ins: number, p1: number, p2: number, payload: Uint8Array): string {
  const header = new Uint8Array([cla, ins, p1, p2, payload.length])
  return toHex(concatBytes([header, payload]))
}

// ── Default BIP32 paths by chain ─────────────────────────────────────

export const DEFAULT_PATHS: Record<string, number[]> = {
  eth:  [0x8000002c, 0x8000003c, 0x80000000, 0x00000000, 0x00000000],
  sol:  [0x8000002c, 0x800001f5, 0x80000000, 0x00000000, 0x00000000],
  btc:  [0x8000002c, 0x80000000, 0x80000000, 0x00000000, 0x00000000],
  tron: [0x8000002c, 0x800000c3, 0x80000000, 0x00000000, 0x00000000],
  sui:  [0x8000002c, 0x80000310, 0x80000000, 0x00000000, 0x00000000],
}

// ── Parse response helpers ───────────────────────────────────────────

export interface EthAddressResponse {
  pubkey: string
  address: string
}

export interface SolPubkeyResponse {
  pubkey: string
  address: string
}

export interface SignResponse {
  signature: string     // hex signature (v+r+s or raw)
  statusWord: string    // e.g. '9000'
}

export interface VersionResponse {
  version: string
  appName?: string
}

// ── OS Commands ──────────────────────────────────────────────────────

/** Get device version (CLA E0 INS 01) */
export function getVersion(): string {
  return buildApdu(CLA.APP, INS.GET_VERSION, 0x00, 0x00, new Uint8Array(0))
}

/** Get current app and version (CLA B0 INS 01) */
export function getAppAndVersion(): string {
  return buildApdu(CLA.GLOBAL, INS.GET_APP_AND_VERSION, 0x00, 0x00, new Uint8Array(0))
}

/** Open a specific app (switch chain context) */
export function openApp(appName: string): string {
  const payload = new TextEncoder().encode(appName)
  return buildApdu(CLA.APP, INS.OPEN_APP, 0x00, 0x00, payload)
}

/** Quit current app (back to dashboard) */
export function quitApp(): string {
  return buildApdu(CLA.APP, INS.QUIT_APP, 0x00, 0x00, new Uint8Array(0))
}

/** Get device info (CLA E0 INS E2) */
export function getDeviceInfo(): string {
  return buildApdu(CLA.APP, INS.GET_DEVICE_INFO, 0x00, 0x00, new Uint8Array(0))
}

// ── Ethereum Commands ────────────────────────────────────────────────

/** Get ETH address from BIP32 path */
export function getEthAddress(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.eth
  return buildApdu(CLA.APP, INS.ETH_GET_ADDRESS, 0x00, 0x00, encodeBip32Path(p))
}

/**
 * Sign an Ethereum transaction (RLP-encoded, EIP-1559 or legacy).
 * For multi-chunk: pass the full RLP bytes; chunking happens automatically
 * by the Ledger protocol (P1=0x00 first, further chunks sent separately).
 */
export function signEthTransaction(rlpTx: Uint8Array, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.eth
  const pathBytes = encodeBip32Path(p)
  const payload = concatBytes([pathBytes, rlpTx])
  const header = new Uint8Array([CLA.APP, INS.ETH_SIGN_TX, P1.FIRST_CHUNK, 0x00])
  const first = toHex(concatBytes([header, new Uint8Array([payload.length]), payload]))
  return [first]
}

/** Sign an ETH personal message (EIP-191) */
export function signEthPersonalMessage(messageHex: string, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.eth
  const pathBytes = encodeBip32Path(p)
  const msgBytes = new Uint8Array(messageHex.length / 2)
  for (let i = 0; i < msgBytes.length; i++) {
    msgBytes[i] = parseInt(messageHex.slice(i * 2, i * 2 + 2), 16)
  }
  const payload = concatBytes([pathBytes, msgBytes])
  const header = new Uint8Array([CLA.APP, INS.ETH_SIGN_PERSONAL_MSG, P1.FIRST_CHUNK, 0x00])
  const first = toHex(concatBytes([header, new Uint8Array([payload.length]), payload]))
  return [first]
}

// ── Solana Commands ──────────────────────────────────────────────────

/** Get Solana pubkey */
export function getSolPubkey(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.sol
  return buildApdu(CLA.APP, INS.SOL_GET_PUBKEY, 0x00, 0x00, encodeBip32Path(p))
}

/** Get Solana address (base58) */
export function getSolAddress(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.sol
  return buildApdu(CLA.APP, INS.SOL_GET_ADDRESS, 0x00, 0x00, encodeBip32Path(p))
}

/**
 * Sign a Solana message.
 * P1=0x01 = first chunk with BIP32 path + num_signers prefix.
 */
export function signSolMessage(message: Uint8Array, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.sol
  const pathBytes = encodeBip32Path(p)
  // Ledger Solana app expects: num_signers(1) + path + message
  const numSigners = new Uint8Array([1])
  const payload = concatBytes([numSigners, pathBytes, message])
  const header = new Uint8Array([CLA.APP, INS.SOL_SIGN_MSG, 0x01, 0x00, payload.length])
  const first = toHex(concatBytes([header, payload]))
  return [first]
}

/** Sign a Solana transaction */
export function signSolTransaction(tx: Uint8Array, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.sol
  const pathBytes = encodeBip32Path(p)
  const numSigners = new Uint8Array([1])
  const payload = concatBytes([numSigners, pathBytes, tx])
  const header = new Uint8Array([CLA.APP, INS.SOL_SIGN_TX, 0x01, 0x00, payload.length])
  const first = toHex(concatBytes([header, payload]))
  return [first]
}

// ── Bitcoin Commands ─────────────────────────────────────────────────

/** Get BTC extended pubkey */
export function getBtcXpub(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.btc
  return buildApdu(CLA.BTC, INS.BTC_GET_XPUB, 0x00, 0x00, encodeBip32Path(p))
}

/** Get BTC wallet address */
export function getBtcAddress(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.btc
  return buildApdu(CLA.BTC, INS.BTC_GET_WALLET_ADDR, 0x00, 0x00, encodeBip32Path(p))
}

// ── Tron Commands ────────────────────────────────────────────────────

/** Get Tron pubkey (returns uncompressed pubkey + base58 address) */
export function getTronPubkey(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.tron
  return buildApdu(CLA.TRON, INS.TRON_GET_PUBKEY, 0x00, 0x00, encodeBip32Path(p))
}

/** Sign Tron transaction */
export function signTronTransaction(txHex: string, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.tron
  const pathBytes = encodeBip32Path(p)
  const txBytes = new Uint8Array(txHex.length / 2)
  for (let i = 0; i < txBytes.length; i++) {
    txBytes[i] = parseInt(txHex.slice(i * 2, i * 2 + 2), 16)
  }
  const payload = concatBytes([pathBytes, txBytes])
  const header = new Uint8Array([CLA.TRON, INS.TRON_SIGN_TX, P1.FIRST_CHUNK, 0x00, payload.length])
  const first = toHex(concatBytes([header, payload]))
  return [first]
}

// ── Sui Commands ─────────────────────────────────────────────────────

/** Get Sui pubkey (returns 32-byte Ed25519 pubkey) */
export function getSuiPubkey(path?: number[]): string {
  const p = path ?? DEFAULT_PATHS.sui
  return buildApdu(CLA.SUI, INS.SUI_GET_PUBKEY, 0x00, 0x00, encodeBip32Path(p))
}

/** Sign Sui transaction */
export function signSuiTransaction(txHex: string, path?: number[]): string[] {
  const p = path ?? DEFAULT_PATHS.sui
  const pathBytes = encodeBip32Path(p)
  const txBytes = new Uint8Array(txHex.length / 2)
  for (let i = 0; i < txBytes.length; i++) {
    txBytes[i] = parseInt(txHex.slice(i * 2, i * 2 + 2), 16)
  }
  const payload = concatBytes([pathBytes, txBytes])
  const header = new Uint8Array([CLA.SUI, INS.SUI_SIGN_TX, P1.FIRST_CHUNK, 0x00, payload.length])
  const first = toHex(concatBytes([header, payload]))
  return [first]
}

// ── Response parsing ─────────────────────────────────────────────────

const SW_OK = '9000'

/** Parse ETH address response: first 65 bytes pubkey, rest is address hex */
export function parseEthAddressResponse(hex: string): EthAddressResponse | null {
  const sw = hex.slice(-4)
  if (sw !== SW_OK) return null
  const data = hex.slice(0, -4)
  // First 65 bytes = uncompressed pubkey, remaining = address
  const pubkey = data.slice(0, 130) // 65 bytes = 130 hex chars
  const address = data.slice(130)
  return { pubkey, address: '0x' + address }
}

/** Parse Solana pubkey response */
export function parseSolPubkeyResponse(hex: string): SolPubkeyResponse | null {
  const sw = hex.slice(-4)
  if (sw !== SW_OK) return null
  const data = hex.slice(0, -4)
  // First 32 bytes = Ed25519 pubkey, remaining = base58 address
  const pubkey = data.slice(0, 64)
  const address = data.slice(64)
  return { pubkey, address }
}

/** Parse sign response: extract signature (all data before SW) */
export function parseSignResponse(hex: string): SignResponse | null {
  if (hex.length < 4) return null
  const sw = hex.slice(-4)
  const signature = hex.slice(0, -4)
  return { signature, statusWord: sw }
}

/** Parse version response */
export function parseVersionResponse(hex: string): VersionResponse | null {
  const sw = hex.slice(-4)
  if (sw !== SW_OK) return null
  const data = hex.slice(0, -4)
  const bytes = data.length / 2
  if (bytes >= 3) {
    const major = parseInt(hex.slice(0, 2), 16)
    const minor = parseInt(hex.slice(2, 4), 16)
    const patch = parseInt(hex.slice(4, 6), 16)
    return { version: `${major}.${minor}.${patch}` }
  }
  return null
}
