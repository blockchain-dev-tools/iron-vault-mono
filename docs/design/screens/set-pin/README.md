# Screen: Set PIN

**Route ID:** `set-pin`

## Purpose
Let the user choose a 6-digit PIN that will be required on every app launch.

## Layout

```
┌─────────────────────────┐
│ ‹  设置 PIN             │
│                         │
│   设置 6 位数字 PIN      │  ← Label (changes per phase)
│   每次打开 App 时需要输入  │
│                         │
│       ○ ○ ○ ○ ○ ○       │  ← PIN dots
│                         │
│   ┌───┐ ┌───┐ ┌───┐     │
│   │ 1 │ │ 2 │ │ 3 │     │
│   ├───┤ ├───┤ ├───┤     │
│   │ 4 │ │ 5 │ │ 6 │     │
│   ├───┤ ├───┤ ├───┤     │
│   │ 7 │ │ 8 │ │ 9 │     │
│   ├───┤ ├───┤ ├───┤     │
│   │   │ │ 0 │ │ ⌫ │     │
│   └───┘ └───┘ └───┘     │
└─────────────────────────┘
```

## PIN Dot States
| State | Fill | Border |
|-------|------|--------|
| Empty | none | `text2` |
| Filled | `primary` | `primary` |
| Error | `red` | `red` |

## Phases
1. **Phase 1** — Label: 设置 6 位数字 PIN / 每次打开 App 时需要输入
2. **Phase 2** — Label: 请再输入一次确认
3. **Error** — Label: 两次输入不一致，请重新设置 (red) → resets to Phase 1 after 800ms

## Navigation
- **Back** → previous screen
- **PIN confirmed** → `wallet-manager`

## Notes
- Numpad key size: 72×56px, border-radius 12px
- Empty cell (between 7 and DEL) has transparent background, no interaction
- Auto-submits after 6th digit (200ms delay)
