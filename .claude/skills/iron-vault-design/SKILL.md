---
name: iron-vault-design
description: "Iron Vault project design skill. Guides creation of UI for both the React Native mobile app (apps/mobile) and the web simulator (packages/simulator). Ensures token usage, platform conventions, and brand consistency. Use whenever working on UI components, screens, or visual styling in this project."
user-invocable: true
---

## Context

Before any design work, load the project design context:

1. **Read `docs/design/spec.md`** from the repo root — it contains brand identity, tokens,
   spacing scale, component conventions, and platform-specific access patterns.
2. **Detect platform**: Are you working in `apps/mobile` (React Native) or
   `packages/simulator` (web React + Tailwind + CSS vars)?

→ For **mobile (RN)**: consult [mobile rules](reference/mobile-rules.md)
→ For **simulator (web)**: consult [simulator rules](reference/simulator-rules.md)
→ For **token reference**: consult [tokens](reference/tokens.md)

---

## Universal Rules (both platforms)

### Colors — never hardcode

Every color must come from the design system. No hex literals, no `rgb()`, no named colors
outside of token definitions.

**Web**: `var(--c-primary)`, `var(--c-surface)`, etc.
**RN**: `C.primary`, `C.surface`, etc. via `const C = useTheme()`

### Spacing — use the scale

Only use values from the 4pt scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
No arbitrary values like `padding: 13` or `margin: 7`.

### Brand direction

Iron Vault is a **precision instrument**, not a consumer app. When in doubt, go more minimal,
not more decorative. Every element should earn its place.

---

## Absolute Bans (match-and-refuse)

These patterns are never acceptable. If you find yourself writing any of these, stop and
rewrite the element differently.

**BAN 1: Side-stripe accent borders**
```
border-left: Npx solid <color>  (N > 1px)
border-right: Npx solid <color>  (N > 1px)
borderLeftWidth + borderLeftColor in RN StyleSheet
```
Why: Overused "design touch" in crypto/dashboard UIs. Rewrite with full borders,
background tints, or leading icons instead.

**BAN 2: Gradient text**
```
background-clip: text (web)
-webkit-background-clip: text
```
Why: Top AI design tell. Use solid `C.primary` or `on-surface` for emphasis instead.

**BAN 3: "AI color palette"**
```
cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
```
Why: Iron Vault's brand is green (`#8FC322`) + dark neutrals. Neon cyan/purple signals
"generic crypto app."

**BAN 4: Hardcoded colors (both platforms)**
```
color: '#8FC322'    /* in JSX or StyleSheet — use C.primary */
background: '#1A1A1A'  /* use var(--c-surface) or C.surface */
```
Why: Light mode will break. Theme switching will break.

**BAN 5: Arbitrary spacing**
```
padding: 13, margin: 7, gap: 11   /* not on the 4pt scale */
```
Why: Breaks visual rhythm. Always round to scale: 4, 8, 12, 16, 24, 32...

---

## When to Use Specific Skills

| Task | Use |
|------|-----|
| Typography issues | `/typeset` + simulator rules |
| Layout/spacing | `/layout` + simulator rules |
| Color feels off | `/colorize` + token reference |
| Pre-ship cleanup | `/polish` |
| UX review | `/critique` |
| Add motion | `/animate` |
| Simplify cluttered screen | `/distill` |
| RN screen scaffold | This skill's mobile rules |
