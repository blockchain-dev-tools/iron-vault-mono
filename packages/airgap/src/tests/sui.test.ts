import { describe, it, expect } from 'vitest'
import { createSuiSignRequest, decodeSuiSignRequest, createSuiSignResponse } from '../chains/sui'
import { decodeIACMessage } from '../iac'
import { IACMessageType } from '../types'

describe('createSuiSignRequest / decodeSuiSignRequest', () => {
  it('roundtrip preserves txBytes and derivationPath', () => {
    const tx = { txBytes: 'AAECAwQ=' }
    const qr = createSuiSignRequest('sui-001', tx, "m/44'/784'/0'/0'/0'")
    const { id, tx: decoded, derivationPath } = decodeSuiSignRequest(qr)
    expect(id).toBe('sui-001')
    expect(decoded.txBytes).toBe('AAECAwQ=')
    expect(derivationPath).toBe("m/44'/784'/0'/0'/0'")
  })
})

describe('createSuiSignResponse', () => {
  it('encodes sign response correctly', () => {
    const qr = createSuiSignResponse('sui-001', { signature: 'c2lnbmF0dXJl' })
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignResponse)
    expect(msg.protocol).toBe('sui')
  })
})
