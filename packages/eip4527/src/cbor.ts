import { encode, decode } from 'cbor-x'

export const CBOR_TAGS = {
  CRYPTO_HDKEY: 303,
  CRYPTO_KEYPATH: 304,
  CRYPTO_COIN_INFO: 305,
  CRYPTO_ACCOUNT: 311,
  CRYPTO_PSBT: 310,
  ETH_SIGN_REQUEST: 401,
  ETH_SIGNATURE: 402,
  SOL_SIGN_REQUEST: 1101,
  SOL_SIGNATURE: 1102,
  TRON_SIGN_REQUEST: 5101,
  TRON_SIGNATURE: 5102,
  SUI_SIGN_REQUEST: 7101,
  SUI_SIGNATURE: 7102,
} as const

// ──────────────────────────────────────────────────────────────────────────────
// Minimal manual CBOR encoder (cbor-x's Tag.encode is broken for arbitrary tags)
// ──────────────────────────────────────────────────────────────────────────────

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

/** Encode CBOR unsigned integer with given major type prefix (0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0). */
function cborHead(majorType: number, n: number): Uint8Array {
  const mt = majorType & 0xe0
  if (n <= 0x17) return new Uint8Array([mt | n])
  if (n <= 0xFF) return new Uint8Array([mt | 24, n])
  if (n <= 0xFFFF) return new Uint8Array([mt | 25, (n >>> 8) & 0xFF, n & 0xFF])
  return new Uint8Array([mt | 26, (n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF])
}

export function cborUint(n: number): Uint8Array {
  return cborHead(0x00, n)
}

export function cborBytes(data: Uint8Array | Buffer): Uint8Array {
  return concatBytes(cborHead(0x40, data.length), data)
}

export function cborText(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str)
  return concatBytes(cborHead(0x60, bytes.length), bytes)
}

export function cborArray(items: Uint8Array[]): Uint8Array {
  return concatBytes(cborHead(0x80, items.length), ...items)
}

/**
 * Encode a CBOR map with pre-encoded key-value pair bytes.
 * Each entry is [encodedKey, encodedValue].
 */
export function cborMap(entries: Array<[Uint8Array, Uint8Array]>): Uint8Array {
  return concatBytes(
    cborHead(0xa0, entries.length),
    ...entries.flatMap(([k, v]) => [k, v])
  )
}

/** Wrap pre-encoded CBOR bytes in a CBOR tag. */
export function cborTag(tagNumber: number, valueBytes: Uint8Array): Uint8Array {
  return concatBytes(cborHead(0xc0, tagNumber), valueBytes)
}

// ──────────────────────────────────────────────────────────────────────────────
// Decode helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Decode CBOR bytes using cbor-x. */
export function decodeCbor(bytes: Uint8Array): unknown {
  return decode(Buffer.from(bytes))
}

/** Check if a cbor-x decoded value is a tagged value { tag, value }. */
export function isDecodedTag(val: unknown): val is { tag: number; value: unknown } {
  return (
    val !== null &&
    typeof val === 'object' &&
    'tag' in (val as object) &&
    'value' in (val as object) &&
    typeof (val as { tag: unknown }).tag === 'number'
  )
}

/**
 * Convert a cbor-x decoded value (Map or plain object) to Map<number, unknown>.
 * cbor-x returns a Map for integer-keyed CBOR maps (decoded via tag 259),
 * or a plain object with string keys for manually-encoded maps.
 */
export function toIntMap(val: unknown): Map<number, unknown> {
  if (val instanceof Map) {
    const m = new Map<number, unknown>()
    for (const [k, v] of val) {
      m.set(typeof k === 'string' ? parseInt(k, 10) : Number(k), v)
    }
    return m
  }
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    const m = new Map<number, unknown>()
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      m.set(parseInt(k, 10), v)
    }
    return m
  }
  throw new Error(`Expected CBOR map, got ${typeof val}: ${JSON.stringify(val)}`)
}

export function toUint8Array(val: unknown): Uint8Array {
  if (val instanceof Uint8Array) return val
  if (Buffer.isBuffer(val)) return Uint8Array.from(val)
  if (Array.isArray(val)) return new Uint8Array(val as number[])
  throw new Error(`Expected bytes, got ${typeof val}`)
}

export function toOptUint8Array(val: unknown): Uint8Array | undefined {
  if (val == null) return undefined
  return toUint8Array(val)
}

// ──────────────────────────────────────────────────────────────────────────────
// Derivation path: "m/44'/60'/0'/0/0" ↔ [0x8000002C, 0x8000003C, 0x80000000, 0, 0]
// ──────────────────────────────────────────────────────────────────────────────

export function encodeDerivationPath(path: string): number[] {
  return path
    .replace(/^m\//, '')
    .split('/')
    .filter(Boolean)
    .map(part => {
      const hardened = part.endsWith("'")
      const index = parseInt(part.replace("'", ''), 10)
      return hardened ? ((index | 0x80000000) >>> 0) : index
    })
}

export function decodeDerivationPath(components: number[]): string {
  const parts = components.map(comp => {
    const unsigned = comp >>> 0
    if (unsigned & 0x80000000) {
      return `${(unsigned & 0x7fffffff)}'`
    }
    return `${unsigned}`
  })
  return 'm/' + parts.join('/')
}

/**
 * Encode a derivation path as CBOR tag(304, map{1: [components]}).
 * Returns raw CBOR bytes (not a UR string).
 */
export function encodeKeypathTag(path: string): Uint8Array {
  const components = encodeDerivationPath(path)
  const inner = cborMap([[cborUint(1), cborArray(components.map(cborUint))]])
  return cborTag(CBOR_TAGS.CRYPTO_KEYPATH, inner)
}

/**
 * Decode a cbor-x decoded value that should be a crypto-keypath tag.
 * Accepts { tag: 304, value: {1: [components]} } from cbor-x decode.
 */
export function decodeKeypathTag(val: unknown): string {
  let inner: unknown
  if (isDecodedTag(val)) {
    if ((val as { tag: number }).tag !== CBOR_TAGS.CRYPTO_KEYPATH) {
      throw new Error(`Expected tag ${CBOR_TAGS.CRYPTO_KEYPATH}, got ${(val as { tag: number }).tag}`)
    }
    inner = (val as { tag: number; value: unknown }).value
  } else {
    inner = val
  }
  const m = toIntMap(inner)
  const components = m.get(1)
  if (!Array.isArray(components)) {
    throw new Error('Invalid crypto-keypath: missing components array')
  }
  return decodeDerivationPath(components as number[])
}
