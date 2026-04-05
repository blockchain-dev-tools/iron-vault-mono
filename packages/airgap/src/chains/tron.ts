import { IACMessageType } from '../types'
import { encodeIACMessage, decodeIACMessage } from '../iac'
import type { IACMessage, TronAirGapTx, TronAirGapSignedTx } from '../types'

export function createTronSignRequest(id: string, tx: TronAirGapTx, derivationPath: string): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignRequest,
    protocol: 'tron',
    payload: { ...tx, derivationPath },
  }
  return encodeIACMessage(msg)
}

export function decodeTronSignRequest(qr: string): { id: string; tx: TronAirGapTx; derivationPath: string } {
  const msg = decodeIACMessage(qr)
  if (msg.protocol !== 'tron') throw new Error(`Expected tron protocol, got ${msg.protocol}`)
  const p = msg.payload as Record<string, unknown>
  return {
    id: msg.id,
    derivationPath: String(p.derivationPath ?? ''),
    tx: { rawDataHex: String(p.rawDataHex ?? '') },
  }
}

export function createTronSignResponse(id: string, signed: TronAirGapSignedTx): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignResponse,
    protocol: 'tron',
    payload: signed,
  }
  return encodeIACMessage(msg)
}
