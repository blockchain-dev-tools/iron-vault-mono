# Iron Vault — Design Specification

This file is the design context for AI coding assistants. It defines brand, audience, visual
direction, and token reference for both platforms in this monorepo.

---

## Product Identity

**Iron Vault** — implements the Ledger Nano X BLE/APDU protocol on Android, making a phone
act as a hardware wallet compatible with Ledger-enabled host apps.

**Symbol**: The shield logo — cold storage, protection, custody.
**Brand color**: `#8FC322` (dark) / `#5f8a0e` (light) — hardware wallet green, distinctive,
adjacent to Ledger's visual language without copying it.

---

## Target Audience

- **Primary (simulator)**: Developers integrating Ledger BLE into host apps. They embed the
  simulator in dev tools, design canvases, and test harnesses. Seen on desktop.
- **Primary (mobile)**: Crypto-native users who understand seed phrases, derivation paths,
  and cold storage. Not general consumers.
- **Assumption**: Users have baseline crypto literacy. No need to explain what a private key is.

---

## Usage Context

- **Mobile app**: Focused sessions. Users handle private keys deliberately — not while
  commuting or multitasking. Often in a quiet, intentional moment.
- **Simulator**: Side-by-side with other developer tools on a large screen. Must render
  crisply at the 390px phone-frame width and look professional in a demo context.

---

## Visual Direction

**Tone**: Precision instrument. Closer to a Ledger device interface or a well-designed
terminal than a consumer fintech app.

**Theme**: Dark-first. Pure `#000000` background in dark mode — not `#111`, not `#1a1a1a`.
The surface hierarchy (`surface`, `surface-container`, etc.) creates depth above that floor.

**Feel**: Minimal, intentional, trustworthy. Decorative elements only when they reinforce
the brand (e.g. the subtle 45° grid pattern on the welcome screen). No flourish for its
own sake.

**What this is NOT**:
- Not a DeFi trading app (no neon accents, no purple gradients)
- Not a consumer banking app (no friendly rounded cards with pastel fills)
- Not a SaaS dashboard (no hero metrics, no sparklines)

---

## Design Tokens

### Full Token Reference

| Token                    | Dark      | Light     | Usage                              |
|--------------------------|-----------|-----------|------------------------------------|
| `primary`                | `#8FC322` | `#5f8a0e` | CTAs, active states, brand accent  |
| `on-primary`             | `#1d2900` | `#FFFFFF` | Text/icons on primary bg           |
| `background`             | `#000000` | `#FFFFFF` | Screen backgrounds                 |
| `surface`                | `#1A1A1A` | `#FAFDF2` | Cards, panels, bottom sheets       |
| `surface-container`      | `#1A1919` | `#E9EED8` | Input backgrounds, chips           |
| `surface-container-low`  | `#131313` | `#F0F4E3` | Subtle recessed surfaces           |
| `surface-container-high` | `#262626` | `#DDE5C5` | Elevated / hover surfaces          |
| `on-surface`             | `#FFFFFF` | `#0A0A0A` | Primary text                       |
| `on-surface-variant`     | `#999999` | `#555555` | Secondary text, labels, hints      |
| `outline`                | `#333333` | `#CCCCCC` | Borders, dividers                  |
| `outline-variant`        | `#494847` | `#BBBBBA` | Subtle borders, inactive states    |
| `error`                  | `#ff7351` | `#CC3300` | Error text, destructive actions    |
| `error-container`        | `#b92902` | `#FFE0D6` | Error state backgrounds            |

### Platform Access

**Web (simulator)** — CSS variables:
```css
var(--c-primary)
var(--c-background)
var(--c-surface)
var(--c-surface-container)
var(--c-surface-container-low)
var(--c-surface-container-high)
var(--c-on-surface)
var(--c-on-surface-variant)
var(--c-outline)
var(--c-outline-variant)
var(--c-error)
var(--c-error-container)
```

**React Native (mobile)** — ColorTokens object:
```tsx
const C = useTheme();   // returns DARK or LIGHT ColorTokens
// Access: C.primary, C.bg, C.surface, C.onSurface, C.onSurfaceVariant,
//         C.outline, C.outlineVariant, C.error, C.errorContainer
```

---

## Typography

- **Mobile**: System font (RN default). No external fonts.
- **Simulator**: Currently no custom font loaded. If adding, prefer a technical grotesque
  that reads well at small sizes (the phone frame is 390px wide). Avoid Inter — too generic.
- **Hierarchy**: Always maintain ≥1.25× size ratio between adjacent levels.
- **Body text**: Max ~65ch line length.

---

## Spacing Scale

4pt base. Use these values — no arbitrary numbers:

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

**Web**: Tailwind spacing utilities map to this (p-1=4, p-2=8, p-3=12, p-4=16, p-6=24...).
**RN**: Use these values directly in StyleSheet.

---

## Icon System

- **Source**: Material Symbols Outlined
- **Web**: `<span className="material-symbols-outlined">icon_name</span>`
- **RN**: `<Icon name="icon-name" />` — hyphens, auto-normalizes underscores.
  `mci:` prefix for MaterialCommunityIcons (e.g. `mci:wallet-outline`)

---

## Component Conventions

### Simulator (web)
- **Styling pattern**: Tailwind utilities for layout/spacing + CSS variable inline styles
  for colors. Example:
  ```tsx
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
       style={{ background: 'var(--c-surface)', borderColor: 'var(--c-outline)' }}>
  ```
- **Never hardcode hex colors** — always `var(--c-*)`.
- Screens live in `src/components/screens/`, shared UI in `src/components/ui/`.

### Mobile (React Native)
- `const C = useTheme()` at component top
- `const s = useMemo(() => makeStyles(C), [C])` — always memoize
- **Never hardcode colors** — always use `C.*` tokens
- Screen navigation: `go()` push, `goBack()` pop, `reset()` replace stack
