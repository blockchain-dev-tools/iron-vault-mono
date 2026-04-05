import { describe, it, expect } from 'vitest'
import { createSolSignRequest, decodeSolSignRequest, createSolSignResponse } from '../chains/sol'
import { decodeIACMessage } from '../iac'
import { IACMessageType } from '../types'

describe('createSolSignRequest / decodeSolSignRequest', () => {
  it('roundtrip preserves serializedTx and derivationPath', () => {
    const tx = { serializedTx: 'AQIDBA==' }
    const qr = createSolSignRequest('sol-001', tx, "m/44'/501'/0'/0'")
    const { id, tx: decoded, derivationPath } = decodeSolSignRequest(qr)
    expect(id).toBe('sol-001')
    expect(decoded.serializedTx).toBe('AQIDBA==')
    expect(derivationPath).toBe("m/44'/501'/0'/0'")
  })
})

describe('createSolSignResponse', () => {
  it('encodes sign response correctly', () => {
    const qr = createSolSignResponse('sol-001', { signedTx: 'signedbase64==' })
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignResponse)
    expect(msg.protocol).toBe('sol')
  })
})
