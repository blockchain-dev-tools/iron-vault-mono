import { IACMessageType } from '../types'
import { encodeIACMessage, decodeIACMessage } from '../iac'
import type { IACMessage, EthAirGapTx, EthAirGapSignedTx, EthAirGapAccount } from '../types'

export function createEthSignRequest(
  id: string,
  tx: EthAirGapTx,
  derivationPath: string,
  publicKey?: string
): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignRequest,
    protocol: 'eth',
    payload: { ...tx, derivationPath, ...(publicKey ? { publicKey } : {}) },
  }
  return encodeIACMessage(msg)
}

export function decodeEthSignRequest(qr: string): { id: string; tx: EthAirGapTx; derivationPath: string } {
  const msg = decodeIACMessage(qr)
  if (msg.protocol !== 'eth') throw new Error(`Expected eth protocol, got ${msg.protocol}`)
  const p = msg.payload as Record<string, unknown>
  return {
    id: msg.id,
    derivationPath: String(p.derivationPath ?? ''),
    tx: {
      nonce: String(p.nonce ?? '0x0'),
      gasPrice: String(p.gasPrice ?? '0x0'),
      gasLimit: String(p.gasLimit ?? '0x5208'),
      to: String(p.to ?? '0x'),
      value: String(p.value ?? '0x0'),
      data: String(p.data ?? '0x'),
      chainId: Number(p.chainId ?? 1),
    },
  }
}

export function createEthSignResponse(id: string, signedTx: EthAirGapSignedTx): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignResponse,
    protocol: 'eth',
    payload: signedTx,
  }
  return encodeIACMessage(msg)
}

export function createEthAccountShare(id: string, account: EthAirGapAccount): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.AccountShareResponse,
    protocol: 'eth',
    payload: account,
  }
  return encodeIACMessage(msg)
}
