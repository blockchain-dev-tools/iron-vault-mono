export type EthSignDataType = 'legacy-tx' | 'typed-tx' | 'personal-sign' | 'typed-data'

export interface EthSignRequest {
  requestId: Uint8Array
  signData: Uint8Array
  dataType: EthSignDataType
  chainId?: number
  derivationPath: string
  address?: Uint8Array
  origin?: string
}

export interface EthSignature {
  requestId: Uint8Array
  signature: Uint8Array
  origin?: string
}

export interface SolSignRequest {
  requestId: Uint8Array
  signData: Uint8Array
  derivationPath: string
  origin?: string
}

export interface SolSignature {
  requestId: Uint8Array
  signature: Uint8Array
}

export interface BtcPsbt {
  psbtBytes: Uint8Array
}

export interface TronSignRequest {
  requestId: Uint8Array
  signData: Uint8Array
  derivationPath: string
  origin?: string
}

export interface TronSignature {
  requestId: Uint8Array
  signature: Uint8Array
}

export interface SuiSignRequest {
  requestId: Uint8Array
  signData: Uint8Array
  derivationPath: string
  origin?: string
}

export interface SuiSignature {
  requestId: Uint8Array
  signature: Uint8Array
}

export interface CryptoHDKey {
  isMaster: boolean
  isPrivateKey: boolean
  keyData: Uint8Array
  chainCode?: Uint8Array
  useInfo?: { type: number; network: number }
  origin?: { path: string; depth?: number }
  children?: { path: string }
  parentFingerprint?: number
  name?: string
  note?: string
}

export interface CryptoAccount {
  masterFingerprint: Uint8Array
  outputDescriptors: CryptoHDKey[]
}
