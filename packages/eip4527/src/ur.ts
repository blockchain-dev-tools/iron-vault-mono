import { UR, UREncoder, URDecoder } from '@ngraveio/bc-ur'

export function encodeToUR(cbor: Uint8Array, type: string): string {
  const ur = new UR(Buffer.from(cbor), type)
  // Use Infinity fragment length to guarantee single part; nextPart() returns a string
  const encoder = new UREncoder(ur, Infinity)
  return encoder.nextPart()
}

export function encodeToURParts(cbor: Uint8Array, type: string, maxLen = 200): string[] {
  const ur = new UR(Buffer.from(cbor), type)
  const encoder = new UREncoder(ur, maxLen)
  const count = encoder.fragmentsLength as number
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    parts.push(encoder.nextPart())
  }
  return parts
}

export function decodeFromUR(urString: string): { cbor: Uint8Array; type: string } {
  const decoder = new URDecoder()
  const ok = decoder.receivePart(urString)
  if (!ok) throw new Error('Invalid UR part')
  if (!decoder.isComplete()) {
    throw new Error('Incomplete UR — use URMultiDecoder for multi-part')
  }
  const ur = decoder.resultUR()
  return { cbor: Uint8Array.from(ur.cbor), type: ur.type }
}

export class URMultiDecoder {
  private decoder = new URDecoder()

  receivePart(part: string): boolean {
    return this.decoder.receivePart(part)
  }

  isComplete(): boolean {
    return this.decoder.isComplete()
  }

  result(): { cbor: Uint8Array; type: string } {
    if (!this.decoder.isComplete()) {
      throw new Error('UR decoding not complete yet')
    }
    const ur = this.decoder.resultUR()
    return { cbor: Uint8Array.from(ur.cbor), type: ur.type }
  }
}
