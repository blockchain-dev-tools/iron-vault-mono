# App Screens

Individual screen specs live in [`docs/design/screens/`](./design/screens/).

## Screen Index

| Screen | Purpose | Design Spec |
|--------|---------|-------------|
| `Welcome` | Entry point — create / import / Enigma wallet | [welcome/](./design/screens/welcome/) |
| `Entropy` | Collect 200 touch-point randomness → SHA-256 → mnemonic | — |
| `GenerateMnemonic` | Display 12/24-word mnemonic; BIP-39 language picker; optional passphrase | [generate-mnemonic/](./design/screens/generate-mnemonic/) |
| `VerifyMnemonic` | Quiz words at positions 3, 7, 11 (4-choice each) | [verify-mnemonic/](./design/screens/verify-mnemonic/) |
| `ImportMnemonic` | Free-text BIP-39 import with live word autocomplete | [import-mnemonic/](./design/screens/import-mnemonic/) |
| `Enigma` | Deterministic wallet: riddle text + salt → 24-word mnemonic | — |
| `EnigmaMnemonic` | Shows Enigma-derived mnemonic; skips verify quiz | — |
| `SetPin` | Two-phase 6-digit PIN setup; doubles as Change PIN | [set-pin/](./design/screens/set-pin/) |
| `Vault` | 5 chain sections (ETH, SOL, BTC, Tron, Sui); BLE connect sheet | [wallet-manager/](./design/screens/wallet-manager/) |
| `AccountDetail` | Address QR, derivation path, BLE toggle, log viewer | [account-detail/](./design/screens/account-detail/) |
| `Transaction` | Sign approval: network / action / from / to / amount / gas | [transaction-confirm/](./design/screens/transaction-confirm/) |
| `Settings` | Appearance, language, security, BLE device name, app version | [settings/](./design/screens/settings/) |
| `Unlock` | Cold-start PIN gate; max 5 attempts then lockout | [pin-unlock/](./design/screens/pin-unlock/) |
| `BackupSeed` | PIN-gated seed reveal; language re-encoding | — |

## Navigation Flow

```
Welcome
 ├── Entropy → GenerateMnemonic → VerifyMnemonic → SetPin → Vault
 ├── Enigma  → EnigmaMnemonic  ──────────────────→ SetPin → Vault
 └── ImportMnemonic ───────────────────────────────SetPin → Vault

[cold start with wallet] → Unlock → Vault

Vault ↔ Settings → BackupSeed
Vault → AccountDetail → Transaction → AccountDetail
```

**Navigation rules:**
- Auth success → `reset('Vault')` — never `go('Vault')`
- Reset wallet → `reset('Welcome')`
- Back buttons → `goBack()` — never `go('Vault')`

## Component Overlays

| Component | Triggered From |
|-----------|---------------|
| Connect OKX Sheet | `Vault` | [connect-okx-sheet/](./design/screens/connect-okx-sheet/) |
