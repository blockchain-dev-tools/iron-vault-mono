# Screen: Welcome

**Route ID:** `welcome`

## Purpose
Entry point of the app. User decides whether to create a new wallet or import an existing one.

## Layout

```
┌─────────────────────────┐
│                         │
│                         │
│          🔒             │
│    OldPhone Wallet      │
│   把旧手机变成硬件钱包      │
│                         │
│  ┌───────────────────┐  │
│  │    创建新钱包       │  │  ← Primary (blue)
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │    导入已有钱包     │  │  ← Outline
│  └───────────────────┘  │
└─────────────────────────┘
```

## Navigation
- **创建新钱包** → `generate-mnemonic`
- **导入已有钱包** → `import-mnemonic`

## States
- Single static state (no loading, no error)
- No back navigation

## Notes
- No header / back button
- Large emoji icon as logo placeholder
- Bottom padding before buttons for thumb reach
