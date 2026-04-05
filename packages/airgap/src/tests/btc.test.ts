import { describe, it, expect } from 'vitest'
import { createBtcSignRequest, decodeBtcSignRequest, createBtcSignResponse } from '../chains/btc'
import { decodeIACMessage } from '../iac'
import { IACMessageType } from '../types'

describe('createBtcSignRequest / decodeBtcSignRequest', () => {
  it('roundtrip preserves psbt and derivationPath', () => {
    const tx = { psbt: 'cHNidP8BAAAA==' }
    const qr = createBtcSignRequest('btc-001', tx, "m/84'/0'/0'")
    const { id, tx: decoded, derivationPath } = decodeBtcSignRequest(qr)
    expect(id).toBe('btc-001')
    expect(decoded.psbt).toBe('cHNidP8BAAAA==')
    expect(derivationPath).toBe("m/84'/0'/0'")
  })
})

describe('createBtcSignResponse', () => {
  it('encodes sign response correctly', () => {
    const qr = createBtcSignResponse('btc-001', { signedPsbt: 'signedpsbt==' })
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignResponse)
    expect(msg.protocol).toBe('btc')
  })
})
