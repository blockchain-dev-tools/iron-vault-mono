import { describe, it, expect } from 'vitest'
import { decodeSuiSignRequest, encodeSuiSignature } from '../chains/sui'
import { CBOR_TAGS, encodeKeypathTag, cborTag, cborMap, cborUint, cborBytes } from '../cbor'
import { encodeToUR } from '../ur'

function makeSuiSignRequestUR(): string {
  const inner = cborMap([
    [cborUint(1), cborBytes(new Uint8Array(16).fill(0x55))],
    [cborUint(2), cborBytes(new Uint8Array(64).fill(0x66))],
    [cborUint(3), encodeKeypathTag("m/44'/784'/0'/0'/0'")],
  ])
  const cbor = cborTag(CBOR_TAGS.SUI_SIGN_REQUEST, inner)
  return encodeToUR(cbor, 'sui-sign-request')
}

describe('decodeSuiSignRequest', () => {
  it('decodes requestId, signData, derivationPath', () => {
    const req = decodeSuiSignRequest(makeSuiSignRequestUR())
    expect(Array.from(req.requestId)).toEqual(Array.from(new Uint8Array(16).fill(0x55)))
    expect(req.derivationPath).toBe("m/44'/784'/0'/0'/0'")
  })
})

describe('encodeSuiSignature', () => {
  it('produces ur:sui-signature string', () => {
    const urStr = encodeSuiSignature({
      requestId: new Uint8Array(16).fill(0x55),
      signature: new Uint8Array(64).fill(0x77),
    })
    expect(urStr.startsWith('ur:sui-signature/')).toBe(true)
  })
})
