# BTC / Tron / Sui App APDU Reference

---

## Bitcoin New App (CLA `0xE1` + CONTINUE `0xF8`)

**CLA:** `0xE1` for commands, `0xF8` for CONTINUE responses
**Key derivation:** BIP-32 secp256k1 (same HD path as Ethereum)

### Command Table

| CLA | INS | Name | Notes |
|-----|-----|------|-------|
| E1 | `0x00` | GET_EXTENDED_PUBKEY | Returns xpub string |
| E1 | `0x02` | REGISTER_WALLET | Returns wallet_id + HMAC |
| E1 | `0x03` | GET_WALLET_ADDRESS | Returns P2WPKH bech32 address |
| E1 | `0x04` | SIGN_PSBT | Initiates CONTINUE FSM |
| E1 | `0x05` | GET_MASTER_FINGERPRINT | Returns 4-byte fingerprint |
| E1 | `0x10` | SIGN_MESSAGE | BIP-322 message signing |
| F8 | `0x01` | CONTINUE | Host → device data continuation |

### CONTINUE FSM (SIGN_PSBT)

```
Host                          Device
  │── E1 04 (SIGN_PSBT) ──────▶│  Returns 0x61 NN <payload>
  │◀─ 0x61 04 40 00 00 00 ─────│  (CONTINUE, clientCmd=0x40 GET_PREIMAGE)
  │── F8 01 (CONTINUE + data) ─▶│
  │◀─ signature + 9000 ─────────│
```

Status word `0x61` = CONTINUE. The byte after `0x61` is the payload length. First payload byte is `clientCmd` (0x40 = GET_PREIMAGE, 0x00 = YIELD).

### GET_EXTENDED_PUBKEY (E1 00)

**Response:** `xpubLen (1) + xpubAsciiBytes + 9000`

### GET_WALLET_ADDRESS (E1 03)

**Request:** `display (1) + walletId (32) + change (1) + index (4 big-endian)`

**Address:** P2WPKH at `m/84'/0'/0'/{change}/{index}` → `bc1q...` bech32

**Response:** `addrLen (1) + addrAsciiBytes + 9000`

### SIGN_MESSAGE (E1 10)

Prefixes message with `\x18Bitcoin Signed Message:\n` + varint(len), double-SHA256, secp256k1 sign.

**Response:** `derLen (1) + DER-signature + 9000`

---

## Tron App (CLA `0x14`)

**CLA:** `0x14`
**Key derivation:** BIP-44 secp256k1 — path `m/44'/195'/0'/0/0`
**Address format:** Base58Check with `0x41` prefix → `T...`

### Command Table

| INS | Name | Notes |
|-----|------|-------|
| `0x01` | GET_APP_CONFIGURATION | Returns blind_sign + version (0.5.0) |
| `0x02` | GET_PUBLIC_KEY | Returns uncompressed pubkey + address |
| `0x04` | SIGN_TRANSACTION | SHA-256 hash → secp256k1 sign |
| `0x08` | SIGN_PERSONAL_MESSAGE | `\x19TRON Signed Message:\n` prefix + keccak256 |

### GET_PUBLIC_KEY (0x14 02)

**Response:**
```
0x41 (1) + uncompressedPubKey (65) + addrLen (1) + addrAscii (34) + 9000
```

### SIGN_TRANSACTION (0x14 04)

- P1 = `0x00`: first frame with BIP32 path + tx bytes
- P1 = `0x80`: continuation frame

**Signing:** `sha256(rawTxBytes)` → secp256k1 compact signature

**Response:** `r (32) + s (32) + v (1) + 9000` where v = recovery bit (0 or 1)

### SIGN_PERSONAL_MESSAGE (0x14 08)

**Request data:** BIP32 path + msgLen (4 big-endian) + msgBytes

**Prefix:** `\x19TRON Signed Message:\n{msgLen}`

**Hash:** `keccak256(prefix + msgBytes)`

**Response:** `r (32) + s (32) + v (1) + 9000` where v = recovery + 27

---

## Sui App (CLA `0x07`)

**CLA:** `0x07`
**Key derivation:** SLIP-10 Ed25519 (same algorithm as Solana)
**Default path:** `m/44'/784'/0'/0'/0'`

### Command Table

| INS | Name | Notes |
|-----|------|-------|
| `0x01` | GET_APP_CONFIGURATION | Returns blind_sign + version (1.0.0) |
| `0x02` | GET_PUBLIC_KEY | Returns 32-byte Ed25519 public key |
| `0x03` | SIGN_TRANSACTION | Signs raw Sui transaction bytes |
| `0x04` | SIGN_PERSONAL_MESSAGE | Signs personal messages |

### GET_PUBLIC_KEY (0x07 02)

**Response:** `pubKey (32 bytes) + 9000`

### SIGN_TRANSACTION / SIGN_PERSONAL_MESSAGE (0x07 03 / 0x07 04)

**Multi-frame protocol:**
- P1 = `0x00`: first frame with BIP32 path + message bytes
- P1 = `0x80`: continuation (more data)
- P1 = `0x90`: final continuation — triggers signing

**Response (on final frame):** `signature (64 bytes Ed25519) + 9000`

**Signing:** Ed25519 sign over raw message bytes (no hashing — Sui SDK handles pre-processing)
