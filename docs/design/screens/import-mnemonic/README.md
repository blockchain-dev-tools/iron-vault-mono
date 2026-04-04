# Screen: Import Mnemonic

**Route ID:** `import-mnemonic`

## Purpose
Allow users with an existing BIP-39 mnemonic to import their wallet.

## Layout

```
┌─────────────────────────┐
│ ‹  导入钱包              │
│                         │
│  输入 12 个助记词（空格分隔）│
│                         │
│  ┌───────────────────┐  │
│  │ abandon cherry    │  │  ← Textarea (monospace)
│  │ dial eagle ...    │  │
│  └───────────────────┘  │
│  ✓ 助记词有效            │  ← Validation message (green/red)
│                         │
│  派生的地址预览：          │  ← Shown only when valid
│  ETH  0x9858...edA94   │
│  SOL  FVjy...3kXp      │
│                         │
│  ┌───────────────────┐  │
│  │     确认导入       │  │  ← Disabled until valid
│  └───────────────────┘  │
│  ⚠️ 请确认以上地址是您的   │
└─────────────────────────┘
```

## Validation States
| Words | Message | Color |
|-------|---------|-------|
| 0 | (empty) | — |
| 1–11 | 已输入 N/12 词 | red |
| 12 | ✓ 助记词有效 | green |
| 13+ | 词数超过 12 个 | red |

## Navigation
- **Back** → `welcome`
- **确认导入** (only when valid) → `set-pin`

## Notes
- Textarea border highlights blue on focus (`primary`)
- Address preview only appears when mnemonic is valid (12 words)
- Real implementation would validate against BIP-39 wordlist
