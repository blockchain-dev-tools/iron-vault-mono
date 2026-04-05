import { describe, it, expect } from 'vitest'
import { encodeIACMessageChunked, collectIACChunk, assembleIACChunks, encodeIACMessage } from '../iac'
import { IACMessageType } from '../types'
import type { IACMessage } from '../types'

const BIG_MSG: IACMessage = {
  id: 'big-msg-001',
  type: IACMessageType.TransactionSignRequest,
  protocol: 'eth',
  payload: {
    nonce: '0x1',
    data: '0x' + 'ab'.repeat(200),  // large data field
    chainId: 1,
  },
}

describe('chunked encode/decode', () => {
  it('encodes large message into multiple chunks', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('all chunks parse successfully with collectIACChunk', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    const iacChunks = chunks.map(c => collectIACChunk(c))
    for (const chunk of iacChunks) {
      expect(chunk).not.toBeNull()
      expect(chunk!.total).toBe(chunks.length)
    }
  })

  it('chunks have correct current indices', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    const iacChunks = chunks.map(c => collectIACChunk(c)!)
    const indices = iacChunks.map(c => c.current).sort((a, b) => a - b)
    for (let i = 0; i < chunks.length; i++) {
      expect(indices[i]).toBe(i)
    }
  })

  it('assembles correctly in order', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    const iacChunks = chunks.map(c => collectIACChunk(c)!)
    const msg = assembleIACChunks(iacChunks)
    expect(msg.id).toBe(BIG_MSG.id)
    expect(msg.protocol).toBe(BIG_MSG.protocol)
  })

  it('assembles correctly in reverse order', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    const iacChunks = chunks.map(c => collectIACChunk(c)!).reverse()
    const msg = assembleIACChunks(iacChunks)
    expect(msg.id).toBe(BIG_MSG.id)
  })

  it('assembles correctly in shuffled order', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    const iacChunks = chunks.map(c => collectIACChunk(c)!)
    // Shuffle
    const shuffled = [...iacChunks].sort(() => Math.random() - 0.5)
    const msg = assembleIACChunks(shuffled)
    expect(msg.id).toBe(BIG_MSG.id)
  })

  it('throws when missing chunks', () => {
    const chunks = encodeIACMessageChunked(BIG_MSG, 30)
    if (chunks.length > 1) {
      const iacChunks = chunks.slice(0, -1).map(c => collectIACChunk(c)!)
      expect(() => assembleIACChunks(iacChunks)).toThrow()
    }
  })
})
