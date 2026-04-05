import { decode } from 'cbor-x'
import { CBOR_TAGS, toUint8Array, isDecodedTag, cborTag, cborBytes } from '../cbor'
import { encodeToUR, decodeFromUR } from '../ur'
import type { BtcPsbt } from '../types'

export function decodeCryptoPsbt(urString: string): BtcPsbt {
  const { cbor, type } = decodeFromUR(urString)
  if (type !== 'crypto-psbt' && type !== 'psbt') {
    throw new Error(`Expected crypto-psbt or psbt, got ${type}`)
  }

  const outer = decode(Buffer.from(cbor))
  let psbtBytes: Uint8Array
  if (isDecodedTag(outer)) {
    psbtBytes = toUint8Array(outer.value)
  } else {
    psbtBytes = toUint8Array(outer)
  }

  return { psbtBytes }
}

export function encodePsbt(psbt: BtcPsbt, urType: 'crypto-psbt' | 'psbt' = 'crypto-psbt'): string {
  const cbor = cborTag(CBOR_TAGS.CRYPTO_PSBT, cborBytes(psbt.psbtBytes))
  return encodeToUR(cbor, urType)
}
