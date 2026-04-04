# TODO: CMD+K Search Modal

Deferred from Fumadocs UI implementation. Design notes for future implementation.

## Goal

Full-text search across all MDX docs content, triggered by CMD+K (or Ctrl+K on Windows/Linux), rendered as a modal with results grouped by section.

## UI Design

```
┌─────────────────────────────────────────────────┐
│  🔍 Search docs...                    ⌘K  [Esc] │
├─────────────────────────────────────────────────┤
│  Getting Started                                │
│    › Introduction          …BLE hardware wallet │
│    › Quick Start           …Send GET_VERSION… │
│                                                 │
│  APDU Protocol                                  │
│    › Overview              …ISO 7816-4 format…  │
│    › Ethereum Commands     …GET_ETH_ADDRESS…    │
└─────────────────────────────────────────────────┘
```

- Keyboard shortcut: `CMD+K` / `Ctrl+K` opens modal; `Escape` closes
- Results grouped by NAV section
- Each result shows: page title + matched excerpt snippet
- Arrow keys to navigate results; Enter to go to page
- Lime-green highlight on active result

## Implementation Options

### Option A: Static JSON index (recommended)
- At build time, generate `public/search-index.json` from all MDX files
- Client loads the index lazily on first CMD+K open
- Search with [fuse.js](https://fusejs.io/) — fuzzy matching, zero server cost
- ~50KB index for ~20 pages; acceptable

### Option B: Pagefind
- [Pagefind](https://pagefind.app/) — static search, runs as a post-build step
- Generates pre-indexed WASM + data files
- Best result quality for large doc sites; overkill at current scale

### Option C: Server-side search
- API route `/api/search?q=...` that reads MDX at request time
- Simple but adds server dependency; not needed for static export

## Recommended Approach

Option A with fuse.js. Steps:
1. Add `scripts/build-search-index.ts` — reads all `content/docs/**/*.mdx`, extracts title + first 200 chars of each section, writes to `public/search-index.json`
2. Add to `package.json` `build` script: `pnpm exec tsx scripts/build-search-index.ts && next build`
3. Add `components/search/SearchModal.tsx` — CMD+K listener, modal with fuse.js query
4. Mount `<SearchModal />` in `app/layout.tsx`
5. Add search button to `TopBar.tsx`

## Dependencies to Add
```
fuse.js
tsx (devDep, for build script)
```
