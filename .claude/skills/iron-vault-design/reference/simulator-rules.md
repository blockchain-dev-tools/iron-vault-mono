# Simulator (Web) Design Rules

Rules for `packages/simulator` — React 18 + TypeScript + Tailwind CSS + CSS variables.

## Styling Pattern

The simulator uses a **Tailwind + CSS variable hybrid**:
- **Tailwind utilities**: layout, spacing, flexbox, border-radius, transitions
- **CSS variables via inline style**: all colors

```tsx
// ✅ Correct pattern
<div
  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
  style={{
    background: 'var(--c-surface)',
    borderColor: 'var(--c-outline)',
    color: 'var(--c-on-surface)',
  }}
>
```

Never use Tailwind color utilities (`bg-gray-800`, `text-white`) — they bypass the theme
system and break light mode. Use `style={{ color: 'var(--c-on-surface)' }}` instead.

## Context: Phone Frame Constraints

The simulator renders inside a ~390px phone frame. Design for this context:
- No wide layouts — single column always
- Comfortable tap targets (min 44px height)
- Text must be legible at simulator's rendered size (often displayed at 0.7–0.8× scale)
- No hover-only interactions — simulator may be used on touch devices

## Typography in the Simulator

The simulator currently uses system fonts. When working on typography:
- Don't add Inter — it's the AI default and too generic for a precision instrument
- If adding a custom font, it must load via `@font-face` in `styles.css`
- Type scale: use Tailwind size utilities (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`)
  but ensure hierarchy has ≥1.25× contrast between adjacent levels

## Impeccable Skills — Direct Application

The simulator is a web React project. These impeccable commands apply directly:

| Command | When to use |
|---------|-------------|
| `/typeset` | Font choices look generic, hierarchy is flat |
| `/layout` | Spacing is monotonous, rhythm feels off |
| `/colorize` | UI feels gray, lacks warmth or brand presence |
| `/distill` | Screen feels cluttered, too many competing elements |
| `/polish` | Pre-ship final pass |
| `/audit` | Before refactoring, to understand what needs fixing |
| `/animate` | Adding screen transitions or state-change motion |

When using these commands on simulator files, the project already has design context in
`docs/design/spec.md` — no need to run `/impeccable teach`.

## Motion in the Simulator

Screen transitions use CSS animation classes applied to the screen wrapper:
- `.screen-enter-forward` — slide from right
- `.screen-enter-back` — slide from left
- `.screen-enter-reset` — fade in

For new motion: use CSS `@keyframes` in `styles.css`. Use `transform` and `opacity` only —
never animate `width`, `height`, `padding`, or `margin`.

Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for entrances.
Duration: 200–280ms for screen transitions, 120–160ms for micro-interactions.

## Component File Conventions

```
src/components/
  screens/          ← Full screens, one file per screen
  ui/               ← Shared primitives: Button, Card, TopBar, etc.
  PhoneFrame.tsx    ← Outer shell, handles theme class
  WalletSimulator.tsx ← Root component, exported
```

New shared UI goes in `ui/`. Screen-specific one-off components stay in the screen file.

## Absolute Bans (web-specific additions)

Beyond the universal bans in the main skill:

**BAN: Tailwind color classes for theme colors**
```tsx
// ❌ Bypasses light/dark theme
<div className="bg-gray-900 text-white">
// ✅
<div style={{ background: 'var(--c-surface)', color: 'var(--c-on-surface)' }}>
```

**BAN: Glassmorphism**
```css
/* ❌ Decorative blur without purpose */
backdrop-filter: blur(20px);
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.1);
```
The welcome screen's `opacity-[0.025]` grid pattern is intentional brand texture — not
glassmorphism. Blur effects and translucent panels are not.

**BAN: Purple/cyan AI aesthetic**
```css
/* ❌ Generic crypto aesthetic */
background: linear-gradient(135deg, #6366f1, #06b6d4);
box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
```
Iron Vault's accent is `#8FC322`. Reach for green, not purple or cyan.
