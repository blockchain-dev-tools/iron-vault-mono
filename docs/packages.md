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
interface Account {
  full:  string;  // full address string
  short: string;  // truncated: "0x1234...5678"
  path:  string;  // BIP-32 derivation path
}

interface WalletAccounts {
  eth:  Account[];  // m/44'/60'/0'/0/n
  sol:  Account[];  // m/44'/501'/0'/0'
  btc:  Account[];  // m/84'/0'/0'/0/n
  trx:  Account[];  // m/44'/195'/0'/0/n
  sui:  Account[];  // m/44'/784'/0'/0'/0'
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

const phrase   = generateMnemonic();      // 128-bit entropy, 12 words
const phrase24 = generateMnemonic(256);   // 256-bit entropy, 24 words

const ok   = validateMnemonic(phrase);    // → boolean
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
import { signEthTransaction, signSolanaMessage, ethPubKeyToAddress } from '@iron-vault/crypto';

const { address } = ethPubKeyToAddress(privKey);  // 40-char uppercase hex

// Returns: v(1) + r(32) + s(32) + SW(2=9000)
const response = signEthTransaction(privKey, rlpBytes);

// Returns: signature(64) + SW(2=9000)
const response = signSolanaMessage(privKey, messageBytes);
```

### Address Derivation (`address.ts`)

```typescript
import { deriveWalletAccounts } from '@iron-vault/crypto';

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
import { handleApdu, setCurrentApp, setSignRequestHandler, setLogFn, setMnemonicProvider } from '@iron-vault/apdu';

// Provide mnemonic for signing operations
setMnemonicProvider(() => currentMnemonic);

// Set active app context ("Ethereum" | "Solana" | "Bitcoin" | ...)
setCurrentApp('Ethereum');

// Register deferred sign callback (called when SIGN APDU arrives)
setSignRequestHandler(async (req) => {
  return new Promise((resolve) => {
    setPendingTx({ ...req, resolve: (sig) => resolve(sig), reject: () => resolve('6985') });
    go('Transaction');
  });
});

// Process incoming APDU hex string, returns response hex
const responseHex = await handleApdu(incomingHex);
```

### Supported Commands

| CLA | INS | Command | Description |
|-----|-----|---------|-------------|
| `E0` | `01` | GET_VERSION | Returns firmware version |
| `B0` | `01` | GET_APP_AND_VERSION | Returns current app name + version |
| `E0` | `02` | GET_ETH_ADDRESS | Returns public key + address for BIP-32 path |
| `E0` | `04` | SIGN_ETH_TX | Signs RLP-encoded Ethereum transaction |
| `E0` | `05` | GET_SOL_PUBKEY | Returns Ed25519 public key for path |
| `E0` | `06` | SIGN_SOL_MSG | Signs Solana transaction message |

---

## @iron-vault/theme

Design tokens for React Native screens.

```typescript
import { DARK, LIGHT, C, R } from '@iron-vault/theme';
// C = DARK (backward-compatible default)
```

In React Native components:
```tsx
const C = useTheme();                           // returns DARK or LIGHT ColorTokens
const s = useMemo(() => makeStyles(C), [C]);    // always memoize
```

### Color Tokens

#### DARK

```
C.primary             '#8FC322'  — lime green CTA / accent
C.onPrimary           '#0D1A00'
C.bg                  '#0F0F0F'  — screen background
C.surface             '#1A1A1A'  — cards, sheets
C.surfaceContainer    '#242424'  — elevated container
C.surfaceContainerLow '#1E1E1E'  — subtle recessed surface
C.text                '#F0F0F0'  — primary text
C.text2               '#9AA0A6'  — secondary text
C.textDisabled        '#555555'
C.border              '#2A2A2A'
C.borderVariant       '#333333'
C.error               '#CF6679'
C.errorContainer      rgba(207,102,121,0.12)
C.primary8            rgba(143,195,34,0.08)   — tinted backgrounds
C.primary12           rgba(143,195,34,0.12)
C.primary15           rgba(143,195,34,0.15)
C.primary25           rgba(143,195,34,0.25)
```

#### LIGHT

```
C.primary             '#5f8a0e'
C.onPrimary           '#F3F7E6'
C.bg                  '#FFFFFF'
C.surface             '#FFFFFF'
C.surfaceContainer    '#F5F5F5'
C.surfaceContainerLow '#FAFAFA'
C.text                '#1A2200'
C.text2               '#5A6640'
C.textDisabled        '#9AA88A'
C.border              '#C8D8A0'
C.borderVariant       '#D0DDB8'
```

### Radius Tokens (`R`)

```
R.sm   6    R.lg  12    R.xl  18
```
