# Solana App APDU Reference

**CLA:** `0xE0`
**App selector:** `currentApp === 'Solana'` (set via `OPEN_APP "Solana"`)
**Key derivation:** SLIP-10 Ed25519 hardened path

## Command Table

| INS | Name | Notes |
|-----|------|-------|
| `0x01` | GET_APP_CONFIGURATION | Returns blind_sign + version (1.3.0) |
| `0x03` | SIGN_OFFLINE_MESSAGE | Same handler as SIGN_MESSAGE |
| `0x04` | SIGN_MESSAGE | Multi-chunk transaction signing |
| `0x05` | GET_PUBKEY | Returns raw 32-byte Ed25519 public key |
| `0x06` | SIGN_TRANSACTION | Same handler as SIGN_MESSAGE |
| `0x07` | GET_ADDRESS | Returns base58-encoded Solana address |
| `0x08` | GET_APP_CONFIGURATION_V2 | Stub, returns 9000 |

## Framing (P1 / P2)

| P1 | Meaning |
|----|---------|
| `0x01` | First chunk |
| other | Continuation chunk |

| P2 bit 0 | Meaning |
|----------|---------|
| `0` | Final chunk — sign now |
| `1` | More chunks follow — buffer only |

OKX Wallet may prepend a `0x01` num_signers byte before the BIP32 path on the first chunk. This is detected and stripped automatically.

## GET_PUBKEY (INS 0x05)

**Request data:** BIP32 path

**Response:**
```
pubKey (32 bytes) + 9000
```

## GET_ADDRESS (INS 0x07)

**Request data:** BIP32 path

**Response:**
```
addrLen (1) + addrBase58 + 9000
```

## SIGN_MESSAGE / SIGN_TRANSACTION / SIGN_OFFLINE_MESSAGE (INS 0x04/0x06/0x03)

**First chunk:** BIP32 path + first bytes of transaction

**Continuation:** raw bytes appended to buffer

**Final chunk response:**
```
signature (64 bytes Ed25519) + 9000
```

## Derivation Path

Default Solana path: `m/44'/501'/0'/0'/0'`

All components are hardened (SLIP-10 requirement for Ed25519). Unhardened Solana paths are also supported.

## Key Derivation Algorithm

SLIP-10 with Ed25519 curve — **not** standard BIP-32. Uses HMAC-SHA512 with master key `"ed25519 seed"`. All derivation steps must use hardened child key derivation.
