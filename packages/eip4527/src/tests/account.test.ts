import { describe, it, expect } from 'vitest'
import { encodeHDKey, encodeCryptoAccount } from '../account'
import type { CryptoHDKey, CryptoAccount } from '../types'

const SAMPLE_KEY: CryptoHDKey = {
  isMaster: false,
  isPrivateKey: false,
  keyData: new Uint8Array(33).fill(0x02),
  chainCode: new Uint8Array(32).fill(0xcc),
  origin: { path: "m/44'/60'/0'" },
  useInfo: { type: 60, network: 1 },
}

describe('encodeHDKey', () => {
  it('produces a valid UR string starting with ur:', () => {
    const ur = encodeHDKey(SAMPLE_KEY)
    expect(ur).toMatch(/^ur:crypto-hdkey\//)
  })

  it('produces consistent output for same input', () => {
    const ur1 = encodeHDKey(SAMPLE_KEY)
    const ur2 = encodeHDKey(SAMPLE_KEY)
    expect(ur1).toBe(ur2)
  })
})

describe('encodeCryptoAccount', () => {
  it('produces a valid UR string', () => {
    const account: CryptoAccount = {
      masterFingerprint: new Uint8Array(4).fill(0x12),
      outputDescriptors: [SAMPLE_KEY],
    }
    const ur = encodeCryptoAccount(account)
    expect(ur).toMatch(/^ur:crypto-account\//)
  })

  it('works with multiple HD keys', () => {
    const account: CryptoAccount = {
      masterFingerprint: new Uint8Array(4).fill(0x34),
      outputDescriptors: [
        SAMPLE_KEY,
        { ...SAMPLE_KEY, origin: { path: "m/44'/501'/0'" } },
      ],
    }
    const ur = encodeCryptoAccount(account)
    expect(ur).toMatch(/^ur:crypto-account\//)
  })
})
