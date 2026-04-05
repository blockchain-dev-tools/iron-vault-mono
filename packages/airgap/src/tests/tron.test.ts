import { describe, it, expect } from 'vitest'
import { createTronSignRequest, decodeTronSignRequest, createTronSignResponse } from '../chains/tron'
import { decodeIACMessage } from '../iac'
import { IACMessageType } from '../types'

describe('createTronSignRequest / decodeTronSignRequest', () => {
  it('roundtrip preserves rawDataHex and derivationPath', () => {
    const tx = { rawDataHex: '0a02abcd' }
    const qr = createTronSignRequest('tron-001', tx, "m/44'/195'/0'/0/0")
    const { id, tx: decoded, derivationPath } = decodeTronSignRequest(qr)
    expect(id).toBe('tron-001')
    expect(decoded.rawDataHex).toBe('0a02abcd')
    expect(derivationPath).toBe("m/44'/195'/0'/0/0")
  })
})

describe('createTronSignResponse', () => {
  it('encodes sign response correctly', () => {
    const qr = createTronSignResponse('tron-001', { signature: 'aabbcc' })
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignResponse)
    expect(msg.protocol).toBe('tron')
  })
})
