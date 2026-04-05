import { describe, it, expect } from 'vitest'
import { decodeSolSignRequest, encodeSolSignature } from '../chains/sol'
import { CBOR_TAGS, encodeKeypathTag, cborTag, cborMap, cborUint, cborBytes, cborText } from '../cbor'
import { encodeToUR } from '../ur'

function makeSolSignRequestUR(path = "m/44'/501'/0'/0'"): string {
  const inner = cborMap([
    [cborUint(1), cborBytes(new Uint8Array(16).fill(0xaa))],
    [cborUint(2), cborBytes(new Uint8Array(64).fill(0xbb))],
    [cborUint(3), encodeKeypathTag(path)],
    [cborUint(4), cborText('TestApp')],
  ])
  const cbor = cborTag(CBOR_TAGS.SOL_SIGN_REQUEST, inner)
  return encodeToUR(cbor, 'sol-sign-request')
}

describe('decodeSolSignRequest', () => {
  it('decodes requestId, signData, derivationPath, origin', () => {
    const ur = makeSolSignRequestUR()
    const req = decodeSolSignRequest(ur)
    expect(Array.from(req.requestId)).toEqual(Array.from(new Uint8Array(16).fill(0xaa)))
    expect(Array.from(req.signData)).toEqual(Array.from(new Uint8Array(64).fill(0xbb)))
    expect(req.derivationPath).toBe("m/44'/501'/0'/0'")
    expect(req.origin).toBe('TestApp')
  })

  it('throws on wrong type', () => {
    const sig = { requestId: new Uint8Array(16).fill(1), signature: new Uint8Array(64).fill(2) }
    const wrong = encodeSolSignature(sig)
    expect(() => decodeSolSignRequest(wrong)).toThrow()
  })
})

describe('encodeSolSignature', () => {
  it('produces ur:sol-signature string', () => {
    const sig = {
      requestId: new Uint8Array(16).fill(0xcc),
      signature: new Uint8Array(64).fill(0xdd),
    }
    const urStr = encodeSolSignature(sig)
    expect(urStr.startsWith('ur:sol-signature/')).toBe(true)
  })
})
