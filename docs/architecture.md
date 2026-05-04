# System Architecture

## Overview

Iron Vault simulates a Ledger hardware wallet on an Android phone. The device acts as a BLE peripheral exposing the same GATT profile as a physical Ledger Nano X. Host software (OKX Wallet, MetaMask, Ledger Live) connects over BLE and sends APDU commands; the phone responds with derived keys and signed transactions.

```
┌─────────────────────────────────────────────────────┐
│                    Host Side                         │
│  OKX Wallet / MetaMask / Phantom / Ledger Live       │
└──────────────────────┬──────────────────────────────┘
                       │ BLE (GATT)
                       │ Service UUID: 13d63400-2c97-0004-0000-4c6564676572
                       │
┌──────────────────────▼──────────────────────────────┐
│                  Android / iOS Phone                 │
│  apps/mobile (React Native 0.84)                    │
│    ├── BLE Peripheral (Android GATT Server)         │
│    ├── APDU Handler  ← packages/apdu                │
│    └── Wallet Service ← packages/wallet             │
│         └── Crypto Backend ← packages/crypto        │
│              ├── BIP-32 / SLIP-10 HD Derivation     │
│              ├── secp256k1 (ETH, Tron)              │
│              ├── Ed25519 (Solana, Sui)              │
│              └── P2WPKH (Bitcoin)                   │
└─────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
iron-vault-mono/                    ← Turborepo monorepo root (pnpm workspaces)
├── apps/
│   ├── mobile/                 ← React Native 0.84 production app
│   ├── prototype/              ← Next.js 14 design canvas + logic test harness (port 3002)
│   └── website/                ← Marketing/docs site (Next.js SSG)
└── packages/
    ├── wallet/                 ← PIN auth, mnemonic lifecycle, WalletStorage interface
    ├── apdu/                   ← APDU encode/decode, BLE framing
    ├── crypto/                 ← HD key derivation, secp256k1/Ed25519 signing (pure)
    ├── theme/                  ← Shared design tokens (DARK/LIGHT ColorTokens, R radius)
    ├── i18n/                   ← Localization strings, t() and useI18n() hook
    ├── simulator/              ← Web-based Ledger device simulator component
    ├── airgap/                 ← Air-gap / QR-code transport layer
    ├── eip4527/                ← CBOR/UR encoding for QR wallet comms (EIP-4527)
    └── assets/                 ← Shared SVG/image assets
```

## Package Dependency Graph

```
@iron-vault/theme        (no deps)
@iron-vault/i18n         (no deps)
@iron-vault/assets       (no deps)

@iron-vault/crypto       (@noble/curves, @noble/hashes, @scure/bip32, @scure/bip39)

@iron-vault/eip4527      (CBOR encoding)
@iron-vault/airgap       (→ @iron-vault/eip4527)

@iron-vault/apdu         (→ @iron-vault/crypto)

@iron-vault/wallet       (→ @iron-vault/crypto, @noble/hashes)
                         Provides: WalletStorage interface, setupWallet,
                         unlockWallet, hasWallet, PIN hashing

@iron-vault/simulator    (→ @iron-vault/apdu, @iron-vault/crypto, @iron-vault/theme)

apps/prototype           (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme)
                         LocalStorageWalletStorage

apps/mobile              (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme,
                            @iron-vault/i18n, react-native-keychain)
                         SecureWalletStorage
```

## Layer Separation

| Layer | Package | Responsibility |
|-------|---------|----------------|
| UI / screens | `apps/prototype`, `apps/mobile` | Platform-specific rendering |
| Business logic | `packages/wallet` | PIN auth, mnemonic lifecycle, storage abstraction |
| Crypto primitives | `packages/crypto` | Stateless pure functions — HD derivation, signing |
| APDU protocol | `packages/apdu` | Ledger framing, command dispatch |
| BLE transport | Android/iOS native module | `BluetoothGattServer` Kotlin + Swift bridge |
| Air-gap transport | `packages/airgap` + `packages/eip4527` | QR-code CBOR/UR encoding |

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

Stored keys: `wallet.mnemonic` and `wallet.pinHash` (SHA-256 of PIN — never plaintext).

## Data Flow

### Setup Flow (new wallet)
```
Welcome → generateMnemonic() [packages/wallet]
  → show 12/24 words (GenerateMnemonic)
  → verify quiz (VerifyMnemonic)
  → SetPin: setupWallet(storage, mnemonic, pin)
       ├── stores sha256(pin) as wallet.pinHash
       ├── stores mnemonic as wallet.mnemonic
       └── returns WalletAccounts
  → reset('Vault')
```

### Unlock Flow (returning user)
```
App start → hasWallet(storage) → true
  → Unlock: unlockWallet(storage, enteredPin)
       ├── compares sha256(enteredPin) == stored pinHash
       ├── derives accounts from stored mnemonic
       └── returns WalletAccounts | null
  → reset('Vault')
```

### Sign Flow (BLE)
```
Host connects via BLE (GATT)
  → APDU: GET_VERSION → firmware info
  → APDU: GET_APP_AND_VERSION → "Ethereum 1.10.4"
  → APDU: GET_ETH_ADDRESS (BIP-32 path) → public key + address
  → APDU: SIGN_ETH_TX (path + RLP-encoded tx)
       → deferred: setPendingTx() → navigate Transaction screen
       → user confirms → crypto sign → sendApduResponse(sig)
       → v(1) + r(32) + s(32) + 9000
```

## Multi-Chain Support

| Chain | Curve | Derivation | Address Format |
|-------|-------|------------|----------------|
| Ethereum | secp256k1 | BIP-32 `m/44'/60'/0'/0/n` | `0x` + 40 hex |
| Solana | Ed25519 | SLIP-10 `m/44'/501'/0'/0'` | base58 pubkey |
| Bitcoin | secp256k1 | BIP-32 `m/84'/0'/0'/0/n` | `bc1...` bech32 |
| Tron | secp256k1 | BIP-32 `m/44'/195'/0'/0/n` | `T...` base58check |
| Sui | Ed25519 | SLIP-10 `m/44'/784'/0'/0'/0'` | `0x` + 64 hex |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native 0.84.1, TypeScript, React 19 |
| Prototype | Next.js 14, Tailwind CSS |
| Crypto | `@noble/curves` v1.9, `@noble/hashes` v2, `@scure/bip32`, `@scure/bip39` |
| BLE (Android) | `BluetoothGattServer` via custom Kotlin native module |
| BLE (iOS) | `CBPeripheralManager` via Swift native module |
| Secure storage | `react-native-keychain` (mobile), `localStorage` (prototype) |
| Monorepo | Turborepo + pnpm workspaces (`node-linker=hoisted`) |
