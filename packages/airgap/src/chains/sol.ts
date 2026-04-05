import { IACMessageType } from '../types'
import { encodeIACMessage, decodeIACMessage } from '../iac'
import type { IACMessage, SolAirGapTx, SolAirGapSignedTx } from '../types'

export function createSolSignRequest(id: string, tx: SolAirGapTx, derivationPath: string): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignRequest,
    protocol: 'sol',
    payload: { ...tx, derivationPath },
  }
  return encodeIACMessage(msg)
}

export function decodeSolSignRequest(qr: string): { id: string; tx: SolAirGapTx; derivationPath: string } {
  const msg = decodeIACMessage(qr)
  if (msg.protocol !== 'sol') throw new Error(`Expected sol protocol, got ${msg.protocol}`)
  const p = msg.payload as Record<string, unknown>
  return {
    id: msg.id,
    derivationPath: String(p.derivationPath ?? ''),
    tx: { serializedTx: String(p.serializedTx ?? '') },
  }
}

export function createSolSignResponse(id: string, signed: SolAirGapSignedTx): string {
  const msg: IACMessage = {
    id,
    type: IACMessageType.TransactionSignResponse,
    protocol: 'sol',
    payload: signed,
  }
  return encodeIACMessage(msg)
}
