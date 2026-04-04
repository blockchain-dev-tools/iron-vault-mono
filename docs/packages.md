# Shared Packages

## @iron-vault/wallet

Business logic layer. Platform-agnostic — works in both browser and React Native via the `WalletStorage` interface.

### WalletStorage Interface

```typescript
interface WalletStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

### Service Functions

```typescript
import {
  hasWallet, setupWallet, unlockWallet,
  verifyPin, getAccounts, clearWallet,
  generateMnemonic, validateMnemonic,
} from '@iron-vault/wallet';

// Check if a wallet is already set up
const exists = await hasWallet(storage);  // → boolean

// First-time setup: store mnemonic + hashed PIN, return derived accounts
const accounts = await setupWallet(storage, mnemonic, pin);  // → WalletAccounts

// Unlock: verify PIN hash and derive accounts (null = wrong PIN)
const accounts = await unlockWallet(storage, pin);  // → WalletAccounts | null

// Just check PIN without returning accounts
const ok = await verifyPin(storage, pin);  // → boolean

// Derive accounts from stored mnemonic (after unlock, no PIN needed)
const accounts = await getAccounts(storage);  // → WalletAccounts | null

// Wipe wallet (remove mnemonic + PIN hash)
await clearWallet(storage);
```

### PIN Security

The PIN is **never stored in plaintext**. `setupWallet` stores `bytesToHex(sha256(pin))` as `wallet.pinHash`. `unlockWallet` and `verifyPin` hash the input before comparison.

### WalletAccounts Type

```typescript
// Re-exported from @iron-vault/crypto
interface Account {
  full: string;   // full address string
  short: string;  // truncated: "0x1234...5678"
  path: string;   // BIP-32 derivation path
}

interface WalletAccounts {
  eth: Account[];  // 2 accounts: m/44'/60'/0'/0/0, .../0/1
  sol: Account[];  // 1 account:  m/44'/501'/0'/0'
}
```

### Storage Implementations

| App | Class | File | Backend |
|-----|-------|------|---------|
| `apps/prototype` | `LocalStorageWalletStorage` | `lib/storage.ts` | Browser `localStorage` |
| `apps/mobile` | `SecureWalletStorage` | `src/lib/storage.ts` | `react-native-keychain` |

---

## @iron-vault/crypto

Pure cryptographic primitives. **No platform dependencies** (no React Native, no browser APIs).

### Mnemonic (`mnemonic.ts`)

```typescript
import { generateMnemonic, validateMnemonic, mnemonicToSeed } from '@iron-vault/crypto';

// Generate a random 12-word BIP-39 mnemonic
const phrase = generateMnemonic();        // 128-bit entropy
const phrase24 = generateMnemonic(256);   // 256-bit entropy (24 words)

// Validate user input
const ok = validateMnemonic(phrase);      // → boolean

// Derive master seed bytes (async, applies PBKDF2)
const seed = await mnemonicToSeed(phrase);  // → Uint8Array (64 bytes)
```

### HD Key Derivation (`hdkey.ts`)

```typescript
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from '@iron-vault/crypto';

// BIP-32 Ethereum key (path as numeric component array)
const privKey = deriveEthPrivateKey(seed, [0x8000002c, 0x8000003c, 0x80000000, 0, 0]);

// SLIP-10 Ed25519 Solana key (all components must be hardened)
const privKey = deriveSolanaPrivateKey(seed, [0x8000002c, 0x800001f5, 0x80000000, 0x80000000]);
```

### Signing (`signer.ts`)

```typescript
import { signEthTransaction, signSolanaMessage, ethPubKeyToAddress, solanaPubKey } from '@iron-vault/crypto';

// Derive Ethereum address from private key
const { address } = ethPubKeyToAddress(privKey);  // address = 40-char uppercase hex

// Sign Ethereum RLP-encoded transaction
// Returns: v(1) + r(32) + s(32) + SW(2=9000)
const response = signEthTransaction(privKey, rlpBytes);

// Sign Solana message (Ed25519)
// Returns: signature(64) + SW(2=9000)
const response = signSolanaMessage(privKey, messageBytes);
```

### Address Derivation (`address.ts`)

```typescript
import { deriveWalletAccounts } from '@iron-vault/crypto';
import type { WalletAccounts } from '@iron-vault/crypto';

// Derives 2 ETH + 1 SOL account from a mnemonic phrase
const accounts = await deriveWalletAccounts(mnemonic);
// accounts.eth[0].full  → "0xABCDEF..."
// accounts.eth[0].short → "0xABCD...CDEF"
// accounts.eth[0].path  → "m/44'/60'/0'/0/0"
// accounts.sol[0].full  → base58 public key
```

---

## @iron-vault/apdu

APDU command parsing and response building for the Ledger BLE protocol.

### Handler

```typescript
import { handleApdu, setCurrentApp, setSignRequestHandler, setLogFn } from '@iron-vault/apdu';

// Set active app context ("Ethereum" | "Solana")
setCurrentApp('Ethereum');

// Register sign callback (called when SIGN_ETH_TX APDU arrives)
setSignRequestHandler(async (req) => {
  // req.chain, req.rawHex, req.decoded, req.sign
  return req.sign();  // returns hex signature string
});

// Process incoming APDU hex string, returns response hex
const responseHex = await handleApdu(incomingHex);
```

### Supported Commands (Ethereum App)

| INS | Command | Description |
|-----|---------|-------------|
| `0x01` | GET_VERSION | Returns firmware version |
| `0x01` (CLA=B0) | GET_APP_AND_VERSION | Returns "Ethereum 1.10.4" |
| `0x02` | GET_ETH_ADDRESS | Returns public key + address for path |
| `0x04` | SIGN_ETH_TX | Signs RLP-encoded transaction |

### Supported Commands (Solana App)

| INS | Command | Description |
|-----|---------|-------------|
| `0x05` | GET_PUBKEY | Returns Ed25519 public key for path |
| `0x06` | SIGN_MESSAGE | Signs transaction message |

---

## @iron-vault/theme

Design tokens for React Native screens.

```typescript
import { C, R } from '@iron-vault/theme';
```

### Color Tokens (`C`)

```
C.bg               '#121212'  — dark background
C.surface          '#1A1A1A'  — card/sheet surface
C.surfaceContainer '#222222'  — elevated container
C.surfaceContainerHigh '#2A2A2A'
C.surfaceContainerLow  '#181818'
C.border           '#2A2A2A'
C.borderVariant    '#333333'
C.primary          '#8FC322'  — lime green accent
C.onPrimary        '#0A1200'
C.error            '#CF6679'
C.text             '#FFFFFF'
C.text2            '#9AA0A6'  — secondary text
C.textDisabled     '#555555'
```

### Radius Tokens (`R`)

```
R.sm   8    R.lg  16
R.md  12    R.xl  20
```
