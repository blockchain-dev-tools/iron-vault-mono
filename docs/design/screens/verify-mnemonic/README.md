# Screen: Verify Mnemonic

**Route ID:** `verify-mnemonic`

## Purpose
Confirm the user has correctly recorded their mnemonic by asking them to identify 3 specific words by position.

## Layout

```
┌─────────────────────────┐
│ ‹  验证助记词            │
│                         │
│ 请选择第 3 个词           │
│  ┌──────┐  ┌──────┐     │
│  │cherry│  │ dial │     │
│  ├──────┤  ├──────┤     │
│  │fabric│  │galaxy│     │
│  └──────┘  └──────┘     │
│                         │
│ 请选择第 7 个词           │
│  [4 option buttons]     │
│                         │
│ 请选择第 11 个词          │
│  [4 option buttons]     │
│                         │
│  跳过验证（不推荐）         │  ← underlined text link
└─────────────────────────┘
```

## Option Button States
| State | Border | Background |
|-------|--------|-----------|
| Default | transparent | `card2` |
| Correct | `green` | `green/15` |
| Wrong | `red` | `red/15` |

## Behavior
- 3 groups, positions: 3rd, 7th, 11th word (0-indexed: 2, 6, 10)
- Each group shows 4 options: 1 correct + 3 random distractors
- Options are shuffled randomly
- Once correct is chosen, the button locks (cannot unselect)
- Wrong answers show red briefly, then allow retry
- After all 3 correct: auto-navigate after 400ms

## Navigation
- **Back** → `generate-mnemonic`
- **All correct** → `set-pin` (auto, 400ms delay)
- **跳过验证** → `set-pin`
