import { encode, decode } from 'cbor-x'
import { deflate, inflate } from 'pako'
import { base58check } from '@scure/base'
import { sha256 } from '@noble/hashes/sha2.js'
import type { IACMessage, IACChunk } from './types'

const bs58check = base58check(sha256)

/**
 * AirGap IACProtocol v3 wire format:
 *   QR = base58check( pako.deflate( cbor.encode([3, [message_object]]) ) )
 */
export function encodeIACMessage(msg: IACMessage): string {
  const wrapper = [3, [{ id: msg.id, type: msg.type, protocol: msg.protocol, payload: msg.payload }]]
  const cbor = encode(wrapper)
  const compressed = deflate(cbor)
  return bs58check.encode(compressed)
}

export function decodeIACMessage(qr: string): IACMessage {
  let compressed: Uint8Array
  try {
    compressed = bs58check.decode(qr)
  } catch (e) {
    throw new Error(`Invalid base58check: ${(e as Error).message}`)
  }

  let cbor: Uint8Array
  try {
    cbor = inflate(compressed)
  } catch (e) {
    throw new Error(`Decompression failed: ${(e as Error).message}`)
  }

  let wrapper: unknown
  try {
    wrapper = decode(Buffer.from(cbor))
  } catch (e) {
    throw new Error(`CBOR decode failed: ${(e as Error).message}`)
  }

  if (!Array.isArray(wrapper) || wrapper.length < 2) {
    throw new Error('Invalid IAC wrapper: expected [version, messages]')
  }
  const [version, messages] = wrapper
  if (version !== 3) {
    throw new Error(`Unsupported IAC version: ${version}`)
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Invalid IAC messages array')
  }

  const msg = messages[0] as Record<string, unknown>
  return {
    id: String(msg.id ?? ''),
    type: Number(msg.type ?? 0) as IACMessage['type'],
    protocol: String(msg.protocol ?? ''),
    payload: msg.payload,
  }
}

/**
 * Encode a large IACMessage into multiple base58check chunks.
 * Each chunk is a base58check-encoded string of a slice of the compressed CBOR.
 * Format: the raw QR is just split into N equal pieces by byte length,
 * and each piece is base58check-encoded separately.
 */
export function encodeIACMessageChunked(msg: IACMessage, maxChunkSize: number): string[] {
  const wrapper = [3, [{ id: msg.id, type: msg.type, protocol: msg.protocol, payload: msg.payload }]]
  const cbor = encode(wrapper)
  const compressed = deflate(cbor)

  // Split the compressed bytes into chunks
  const total = Math.ceil(compressed.length / maxChunkSize)
  const chunks: string[] = []

  for (let i = 0; i < total; i++) {
    const start = i * maxChunkSize
    const end = Math.min(start + maxChunkSize, compressed.length)
    const slice = compressed.slice(start, end)
    // Each chunk payload = base58check( [current, total, slice] serialized )
    // We use cbor to serialize the chunk metadata + data
    const chunkData = encode({ current: i, total, data: slice })
    chunks.push(bs58check.encode(chunkData))
  }

  return chunks
}

/**
 * Parse a chunk string. Returns null if it's a single-message (unchunked) QR.
 */
export function collectIACChunk(chunk: string): IACChunk | null {
  let raw: Uint8Array
  try {
    raw = bs58check.decode(chunk)
  } catch {
    return null
  }

  let parsed: unknown
  try {
    parsed = decode(Buffer.from(raw))
  } catch {
    return null
  }

  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'current' in (parsed as Record<string, unknown>) &&
    'total' in (parsed as Record<string, unknown>)
  ) {
    const p = parsed as { current: number; total: number; data: Uint8Array }
    return {
      current: Number(p.current),
      total: Number(p.total),
      payload: chunk,
    }
  }

  return null
}

/**
 * Reassemble chunks into an IACMessage. Throws if not all chunks present.
 */
export function assembleIACChunks(chunks: IACChunk[]): IACMessage {
  if (chunks.length === 0) throw new Error('No chunks provided')

  const total = chunks[0].total
  if (chunks.length !== total) {
    throw new Error(`Expected ${total} chunks, got ${chunks.length}`)
  }

  // Sort by current index
  const sorted = [...chunks].sort((a, b) => a.current - b.current)

  // Verify contiguous
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].current !== i) {
      throw new Error(`Missing chunk ${i}`)
    }
  }

  // Decode each chunk data and concatenate
  const parts: Uint8Array[] = []
  for (const chunk of sorted) {
    const raw = bs58check.decode(chunk.payload)
    const parsed = decode(Buffer.from(raw)) as { current: number; total: number; data: Uint8Array }
    parts.push(parsed.data instanceof Uint8Array ? parsed.data : new Uint8Array(parsed.data))
  }

  // Concatenate
  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const compressed = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) {
    compressed.set(p, offset)
    offset += p.length
  }

  // Inflate and decode CBOR
  const cbor = inflate(compressed)
  const wrapper = decode(Buffer.from(cbor)) as unknown[]
  if (!Array.isArray(wrapper) || wrapper.length < 2) {
    throw new Error('Invalid reassembled IAC wrapper')
  }
  const messages = wrapper[1] as Array<Record<string, unknown>>
  const msg = messages[0]
  return {
    id: String(msg.id ?? ''),
    type: Number(msg.type ?? 0) as IACMessage['type'],
    protocol: String(msg.protocol ?? ''),
    payload: msg.payload,
  }
}
