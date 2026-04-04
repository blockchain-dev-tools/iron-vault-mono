# Screen: Generate Mnemonic

**Route ID:** `generate-mnemonic`

## Purpose
Display the freshly generated 12-word BIP-39 mnemonic for the user to write down.

## Layout

```
┌─────────────────────────┐
│ ‹  备份助记词            │
│                         │
│ ⚠️  请在纸上抄写以下 12 个词  │  ← Warning banner (yellow text)
│    这是恢复钱包的唯一方式    │
│    切勿截图或发送给任何人    │
│                         │
│  ┌──────┐  ┌──────┐     │
│  │ 1 abandon│ 2 cherry │  │  ← 2-column word grid
│  ├──────┤  ├──────┤     │
│  │ 3 dial│  │ 4 eagle│  │
│  └──────┘  └──────┘     │
│   ... (12 words total)  │
│                         │
│  ┌───────────────────┐  │
│  │  我已抄写完成 →    │  │  ← Primary button
│  └───────────────────┘  │
└─────────────────────────┘
```

## Word Chip
- Index number (gray, small) + word text (white, medium weight)
- Background: `card2`
- Grid: 2 columns, gap 10px

## Navigation
- **Back** → `welcome`
- **我已抄写完成** → `verify-mnemonic`

## Notes
- Words are generated fresh each time this screen is shown
- User cannot edit or copy words from this view
- Warning banner is always visible (not dismissible)
