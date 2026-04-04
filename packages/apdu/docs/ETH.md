# Ethereum App APDU Reference

**CLA:** `0xE0`
**App name:** `Ethereum` (set via `OPEN_APP` or default)

## Command Table

| INS | Name | P1 | P2 | Notes |
|-----|------|----|----|-------|
| `0x02` | GET_ADDRESS | display | chain_id | Returns pubkey + address |
| `0x04` | SIGN_TRANSACTION | chunk | 0x00 | Multi-chunk, P1=0x00 first, P1=0x80 more |
| `0x06` | GET_APP_CONFIGURATION | 0x00 | 0x00 | Returns blind_sign + version |
| `0x08` | SIGN_PERSONAL_MESSAGE | chunk | 0x00 | EIP-191 |
| `0x0C` | GET_ETH2_PUBLIC_KEY | 0x00 | 0x00 | Stub, returns 9000 |
| `0x0E` | SET_ETH2_WITHDRAWAL_INDEX | 0x00 | 0x00 | Stub, returns 9000 |
| `0x16` | PROVIDE_ERC20_TOKEN_INFO | 0x00 | 0x00 | Caches token name/ticker/decimals |
| `0x18` | SIGN_EIP_712_MESSAGE | chunk | 0x00 | EIP-712 typed data |
| `0x1A` | GET_APP_CONFIGURATION (v2) | 0x00 | 0x00 | Alias for 0x06 |
| `0x1C` | PROVIDE_NFT_INFO | 0x00 | 0x00 | Caches NFT collection name |
| `0x1E` | SET_PLUGIN | 0x00 | 0x00 | Stub, returns 9000 |
| `0x20` | PROVIDE_TRUSTED_NAME | 0x00 | 0x00 | Caches ENS domain name |
| `0x22` | GET_CHALLENGE | 0x00 | 0x00 | Returns 4-byte random nonce |
| `0x24` | SIGN_ETH_TX_GENERIC | chunk | 0x00 | Same as SIGN_TRANSACTION |
| `0x26` | SIGN_DELEGATED | chunk | 0x00 | Same as SIGN_TRANSACTION |
| `0x28` | PROVIDE_DOMAIN_SERVICE | 0x00 | 0x00 | Caches domain name |
| `0x2A` | SIGN_PERSONAL_MSG_GENERIC | chunk | 0x00 | Same as SIGN_PERSONAL_MESSAGE |

## GET_ADDRESS (INS 0x02)

**Request data:** BIP32 path (see parser.ts)

**Response:**
```
pubKeyLen (1) + pubKey (65, uncompressed) + addrLen (1) + addrAscii (42) + 9000
```

**Path example:** `m/44'/60'/0'/0/0`

## SIGN_TRANSACTION (INS 0x04)

**Multi-chunk protocol:**
- P1 = `0x00`: first (and possibly only) chunk — contains BIP32 path + start of RLP
- P1 = `0x80`: continuation chunk

**Response (final chunk only):**
```
v (1) + r (32) + s (32) + 9000
```

`v` is the recovery bit (0 or 1), **not** EIP-155-adjusted. Host applies chain-id adjustment.

## PROVIDE_ERC20_TOKEN_INFO (INS 0x16)

**Request data:**
```
ticker_len (1) + ticker_ascii + token_addr (20) + decimals (1) + chain_id (4)
```

Stored in `getLastToken()` for display in sign confirmation UI.

## SIGN_EIP_712_MESSAGE (INS 0x18)

**Request data:** BIP32 path + 32-byte domain_sep + 32-byte struct_hash

**Response:** Same as SIGN_TRANSACTION: `v (1) + r (32) + s (32) + 9000`
