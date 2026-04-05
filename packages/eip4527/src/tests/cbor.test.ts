import { describe, it, expect } from 'vitest'
import {
  CBOR_TAGS,
  encodeDerivationPath,
  decodeDerivationPath,
  encodeKeypathTag,
  decodeKeypathTag,
  cborTag, cborMap, cborUint,
  isDecodedTag,
} from '../cbor'
import { decode } from 'cbor-x'

describe('CBOR_TAGS', () => {
  it('has correct ETH_SIGN_REQUEST value', () => {
    expect(CBOR_TAGS.ETH_SIGN_REQUEST).toBe(401)
  })
  it('has all 13 tag numbers', () => {
    const keys = Object.keys(CBOR_TAGS)
    expect(keys.length).toBe(13)
  })
  it('SOL values', () => {
    expect(CBOR_TAGS.SOL_SIGN_REQUEST).toBe(1101)
    expect(CBOR_TAGS.SOL_SIGNATURE).toBe(1102)
  })
  it('Tron values', () => {
    expect(CBOR_TAGS.TRON_SIGN_REQUEST).toBe(5101)
    expect(CBOR_TAGS.TRON_SIGNATURE).toBe(5102)
  })
  it('Sui values', () => {
    expect(CBOR_TAGS.SUI_SIGN_REQUEST).toBe(7101)
    expect(CBOR_TAGS.SUI_SIGNATURE).toBe(7102)
  })
})

describe('encodeDerivationPath / decodeDerivationPath', () => {
  it("roundtrips m/44'/60'/0'/0/0", () => {
    const path = "m/44'/60'/0'/0/0"
    const encoded = encodeDerivationPath(path)
    expect(encoded).toEqual([0x8000002c, 0x8000003c, 0x80000000, 0, 0])
    expect(decodeDerivationPath(encoded)).toBe(path)
  })

  it("roundtrips m/44'/501'/0'/0'", () => {
    const path = "m/44'/501'/0'/0'"
    expect(decodeDerivationPath(encodeDerivationPath(path))).toBe(path)
  })

  it('roundtrips non-hardened path', () => {
    expect(decodeDerivationPath(encodeDerivationPath('m/0/1/2'))).toBe('m/0/1/2')
  })
})

describe('encodeKeypathTag / decodeKeypathTag', () => {
  it("roundtrips m/44'/60'/0'/0/0", () => {
    const path = "m/44'/60'/0'/0/0"
    const tagBytes = encodeKeypathTag(path)
    // decode with cbor-x and check tag structure
    const decoded = decode(Buffer.from(tagBytes))
    expect(isDecodedTag(decoded)).toBe(true)
    expect((decoded as { tag: number }).tag).toBe(CBOR_TAGS.CRYPTO_KEYPATH)
    // now use decodeKeypathTag on the decoded value
    expect(decodeKeypathTag(decoded)).toBe(path)
  })
})
