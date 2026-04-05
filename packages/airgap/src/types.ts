export const IACMessageType = {
  AccountShareResponse: 0,
  TransactionSignRequest: 1,
  TransactionSignResponse: 2,
  MessageSignRequest: 3,
  MessageSignResponse: 4,
} as const

export type IACMessageTypeValue = (typeof IACMessageType)[keyof typeof IACMessageType]

export interface IACMessage {
  id: string
  type: IACMessageTypeValue
  protocol: string
  payload: unknown
}

export interface IACChunk {
  current: number  // 0-based index
  total: number
  payload: string  // base58check encoded chunk data
}

// ETH payloads
export interface EthAirGapTx {
  nonce: string      // hex
  gasPrice: string   // hex
  gasLimit: string   // hex
  to: string         // hex address
  value: string      // hex
  data: string       // hex
  chainId: number
}

export interface EthAirGapSignedTx {
  signedTx: string   // hex of signed tx bytes
}

export interface EthAirGapAccount {
  publicKey: string    // hex uncompressed public key
  address: string      // checksummed hex address
  derivationPath: string
}

// SOL payloads
export interface SolAirGapTx {
  serializedTx: string   // base64
}

export interface SolAirGapSignedTx {
  signedTx: string   // base64
}

// BTC payloads
export interface BtcAirGapTx {
  psbt: string   // base64
}

export interface BtcAirGapSignedTx {
  signedPsbt: string   // base64
}

// Tron payloads
export interface TronAirGapTx {
  rawDataHex: string
}

export interface TronAirGapSignedTx {
  signature: string   // hex
}

// Sui payloads
export interface SuiAirGapTx {
  txBytes: string   // base64
}

export interface SuiAirGapSignedTx {
  signature: string   // base64
}
