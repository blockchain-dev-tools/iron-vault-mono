import { IACMessageType } from '../types'
import { encodeIACMessage, decodeIACMessage } from '../iac'
import type { IACMessage, BtcAirGapTx, BtcAirGapSignedTx } from '../types'

export function createBtcSignRequest(id: string, tx: BtcAirGapTx, derivationPath: string): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignRequest,
    protocol: 'btc',
    payload: { ...tx, derivationPath },
  }
  return encodeIACMessage(msg)
}

export function decodeBtcSignRequest(qr: string): { id: string; tx: BtcAirGapTx; derivationPath: string } {
  const msg = decodeIACMessage(qr)
  if (msg.protocol !== 'btc') throw new Error(`Expected btc protocol, got ${msg.protocol}`)
  const p = msg.payload as Record<string, unknown>
  return {
    id: msg.id,
    derivationPath: String(p.derivationPath ?? ''),
    tx: { psbt: String(p.psbt ?? '') },
  }
}

export function createBtcSignResponse(id: string, signed: BtcAirGapSignedTx): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignResponse,
    protocol: 'btc',
    payload: signed,
  }
  return encodeIACMessage(msg)
}
