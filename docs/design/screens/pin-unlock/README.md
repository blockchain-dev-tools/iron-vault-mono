# Screen: PIN Unlock

**Route ID:** `pin-unlock`

## Purpose
Gate screen shown on cold start when a mnemonic already exists. Requires PIN to access the wallet.

## Layout

```
┌─────────────────────────┐
│                         │
│          🔒             │
│     OldPhone Wallet     │
│       请输入 PIN         │
│                         │
│       ○ ○ ○ ○ ○ ○       │  ← PIN dots
│                         │
│   ┌───┐ ┌───┐ ┌───┐     │
│   │ 1 │ │ 2 │ │ 3 │     │
│   │ 4 │ │ 5 │ │ 6 │     │
│   │ 7 │ │ 8 │ │ 9 │     │
│   │   │ │ 0 │ │ ⌫ │     │
│   └───┘ └───┘ └───┘     │
│                         │
│  连续错误 5 次将锁定 30 分钟│  ← Warning text (bottom)
└─────────────────────────┘
```

## Behavior
- No back navigation (user must enter PIN or force-close)
- Wrong PIN: dots flash red, reset
- 5 consecutive wrong PINs: lock for 30 minutes
- Correct PIN → `wallet-manager`

## Differences from `set-pin`
- No header / back button
- No phase 2 (confirmation step)
- Shows lockout warning at bottom
