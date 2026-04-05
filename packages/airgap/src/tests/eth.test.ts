import { describe, it, expect } from 'vitest'
import { createEthSignRequest, decodeEthSignRequest, createEthSignResponse, createEthAccountShare } from '../chains/eth'
import { decodeIACMessage } from '../iac'
import { IACMessageType } from '../types'

const ETH_TX = {
  nonce: '0x1',
  gasPrice: '0x4a817c800',
  gasLimit: '0x5208',
  to: '0xd3CdA913deB6f4967b2Ef3aa68f5A843E6C5CDe',
  value: '0xde0b6b3a7640000',
  data: '0x',
  chainId: 1,
}

describe('createEthSignRequest / decodeEthSignRequest', () => {
  it('roundtrip preserves tx fields', () => {
    const qr = createEthSignRequest('req-001', ETH_TX, "m/44'/60'/0'/0/0")
    const { id, tx, derivationPath } = decodeEthSignRequest(qr)
    expect(id).toBe('req-001')
    expect(tx.nonce).toBe('0x1')
    expect(tx.chainId).toBe(1)
    expect(tx.to).toBe('0xd3CdA913deB6f4967b2Ef3aa68f5A843E6C5CDe')
    expect(derivationPath).toBe("m/44'/60'/0'/0/0")
  })

  it('decoded message has correct type and protocol', () => {
    const qr = createEthSignRequest('req-002', ETH_TX, "m/44'/60'/0'/0/0")
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignRequest)
    expect(msg.protocol).toBe('eth')
  })
})

describe('createEthSignResponse', () => {
  it('produces a valid QR that decodes correctly', () => {
    const qr = createEthSignResponse('req-001', { signedTx: '0xdeadbeef' })
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.TransactionSignResponse)
    expect(msg.protocol).toBe('eth')
    expect((msg.payload as { signedTx: string }).signedTx).toBe('0xdeadbeef')
  })
})

describe('createEthAccountShare', () => {
  it('produces AccountShareResponse message', () => {
    const account = {
      publicKey: '04abcdef',
      address: '0x1234',
      derivationPath: "m/44'/60'/0'/0/0",
    }
    const qr = createEthAccountShare('acc-001', account)
    const msg = decodeIACMessage(qr)
    expect(msg.type).toBe(IACMessageType.AccountShareResponse)
    expect(msg.protocol).toBe('eth')
  })
})
