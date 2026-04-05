import { IACMessageType } from '../types'
import { encodeIACMessage, decodeIACMessage } from '../iac'
import type { IACMessage, SuiAirGapTx, SuiAirGapSignedTx } from '../types'

export function createSuiSignRequest(id: string, tx: SuiAirGapTx, derivationPath: string): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignRequest,
    protocol: 'sui',
    payload: { ...tx, derivationPath },
  }
  return encodeIACMessage(msg)
}

export function decodeSuiSignRequest(qr: string): { id: string; tx: SuiAirGapTx; derivationPath: string } {
  const msg = decodeIACMessage(qr)
  if (msg.protocol !== 'sui') throw new Error(`Expected sui protocol, got ${msg.protocol}`)
  const p = msg.payload as Record<string, unknown>
  return {
    id: msg.id,
    derivationPath: String(p.derivationPath ?? ''),
    tx: { txBytes: String(p.txBytes ?? '') },
  }
}

export function createSuiSignResponse(id: string, signed: SuiAirGapSignedTx): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignResponse,
    protocol: 'sui',
    payload: signed,
  }
  return encodeIACMessage(msg)
}
