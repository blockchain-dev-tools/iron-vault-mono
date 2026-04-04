# System Architecture

## Overview

BLE Vault simulates a Ledger hardware wallet on an old Android phone. The Android device acts as a BLE peripheral exposing the same GATT profile as a physical Ledger Nano X. Host software (OKX Wallet, MetaMask, Ledger Live) connects over BLE and sends APDU commands to which the phone responds with derived keys and signed transactions.

```
┌─────────────────────────────────────────────────────┐
│                    Host Side                         │
│  OKX Wallet / MetaMask / Ledger Live                │
│         │                                            │
│  web-debugger (Next.js) ◄── BLE APDU debugger       │
└──────────────┬──────────────────────────────────────┘
               │ BLE (GATT)
               │ Service UUID: 13d63400-2c97-0004-0000-4c6564676572
               │
┌──────────────▼──────────────────────────────────────┐
│                  Android Phone                       │
│  apps/mobile (React Native)                         │
│    ├── BLE Peripheral (Android GATT Server)         │
│    ├── APDU Handler  ← packages/apdu                │
│    └── Wallet Service ← packages/wallet             │
│         └── Crypto Backend ← packages/crypto        │
│              ├── BIP-32 / SLIP-10 HD Derivation     │
│              ├── secp256k1 (Ethereum)               │
│              └── Ed25519 (Solana)                   │
└─────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
iron-vault-mono/
├── apps/
│   ├── prototype/       # Next.js 14 design canvas + logic test harness (port 3002)
│   ├── mobile/          # React Native production wallet app
│   └── debugger/        # Next.js BLE APDU debugger (port 3001)
└── packages/
    ├── wallet/          # Business logic: PIN auth, mnemonic lifecycle, storage interface
    ├── crypto/          # Pure crypto: HD derivation, signing, mnemonic (no platform deps)
    ├── apdu/            # APDU framing, parsing, command handling
    └── theme/           # Shared design tokens (C, R)
```

## Package Dependency Graph

```
@iron-vault/theme        (no deps)

@iron-vault/crypto       (@noble/curves, @noble/hashes, @scure/bip32, @scure/bip39)

@iron-vault/apdu         (→ @iron-vault/crypto)

@iron-vault/wallet       (→ @iron-vault/crypto, @noble/hashes)
                        Provides: WalletStorage interface, setupWallet,
                        unlockWallet, hasWallet, PIN hashing

apps/prototype          (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme)
                        LocalStorageWalletStorage

apps/mobile             (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme,
                           react-native-keychain)
                        SecureWalletStorage
```

## Layer Separation

| Layer | Package | Responsibility |
|-------|---------|---------------|
| UI / screens | `apps/prototype`, `apps/mobile` | Platform-specific rendering |
| Business logic | `packages/wallet` | PIN auth, mnemonic lifecycle, storage abstraction |
| Crypto primitives | `packages/crypto` | Stateless, pure functions — HD derivation, signing |
| APDU protocol | `packages/apdu` | Ledger framing, command dispatch |
| BLE transport | Android native module | `BluetoothGattServer` Kotlin bridge |

## Storage Strategy

`packages/wallet` defines a minimal `WalletStorage` interface:

```typescript
interface WalletStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

Each app provides its own implementation:

| App | Class | Backend |
|-----|-------|---------|
| `apps/prototype` | `LocalStorageWalletStorage` | Browser `localStorage` |
| `apps/mobile` | `SecureWalletStorage` | `react-native-keychain` (WHEN_UNLOCKED) |

Stored keys: `wallet.mnemonic` (plaintext mnemonic) and `wallet.pinHash` (SHA-256 of PIN).
The PIN is **never stored in plaintext** — `setupWallet` and `unlockWallet` hash it before storage/comparison.

## Data Flow

### Setup Flow (new wallet)
```
P01 Welcome → generateMnemonic() [packages/wallet]
  → P02 show 12 words
  → P03 verify quiz
  → P04 SetPin: setupWallet(storage, mnemonic, pin)
       ├── stores sha256(pin) as wallet.pinHash
       ├── stores mnemonic as wallet.mnemonic
       └── returns deriveWalletAccounts(mnemonic)
  → P06 WalletManager (real ETH/SOL addresses)
```

### Unlock Flow (returning user)
```
App start → hasWallet(storage) → true
  → P09 PinUnlock: unlockWallet(storage, enteredPin)
       ├── compares sha256(enteredPin) == stored pinHash
       ├── derives accounts from stored mnemonic
       └── returns WalletAccounts | null
  → P06 WalletManager
```

### Import Flow
```
P05 ImportMnemonic: validateMnemonic(input)
  → store in generatedWords context
  → P04 SetPin: setupWallet(storage, importedMnemonic, pin)
  → P06 WalletManager
```

### Sign Flow (BLE)
```
Host connects via BLE (GATT)
  → APDU: GET_VERSION → firmware info
  → APDU: GET_APP_AND_VERSION → "Ethereum 1.10.4"
  → APDU: GET_ETH_ADDRESS (BIP-32 path) → public key + address
  → APDU: SIGN_ETH_TX (path + RLP-encoded tx) → v(1) + r(32) + s(32)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native 0.84 (TypeScript) |
| Prototype / debugger | Next.js 14, Tailwind CSS |
| Crypto | `@noble/curves` v1.9 (secp256k1, ed25519), `@noble/hashes` v2, `@scure/bip32`, `@scure/bip39` |
| HD Derivation | SLIP-10 for Ed25519 (Solana), BIP-32 for secp256k1 (Ethereum) |
| BLE (mobile) | Android `BluetoothGattServer` via custom Kotlin native module |
| BLE (web) | Web Bluetooth API (Chrome/Edge) |
| Secure storage | `react-native-keychain` (mobile), `localStorage` (prototype) |
| Monorepo | Turborepo + pnpm workspaces (`node-linker=hoisted`) |
