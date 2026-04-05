import { describe, it, expect } from 'vitest'
import { decodeTronSignRequest, encodeTronSignature } from '../chains/tron'
import { CBOR_TAGS, encodeKeypathTag, cborTag, cborMap, cborUint, cborBytes } from '../cbor'
import { encodeToUR } from '../ur'

function makeTronSignRequestUR(): string {
  const inner = cborMap([
    [cborUint(1), cborBytes(new Uint8Array(16).fill(0x11))],
    [cborUint(2), cborBytes(new Uint8Array(32).fill(0x22))],
    [cborUint(3), encodeKeypathTag("m/44'/195'/0'/0/0")],
  ])
  const cbor = cborTag(CBOR_TAGS.TRON_SIGN_REQUEST, inner)
  return encodeToUR(cbor, 'tron-sign-request')
}

describe('decodeTronSignRequest', () => {
  it('decodes requestId, signData, derivationPath', () => {
    const req = decodeTronSignRequest(makeTronSignRequestUR())
    expect(Array.from(req.requestId)).toEqual(Array.from(new Uint8Array(16).fill(0x11)))
    expect(req.derivationPath).toBe("m/44'/195'/0'/0/0")
  })
})

describe('encodeTronSignature', () => {
  it('produces ur:tron-signature string', () => {
    const urStr = encodeTronSignature({
      requestId: new Uint8Array(16).fill(0x11),
      signature: new Uint8Array(65).fill(0x33),
    })
    expect(urStr.startsWith('ur:tron-signature/')).toBe(true)
  })
})
