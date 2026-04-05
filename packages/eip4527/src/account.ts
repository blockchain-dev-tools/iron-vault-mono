import {
  CBOR_TAGS, encodeKeypathTag,
  cborTag, cborMap, cborUint, cborBytes, cborText, cborArray,
} from './cbor'
import { encodeToUR } from './ur'
import type { CryptoHDKey, CryptoAccount } from './types'

function encodeHDKeyBytes(key: CryptoHDKey): Uint8Array {
  const entries: Array<[Uint8Array, Uint8Array]> = [
    [cborUint(1), key.isMaster ? new Uint8Array([0xf5]) : new Uint8Array([0xf4])],
    [cborUint(2), key.isPrivateKey ? new Uint8Array([0xf5]) : new Uint8Array([0xf4])],
    [cborUint(3), cborBytes(key.keyData)],
  ]
  if (key.chainCode) {
    entries.push([cborUint(4), cborBytes(key.chainCode)])
  }
  if (key.useInfo) {
    const coinInfoInner = cborMap([
      [cborUint(1), cborUint(key.useInfo.type)],
      [cborUint(2), cborUint(key.useInfo.network)],
    ])
    entries.push([cborUint(5), cborTag(CBOR_TAGS.CRYPTO_COIN_INFO, coinInfoInner)])
  }
  if (key.origin) {
    entries.push([cborUint(6), encodeKeypathTag(key.origin.path)])
  }
  if (key.children) {
    entries.push([cborUint(7), encodeKeypathTag(key.children.path)])
  }
  if (key.parentFingerprint != null) {
    entries.push([cborUint(8), cborUint(key.parentFingerprint)])
  }
  if (key.name) {
    entries.push([cborUint(9), cborText(key.name)])
  }
  if (key.note) {
    entries.push([cborUint(10), cborText(key.note)])
  }
  return cborTag(CBOR_TAGS.CRYPTO_HDKEY, cborMap(entries))
}

export function encodeHDKey(key: CryptoHDKey): string {
  const cbor = encodeHDKeyBytes(key)
  return encodeToUR(cbor, 'crypto-hdkey')
}

export function encodeCryptoAccount(account: CryptoAccount): string {
  const descriptors = cborArray(account.outputDescriptors.map(encodeHDKeyBytes))
  const inner = cborMap([
    [cborUint(1), cborBytes(account.masterFingerprint)],
    [cborUint(2), descriptors],
  ])
  const cbor = cborTag(CBOR_TAGS.CRYPTO_ACCOUNT, inner)
  return encodeToUR(cbor, 'crypto-account')
}
