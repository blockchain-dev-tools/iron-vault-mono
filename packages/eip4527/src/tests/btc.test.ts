import { describe, it, expect } from 'vitest'
import { decodeCryptoPsbt, encodePsbt } from '../chains/btc'
import { CBOR_TAGS, cborTag, cborBytes } from '../cbor'
import { encodeToUR } from '../ur'

const SAMPLE_PSBT = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff, 0x01, 0x02])

describe('decodeCryptoPsbt', () => {
  it('decodes crypto-psbt type', () => {
    const cbor = cborTag(CBOR_TAGS.CRYPTO_PSBT, cborBytes(SAMPLE_PSBT))
    const ur = encodeToUR(cbor, 'crypto-psbt')
    const { psbtBytes } = decodeCryptoPsbt(ur)
    expect(Array.from(psbtBytes)).toEqual(Array.from(SAMPLE_PSBT))
  })

  it('decodes psbt type (v2 name)', () => {
    const cbor = cborTag(CBOR_TAGS.CRYPTO_PSBT, cborBytes(SAMPLE_PSBT))
    const ur = encodeToUR(cbor, 'psbt')
    const { psbtBytes } = decodeCryptoPsbt(ur)
    expect(Array.from(psbtBytes)).toEqual(Array.from(SAMPLE_PSBT))
  })

  it('throws on unknown type', () => {
    const cbor = cborBytes(SAMPLE_PSBT)
    const ur = encodeToUR(cbor, 'eth-signature')
    expect(() => decodeCryptoPsbt(ur)).toThrow(/crypto-psbt or psbt/)
  })
})

describe('encodePsbt', () => {
  it('roundtrip preserves psbtBytes', () => {
    const ur = encodePsbt({ psbtBytes: SAMPLE_PSBT })
    const { psbtBytes } = decodeCryptoPsbt(ur)
    expect(Array.from(psbtBytes)).toEqual(Array.from(SAMPLE_PSBT))
  })

  it('encodes as psbt type when requested', () => {
    const ur = encodePsbt({ psbtBytes: SAMPLE_PSBT }, 'psbt')
    expect(ur.startsWith('ur:psbt/')).toBe(true)
  })
})
