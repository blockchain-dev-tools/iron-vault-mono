import { describe, it, expect } from 'vitest'
import { encodeIACMessage, decodeIACMessage, encodeIACMessageChunked, collectIACChunk, assembleIACChunks } from '../iac'
import { IACMessageType } from '../types'
import type { IACMessage } from '../types'

const SAMPLE_MSG: IACMessage = {
  id: 'test-id-001',
  type: IACMessageType.TransactionSignRequest,
  protocol: 'eth',
  payload: { nonce: '0x1', to: '0xabc', value: '0x0', chainId: 1 },
}

describe('encodeIACMessage / decodeIACMessage', () => {
  it('roundtrip preserves id, type, protocol, payload', () => {
    const qr = encodeIACMessage(SAMPLE_MSG)
    expect(typeof qr).toBe('string')
    expect(qr.length).toBeGreaterThan(0)

    const decoded = decodeIACMessage(qr)
    expect(decoded.id).toBe(SAMPLE_MSG.id)
    expect(decoded.type).toBe(SAMPLE_MSG.type)
    expect(decoded.protocol).toBe(SAMPLE_MSG.protocol)
    expect((decoded.payload as Record<string, unknown>).chainId).toBe(1)
  })

  it('throws on invalid base58check', () => {
    expect(() => decodeIACMessage('not-valid-qr!!')).toThrow()
  })

  it('throws on wrong version', () => {
    // Encode a version-2 wrapper manually and expect error
    const { encode } = require('cbor-x')
    const { deflate } = require('pako')
    const { base58check } = require('@scure/base')
    const { sha256 } = require('@noble/hashes/sha2.js')
    const bs58 = base58check(sha256)
    const cbor = encode([2, [SAMPLE_MSG]])
    const compressed = deflate(cbor)
    const qr = bs58.encode(compressed)
    expect(() => decodeIACMessage(qr)).toThrow(/version/)
  })
})

describe('chunked encode / assemble', () => {
  it('single chunk for small message', () => {
    const chunks = encodeIACMessageChunked(SAMPLE_MSG, 10000)
    expect(chunks.length).toBe(1)
    const iacChunks = chunks.map(c => collectIACChunk(c)!).filter(Boolean)
    const reassembled = assembleIACChunks(iacChunks)
    expect(reassembled.id).toBe(SAMPLE_MSG.id)
  })

  it('multiple chunks for forced small maxChunkSize', () => {
    const chunks = encodeIACMessageChunked(SAMPLE_MSG, 10)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('assembles 3 chunks fed in reverse order', () => {
    const chunks = encodeIACMessageChunked(SAMPLE_MSG, 10)
    const iacChunks = chunks.map(c => collectIACChunk(c)!).filter(Boolean)
    expect(iacChunks.length).toBeGreaterThan(0)
    // Feed in reverse
    const reversed = [...iacChunks].reverse()
    const reassembled = assembleIACChunks(reversed)
    expect(reassembled.id).toBe(SAMPLE_MSG.id)
    expect(reassembled.protocol).toBe(SAMPLE_MSG.protocol)
  })

  it('assembleIACChunks throws when chunks missing', () => {
    const chunks = encodeIACMessageChunked(SAMPLE_MSG, 10)
    const iacChunks = chunks.map(c => collectIACChunk(c)!).filter(Boolean)
    if (iacChunks.length > 1) {
      expect(() => assembleIACChunks([iacChunks[0]])).toThrow()
    }
  })

  it('collectIACChunk returns null for unchunked QR', () => {
    const qr = encodeIACMessage(SAMPLE_MSG)
    const result = collectIACChunk(qr)
    expect(result).toBeNull()
  })
})
