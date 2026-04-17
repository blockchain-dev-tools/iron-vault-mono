# Design Token Reference

Full token table with both platform access patterns.

## Color Tokens

| Semantic name          | Dark mode | Light mode | CSS variable               | RN (useTheme())       |
|------------------------|-----------|------------|----------------------------|-----------------------|
| primary                | #8FC322   | #5f8a0e    | var(--c-primary)           | C.primary             |
| on-primary             | #1d2900   | #FFFFFF    | var(--c-on-primary)        | C.onPrimary           |
| background             | #000000   | #FFFFFF    | var(--c-background)        | C.bg                  |
| surface                | #1A1A1A   | #FAFDF2    | var(--c-surface)           | C.surface             |
| surface-container      | #1A1919   | #E9EED8    | var(--c-surface-container) | C.surfaceContainer    |
| surface-container-low  | #131313   | #F0F4E3    | var(--c-surface-container-low) | C.surfaceContainerLow |
| surface-container-high | #262626   | #DDE5C5    | var(--c-surface-container-high) | C.surfaceContainerHigh |
| on-surface             | #FFFFFF   | #0A0A0A    | var(--c-on-surface)        | C.onSurface           |
| on-surface-variant     | #999999   | #555555    | var(--c-on-surface-variant)| C.onSurfaceVariant    |
| outline                | #333333   | #CCCCCC    | var(--c-outline)           | C.outline             |
| outline-variant        | #494847   | #BBBBBA    | var(--c-outline-variant)   | C.outlineVariant      |
| error                  | #ff7351   | #CC3300    | var(--c-error)             | C.error               |
| error-container        | #b92902   | #FFE0D6    | var(--c-error-container)   | C.errorContainer      |

## Spacing Scale

```
4px   → Tailwind: gap-1 / p-1     RN: 4
8px   → Tailwind: gap-2 / p-2     RN: 8
12px  → Tailwind: gap-3 / p-3     RN: 12
16px  → Tailwind: gap-4 / p-4     RN: 16
24px  → Tailwind: gap-6 / p-6     RN: 24
32px  → Tailwind: gap-8 / p-8     RN: 32
48px  → Tailwind: gap-12 / p-12   RN: 48
64px  → Tailwind: gap-16 / p-16   RN: 64
96px  → Tailwind: gap-24 / p-24   RN: 96
```

## Semantic Usage Guide

| Token               | When to use                                                  |
|---------------------|--------------------------------------------------------------|
| background          | Full screen background only                                  |
| surface             | Cards, bottom sheets, modals, any elevated container        |
| surface-container   | Input fields, chips, tags, secondary containers              |
| surface-container-low | Subtle recessed areas, sidebar backgrounds               |
| surface-container-high | Hover/pressed states, tooltips                          |
| on-surface          | All primary body text                                        |
| on-surface-variant  | Secondary text, placeholders, labels, captions               |
| outline             | Dividers, card borders, form field borders                   |
| outline-variant     | Very subtle borders, inactive tab indicators                 |
| primary             | Primary buttons, active nav, key interactive elements        |
| on-primary          | Text/icons that sit directly on primary-colored backgrounds  |
| error               | Error messages, destructive action labels                    |
| error-container     | Error state backgrounds, alert banners                       |
