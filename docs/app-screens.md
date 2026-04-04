# App Screens

Individual screen specs live in [`docs/design/screens/`](./design/screens/).

## Screen Index

| Route ID | Description | File |
|----------|-------------|------|
| `welcome` | Entry point — create or import wallet | [welcome.md](./design/screens/welcome/) |
| `generate-mnemonic` | Display generated 12-word mnemonic | [generate-mnemonic.md](./design/screens/generate-mnemonic/) |
| `verify-mnemonic` | Confirm mnemonic by selecting words | [verify-mnemonic.md](./design/screens/verify-mnemonic/) |
| `set-pin` | Set 6-digit PIN (two-phase confirmation) | [set-pin.md](./design/screens/set-pin/) |
| `import-mnemonic` | Import existing BIP-39 mnemonic | [import-mnemonic.md](./design/screens/import-mnemonic/) |
| `wallet-manager` | Home — accounts by chain, connect OKX | [wallet-manager.md](./design/screens/wallet-manager/) |
| `settings` | App config, security, BLE name, about | [settings.md](./design/screens/settings/) |
| `pin-unlock` | Cold-start PIN gate | [pin-unlock.md](./design/screens/pin-unlock/) |
| `account-detail` | BLE control + activity log for an account | [account-detail.md](./design/screens/account-detail/) |
| `transaction-confirm` | Sign or reject incoming transaction | [transaction-confirm.md](./design/screens/transaction-confirm/) |

## Navigation Flow

```
welcome
 ├── generate-mnemonic → verify-mnemonic → set-pin → wallet-manager
 └── import-mnemonic  ──────────────────→ set-pin → wallet-manager

wallet-manager
 ├── account-detail → transaction-confirm → account-detail
 └── settings

[cold start with mnemonic] → pin-unlock → wallet-manager
```

## Component Overlays

| Component | Triggered From | File |
|-----------|---------------|------|
| Connect OKX Sheet | `wallet-manager` | [connect-okx-sheet.md](./design/screens/connect-okx-sheet/) |
