import { decode } from 'cbor-x'
import {
  CBOR_TAGS, toIntMap, toUint8Array, toOptUint8Array,
  encodeKeypathTag, decodeKeypathTag, isDecodedTag,
  cborTag, cborMap, cborUint, cborBytes, cborText,
} from '../cbor'
import { encodeToUR, decodeFromUR } from '../ur'
import type { EthSignRequest, EthSignature, EthSignDataType } from '../types'

const DATA_TYPE_MAP: Record<number, EthSignDataType> = {
  1: 'legacy-tx',
  2: 'typed-tx',
  3: 'personal-sign',
  4: 'typed-data',
}

export function decodeEthSignRequest(urString: string): EthSignRequest {
  const { cbor, type } = decodeFromUR(urString)
  if (type !== 'eth-sign-request') {
    throw new Error(`Expected eth-sign-request, got ${type}`)
  }

  const outer = decode(Buffer.from(cbor))
  let map: Map<number, unknown>
  if (isDecodedTag(outer)) {
    if (outer.tag !== CBOR_TAGS.ETH_SIGN_REQUEST) {
      throw new Error(`Expected CBOR tag ${CBOR_TAGS.ETH_SIGN_REQUEST}, got ${outer.tag}`)
    }
    map = toIntMap(outer.value)
  } else {
    map = toIntMap(outer)
  }

  return {
    requestId: toUint8Array(map.get(1)),
    signData: toUint8Array(map.get(2)),
    dataType: DATA_TYPE_MAP[map.get(3) as number] ?? 'legacy-tx',
    chainId: map.has(4) ? Number(map.get(4)) : undefined,
    derivationPath: decodeKeypathTag(map.get(5)),
    address: toOptUint8Array(map.get(6)),
    origin: map.has(7) ? String(map.get(7)) : undefined,
  }
}

export function encodeEthSignature(sig: EthSignature): string {
  const entries: Array<[Uint8Array, Uint8Array]> = [
    [cborUint(1), cborBytes(sig.requestId)],
    [cborUint(2), cborBytes(sig.signature)],
  ]
  if (sig.origin) entries.push([cborUint(3), cborText(sig.origin)])

  const cbor = cborTag(CBOR_TAGS.ETH_SIGNATURE, cborMap(entries))
  return encodeToUR(cbor, 'eth-signature')
}
