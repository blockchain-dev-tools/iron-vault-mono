# Screen: Welcome

**Route ID:** `welcome`

## Purpose
Entry point of the app. User decides whether to create a new wallet or import an existing one.

## Layout

```
┌─────────────────────────┐
│                   🌓 EN │  ← theme toggle + language pill (top-right)
│                         │
│          🔒             │
│       Iron Vault        │
│   把旧手机变成硬件钱包      │
│                         │
│  ┌───────────────────┐  │
│  │    创建新钱包  →   │  │  ← Primary button
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  ↑ 导入已有钱包    │  │  ← Secondary button
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ ✓ AIR-GAPPED READY│  │  ← Security card
│  └───────────────────┘  │
└─────────────────────────┘
```

## Navigation
- **创建新钱包** → `GenerateMnemonic`
- **导入已有钱包** → `ImportMnemonic`

## Top Controls

Two controls are displayed in the top-right corner as a `flexDirection: 'row'` row:

### Theme Toggle Button
- A 32×32 icon button with the same pill style as the language toggle
- Icon changes to reflect the **current** `themeMode`:
  - `brightness-auto` (🌓) — `system` (follows device setting)
  - `light-mode` (☀️) — `light`
  - `dark-mode` (🌙) — `dark`
- Tap cycles through: **system → light → dark → system**
- Calls `setThemeMode()` from `useApp()`; change is persisted to AsyncStorage and reflected across all screens immediately
- Synced with the Auto/Light/Dark segmented control in SettingsScreen

### Language Toggle Pill
- Text pill cycling: **EN → 中文 → Auto → EN**
- Calls `setLocaleMode()` from `useApp()`

## States
- Single static state (no loading, no error)
- No back navigation

## Notes
- No header / back button
- All colors via `useTheme()` → `makeStyles(C)` factory — never hardcoded
- `themeMode` and `localeMode` are global state (AppContext); changes propagate to all screens
