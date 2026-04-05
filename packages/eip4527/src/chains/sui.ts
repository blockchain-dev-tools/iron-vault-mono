import { decode } from 'cbor-x'
import {
  CBOR_TAGS, toIntMap, toUint8Array, decodeKeypathTag, isDecodedTag,
  cborTag, cborMap, cborUint, cborBytes, cborText,
} from '../cbor'
import { encodeToUR, decodeFromUR } from '../ur'
import type { SuiSignRequest, SuiSignature } from '../types'

export function decodeSuiSignRequest(urString: string): SuiSignRequest {
  const { cbor, type } = decodeFromUR(urString)
  if (type !== 'sui-sign-request') {
    throw new Error(`Expected sui-sign-request, got ${type}`)
  }

  const outer = decode(Buffer.from(cbor))
  let map: Map<number, unknown>
  if (isDecodedTag(outer)) {
    map = toIntMap(outer.value)
  } else {
    map = toIntMap(outer)
  }

  return {
    requestId: toUint8Array(map.get(1)),
    signData: toUint8Array(map.get(2)),
    derivationPath: decodeKeypathTag(map.get(3)),
    origin: map.has(4) ? String(map.get(4)) : undefined,
  }
}

export function encodeSuiSignature(sig: SuiSignature): string {
  const entries: Array<[Uint8Array, Uint8Array]> = [
    [cborUint(1), cborBytes(sig.requestId)],
    [cborUint(2), cborBytes(sig.signature)],
  ]
  const cbor = cborTag(CBOR_TAGS.SUI_SIGNATURE, cborMap(entries))
  return encodeToUR(cbor, 'sui-signature')
}
