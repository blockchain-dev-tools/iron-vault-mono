# Iron Vault

Turn an old Android or iOS device into a self-custodial cold wallet — fully compatible with OKX Wallet, MetaMask, and Ledger Live over Bluetooth.

**English** · [中文](./README.zh-CN.md)

Iron Vault emulates a Ledger Nano X: the device exposes the same BLE GATT profile and responds to APDU commands with cryptographically derived keys and signatures. From the host app's perspective, it looks and behaves exactly like real hardware.

> **Status:** Active development. Core wallet logic, crypto primitives, APDU handler, and mobile UI are implemented. BLE peripheral integration is in progress.

---

## Why Iron Vault?

| | Iron Vault | AirGap Vault | Ledger Hardware |
|--|-----------|--------------|-----------------|
| Compatible wallets | All Ledger-compatible | AirGap only | All Ledger-compatible |
| Solana support | ✅ | ❌ | ✅ ($79+) |
| Cost | Free (use your old phone) | Free | $79–$149 |
| Connection | BLE (no cables) | QR code | USB / BLE |
| Open source | ✅ | ✅ | ❌ |

## Supported Wallets

Works with any wallet that supports Ledger hardware:

**MetaMask** · **OKX Wallet** · **Phantom** · **Rabby** · **Backpack** · **Ledger Live** · and any other Ledger-compatible wallet

## Quick Install

Download the latest APK from [GitHub Releases](../../releases) and install directly on your Android device (no build required).

