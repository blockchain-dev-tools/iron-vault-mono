import { describe, it, expect } from 'vitest'
import { decode } from 'cbor-x'
import { encodeEthSignature, decodeEthSignRequest } from '../chains/eth'
import { CBOR_TAGS, encodeKeypathTag, cborTag, cborMap, cborUint, cborBytes } from '../cbor'
import { encodeToUR, decodeFromUR } from '../ur'

function makeEthSignRequestUR(overrides?: Partial<{
  requestId: Uint8Array
  signData: Uint8Array
  dataType: number
  chainId: number
  path: string
}>): string {
  const requestId = overrides?.requestId ?? new Uint8Array(16).fill(1)
  const signData = overrides?.signData ?? new Uint8Array(32).fill(2)
  const dataType = overrides?.dataType ?? 1
  const chainId = overrides?.chainId ?? 1
  const path = overrides?.path ?? "m/44'/60'/0'/0/0"

  const inner = cborMap([
    [cborUint(1), cborBytes(requestId)],
    [cborUint(2), cborBytes(signData)],
    [cborUint(3), cborUint(dataType)],
    [cborUint(4), cborUint(chainId)],
    [cborUint(5), encodeKeypathTag(path)],
  ])
  const cbor = cborTag(CBOR_TAGS.ETH_SIGN_REQUEST, inner)
  return encodeToUR(cbor, 'eth-sign-request')
}

describe('decodeEthSignRequest', () => {
  it('decodes legacy-tx (dataType=1)', () => {
    const ur = makeEthSignRequestUR({ dataType: 1 })
    const req = decodeEthSignRequest(ur)
    expect(req.dataType).toBe('legacy-tx')
    expect(req.chainId).toBe(1)
    expect(Array.from(req.requestId)).toEqual(Array.from(new Uint8Array(16).fill(1)))
  })

  it('decodes typed-tx (dataType=2)', () => {
    const ur = makeEthSignRequestUR({ dataType: 2 })
    expect(decodeEthSignRequest(ur).dataType).toBe('typed-tx')
  })

  it('decodes personal-sign (dataType=3)', () => {
    const ur = makeEthSignRequestUR({ dataType: 3 })
    expect(decodeEthSignRequest(ur).dataType).toBe('personal-sign')
  })

  it('decodes typed-data (dataType=4)', () => {
    const ur = makeEthSignRequestUR({ dataType: 4 })
    expect(decodeEthSignRequest(ur).dataType).toBe('typed-data')
  })

  it("decodes derivation path m/44'/60'/0'/0/0", () => {
    const ur = makeEthSignRequestUR()
    const req = decodeEthSignRequest(ur)
    expect(req.derivationPath).toBe("m/44'/60'/0'/0/0")
  })

  it('throws on wrong UR type', () => {
    const sig = {
      requestId: new Uint8Array(16).fill(1),
      signature: new Uint8Array(65).fill(3),
    }
    const wrongUR = encodeEthSignature(sig)
    expect(() => decodeEthSignRequest(wrongUR)).toThrow()
  })
})

describe('encodeEthSignature', () => {
  it('roundtrip: encodeEthSignature produces valid eth-signature UR', () => {
    const requestId = new Uint8Array(16)
    for (let i = 0; i < 16; i++) requestId[i] = i
    const signature = new Uint8Array(65).fill(0xab)

    const urStr = encodeEthSignature({ requestId, signature })
    expect(urStr).toMatch(/^ur:eth-signature\//)

    const { cbor } = decodeFromUR(urStr)
    const outer = decode(Buffer.from(cbor)) as { tag: number; value: unknown }
    expect(outer.tag).toBe(CBOR_TAGS.ETH_SIGNATURE)
  })

  it('produces valid ur:eth-signature string with origin', () => {
    const sig = {
      requestId: new Uint8Array(16).fill(1),
      signature: new Uint8Array(65).fill(2),
      origin: 'MetaMask',
    }
    const urStr = encodeEthSignature(sig)
    expect(urStr.startsWith('ur:eth-signature/')).toBe(true)
  })
})
