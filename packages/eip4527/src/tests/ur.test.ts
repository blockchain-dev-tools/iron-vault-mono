import { describe, it, expect } from 'vitest'
import { encodeToUR, encodeToURParts, decodeFromUR, URMultiDecoder } from '../ur'

const SAMPLE_CBOR = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])

describe('encodeToUR / decodeFromUR', () => {
  it('roundtrip preserves cbor bytes and type', () => {
    const urStr = encodeToUR(SAMPLE_CBOR, 'bytes')
    expect(urStr).toMatch(/^ur:bytes\//)
    const { cbor, type } = decodeFromUR(urStr)
    expect(type).toBe('bytes')
    expect(Array.from(cbor)).toEqual(Array.from(SAMPLE_CBOR))
  })

  it('produces lowercase ur: prefix', () => {
    const urStr = encodeToUR(SAMPLE_CBOR, 'eth-signature')
    expect(urStr.startsWith('ur:eth-signature/')).toBe(true)
  })

  it('throws on invalid UR', () => {
    expect(() => decodeFromUR('not-a-ur')).toThrow()
  })
})

describe('encodeToURParts', () => {
  it('returns single part for small payload', () => {
    const parts = encodeToURParts(SAMPLE_CBOR, 'bytes', 200)
    expect(parts.length).toBe(1)
    expect(parts[0]).toMatch(/^ur:bytes\//)
  })

  it('returns multiple parts for small maxLen', () => {
    const large = new Uint8Array(300).fill(0xab)
    const parts = encodeToURParts(large, 'bytes', 50)
    expect(parts.length).toBeGreaterThan(1)
    // each part should have sequence info
    for (const p of parts) {
      expect(p).toMatch(/^ur:bytes\/\d+-\d+\//)
    }
  })
})

describe('URMultiDecoder', () => {
  it('reassembles multi-part UR', () => {
    const large = new Uint8Array(300)
    for (let i = 0; i < 300; i++) large[i] = i % 256
    const parts = encodeToURParts(large, 'bytes', 50)
    expect(parts.length).toBeGreaterThan(1)

    const dec = new URMultiDecoder()
    for (const p of parts) {
      dec.receivePart(p)
    }
    expect(dec.isComplete()).toBe(true)
    const { cbor, type } = dec.result()
    expect(type).toBe('bytes')
    expect(Array.from(cbor)).toEqual(Array.from(large))
  })

  it('throws if result() called before complete', () => {
    const dec = new URMultiDecoder()
    expect(() => dec.result()).toThrow()
  })
})