> iOS requires building from source — see [Mobile App](#mobile-app-appsmobile) below.

---

## How It Works

```
┌─────────────────────────────────────────────┐
│              Host (your computer/phone)      │
│   OKX Wallet · MetaMask · Ledger Live        │
└──────────────────────┬──────────────────────┘
                       │ BLE (GATT)
                       │ UUID: 13d63400-2c97-0004-0000-4c6564676572
┌──────────────────────▼──────────────────────┐
│           Android / iOS (Iron Vault)         │
│  ┌─────────────────────────────────────────┐ │
│  │  React Native App  (apps/mobile)        │ │
│  │  ┌──────────┐  ┌────────┐  ┌─────────┐ │ │
│  │  │  BLE     │  │  APDU  │  │ Wallet  │ │ │
│  │  │ GATT     │→ │ Handler│→ │ Service │ │ │
│  │  │ Server   │  │        │  │         │ │ │
│  │  └──────────┘  └────────┘  └────┬────┘ │ │
│  └───────────────────────────────── │ ─────┘ │
│                                     ▼         │
│            Crypto Backend  (packages/crypto)  │
│            BIP-32 · SLIP-10 · secp256k1       │
│            Ed25519 · BIP-39 mnemonic          │
└─────────────────────────────────────────────┘
```

The phone never exposes your private key over BLE. All signing happens on-device; only the signature is returned to the host.

---

## Repository Structure

```
iron-vault-mono/
├── apps/
│   ├── mobile/          # React Native production app
│   ├── prototype/       # Next.js design canvas & logic test harness (port 3002)
│   └── website/         # Next.js SSG docs site + APDU debugger (port 3003)
└── packages/
    ├── wallet/          # Business logic: PIN auth, mnemonic lifecycle, storage interface
    ├── crypto/          # Pure crypto: HD derivation, signing, BIP-39 (no platform deps)
    ├── apdu/            # Ledger APDU framing, command dispatch
    ├── simulator/       # Ledger device simulator for testing
    └── theme/           # Shared design tokens (colors, radii)
```

### Package Dependency Graph

```
@iron-vault/theme        ← no dependencies

@iron-vault/crypto       ← @noble/curves, @noble/hashes, @scure/bip32, @scure/bip39

@iron-vault/apdu         ← @iron-vault/crypto

@iron-vault/wallet       ← @iron-vault/crypto, @noble/hashes

apps/prototype           ← @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme
apps/mobile              ← @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme
apps/website             ← @iron-vault/wallet, @iron-vault/apdu, @iron-vault/crypto, @iron-vault/simulator
```

---

## Development Setup

### Prerequisites

- Node.js ≥ 18, pnpm ≥ 9
- For `apps/mobile`: Android (SDK + Java 17) or iOS (Xcode 15+, physical device)

### Install

```bash
pnpm install
```

### Run in development

```bash
# All apps simultaneously
pnpm dev

# Individual apps
pnpm --filter prototype dev     # → http://localhost:3002
pnpm --filter website dev       # → http://localhost:3003 (docs + /debugger)
```

### Type-check

```bash
# Run from monorepo root
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
```

---

## Mobile App (apps/mobile)

**Stack:** React Native 0.84 · TypeScript · React 19

### Android — Build & install APK

```bash
cd apps/mobile/android
./gradlew assembleDebug  # ensure JAVA_HOME points to JDK 17
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### iOS — Build & run

```bash
cd apps/mobile
npx react-native run-ios --device
```

Or open `apps/mobile/ios/IronVault.xcworkspace` in Xcode and run on a connected device.

### Makefile (recommended, for monorepo dev)

From the project root on the **host machine** (requires `cs-agent.js`):

```bash
make metro          # Start Metro + ADB forwarding (auto-waits for ready)
make restart        # Restart Metro
make stop           # Stop Metro
make metro-log      # View Metro log
make metro-status   # Check if Metro is running
make build          # Build debug APK
make install        # Install APK to device
make app            # build + install
make launch         # Force-stop + reopen app
make dev            # metro + launch
make all            # build + install + metro + launch
```

### Start Metro bundler (manual)

```bash
cd apps/mobile
node node_modules/.bin/react-native start --no-interactive
```

> **Note:** Root `node_modules` must be in Metro watchFolders (`metro.config.js`) because pnpm hoists all deps to the monorepo root.

### ADB helpers

```bash
# Port forwarding (required after every adb daemon restart)
adb reverse tcp:8081 tcp:8081

# Launch / stop app
adb shell am start -n com.ironvault/.MainActivity
adb shell am force-stop com.ironvault
```
---

## Packages

### `@iron-vault/wallet`

Platform-agnostic business logic. Works in browser and React Native via a thin `WalletStorage` interface.

```typescript
import { hasWallet, setupWallet, unlockWallet, clearWallet } from '@iron-vault/wallet';

await hasWallet(storage);                        // → boolean
await setupWallet(storage, mnemonic, pin);       // → WalletAccounts
await unlockWallet(storage, pin);                // → { accounts, passphrase } | null  (null = wrong PIN)
await clearWallet(storage);                      // wipe wallet
```

The PIN is **never stored in plaintext** — only `sha256(pin)` is persisted.

### `@iron-vault/crypto`

Stateless, pure cryptographic primitives.

```typescript
import { generateMnemonic, deriveWalletAccounts } from '@iron-vault/crypto';

const mnemonic = generateMnemonic();             // 12-word BIP-39 phrase
const accounts = await deriveWalletAccounts(mnemonic);
// accounts.eth[0].full  → "0xABCD..."
// accounts.sol[0].full  → base58 public key
```

Supports: BIP-32 (Ethereum/secp256k1), SLIP-10 (Solana/Ed25519).

### `@iron-vault/apdu`

Ledger APDU command handler.

```typescript
import { handleApdu, setCurrentApp, setSignRequestHandler } from '@iron-vault/apdu';

setCurrentApp('Ethereum');
setSignRequestHandler(async (req) => req.sign());

const responseHex = await handleApdu(incomingHex);
```

Supported commands: `GET_VERSION`, `GET_APP_AND_VERSION`, `GET_ETH_ADDRESS`, `SIGN_ETH_TX`, `GET_PUBKEY` (Solana), `SIGN_MESSAGE` (Solana).

### `@iron-vault/theme`

Design tokens for React Native.

```typescript
import { DARK, LIGHT } from '@iron-vault/theme';
// DARK.primary → '#8FC322'  (lime green)
// LIGHT.primary → '#5f8a0e' (deep olive)
// DARK.bg → '#0F0F0F'
// R.md → 12  (C and R are legacy aliases, still available)
```

---

## Web Debugger (apps/website → /debugger)

The [apps/website](./apps/website) hosts an interactive APDU debugger at the `/debugger` route — a browser-based tool for testing APDU communication over BLE or against an in-browser wallet simulator.

- **Debugger panel** — send preset/manual APDU commands and inspect raw hex frames
- **Simulator panel** — embedded phone wallet simulator that visually processes APDU commands in real-time
- **BLE target** — connect to a real Iron Vault device via Web Bluetooth (Chrome/Edge)
- **Simulator target** — run the full APDU flow entirely in-browser without any hardware

Requires: `chrome://flags/#enable-experimental-web-platform-features` (for BLE mode)

---

## Security

- Private keys are derived on-device and never transmitted
- PIN is stored as `sha256(pin)` — never plaintext
- Mnemonic is stored via `react-native-keychain` (Android Keystore / iOS Secure Enclave) — the mnemonic itself is currently stored in plaintext within the secure store; PIN-based encryption at rest is a [known improvement item](./docs/todos/wallet-storage-improvement.md)
- This project is a personal security tool. Use it to understand cold wallet internals. Audit the code before trusting it with real funds

---

## Docs

| Document | Description |
|----------|-------------|
| [docs/architecture.md](./docs/architecture.md) | System overview, data flows, tech stack |
| [docs/packages.md](./docs/packages.md) | Shared package API reference |
| [docs/ble-protocol.md](./docs/ble-protocol.md) | BLE transport & APDU framing spec |
| [docs/app-screens.md](./docs/app-screens.md) | Mobile app screen flow |
| [docs/dev-guide.md](./docs/dev-guide.md) | Development setup & workflow |
| [docs/architecture/mobile.md](./docs/architecture/mobile.md) | React Native app architecture deep-dive |

---

## Contributing

Contributions are welcome! A few guidelines:

- **Bug reports & feature requests** — open a [GitHub Issue](../../issues)
- **Questions & discussion** — use [GitHub Discussions](../../discussions)
- **Pull requests** — please open an issue first to discuss the change; keep PRs focused on a single concern
- **Security issues** — do not open a public issue; email the maintainers directly

### Development workflow

1. Fork the repo and create a feature branch
2. `pnpm install` to set up dependencies
3. Make your changes; run `pnpm type-check` to verify
4. Open a PR with a clear description of what and why

---

## License

MIT
