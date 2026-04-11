# AGENTS.md

Guidelines for AI agents working on the iron-vault-mono codebase.

## Quick Orientation

This is a **Turborepo monorepo** (pnpm workspaces) building a BLE hardware wallet simulator.
The Android app (`apps/mobile`) implements the Ledger Nano X BLE/APDU protocol.

```
apps/mobile       → React Native 0.84.1 (production app, Android only)
apps/prototype    → Next.js 14 (design canvas + logic prototyping)
apps/website      → Next.js SSG (marketing site)
packages/wallet   → Business logic (mnemonic, PIN, storage)
packages/crypto   → Pure crypto (BIP-32/39, secp256k1, Ed25519)
packages/apdu     → APDU protocol encode/decode
packages/theme    → Design tokens (DARK/LIGHT)
packages/i18n     → Localization
packages/eip4527  → CBOR/UR encoding (QR air-gap comms)
packages/airgap   → Air-gap transport layer (uses eip4527)
packages/simulator→ Web Ledger simulator
packages/assets   → Shared SVGs and images
```

## Conventions You Must Follow

### TypeScript

- **Strict mode everywhere.** All packages have `strict: true` in tsconfig.
- Type-check from monorepo root: `pnpm exec tsc --noEmit -p <path>/tsconfig.json`
- No `any` unless absolutely necessary — prefer `unknown` + type narrowing.

### React Native (apps/mobile)

- **Theme:** Never hardcode colors. Use `const C = useTheme()` + `makeStyles(C)` pattern.
  ```tsx
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  // ...
  const makeStyles = (C: ColorTokens) => StyleSheet.create({ ... });
  ```
- **Navigation:** Custom stack, NOT React Navigation. See `src/ble/AppContext.tsx`.
  - `go(screen)` = push, `goBack()` = pop, `reset(screen)` = replace stack
  - Auth transitions: always `reset()`, never `go()`
- **Icons:** `Icon` component with hyphen-cased names. Prefix `mci:` for MaterialCommunityIcons.
- **State updaters:** Pure computation only — no side effects inside `setState(prev => ...)`.
- **Animations:** Use RN built-in `Animated` API. `react-native-reanimated` v4 crashes on this device.

### Package Boundaries

- `packages/*` must be **platform-agnostic** (no React Native, no browser APIs).
- `packages/crypto` is pure algorithm — no I/O, no state, no platform deps.
- `packages/wallet` defines `WalletStorage` interface — platform-specific implementations live in apps.
- `packages/apdu` handles APDU framing only — no BLE transport.
- BLE code lives exclusively in `apps/mobile/src/ble/`.

### Naming

- npm scope: `@iron-vault/`
- Android bundle ID: `com.ironvault`
- Screen names: PascalCase (`Welcome`, `Vault`, `AccountDetail`) — NOT `P01`, `P06`
- CSS/style tokens: camelCase (`primaryBg`, `onSurface`)

### File Organization (apps/mobile)

```
src/
├── ble/              # BLE peripheral + AppContext (state + navigation)
│   ├── BlePeripheral.ts   # JS↔Native bridge
│   └── AppContext.tsx      # App state, navigation, theme
├── components/       # Reusable UI components
│   └── ui/           # Design system atoms (Icon, Button, TopBar, etc.)
├── hooks/            # Custom hooks (useBleSession)
├── i18n/             # Locale loader
├── lib/              # Utility functions (chains, apdu-utils)
├── navigation/       # Navigator.tsx (screen transitions)
├── screens/          # One file per screen
└── store/            # Storage adapters
```

## Common Pitfalls

### BLE Session Hook
`useBleSession(activeChain, acct)` manages all APDU module singletons.
- Pass `activeChain = null` to disable BLE without unmounting.
- Reject callback pattern: `reject: () => resolve('6985')` — never raw `Promise.reject`.

### Metro Bundler
- Root `node_modules` MUST be in `watchFolders` (pnpm hoists everything there).
- Metro must run as foreground process (background processes may be killed).
- `FallbackWatcher.js` is patched for ENOENT (pnpm temp files).

### Android Build
- Java 17 required: set `JAVA_HOME` to your local JDK 17 path
- After `adb` daemon restart: `adb reverse tcp:8081 tcp:8081`

### Navigation Traps
- `handleComplete(pin, reset)` — `reset` param shadows `useApp().reset`. Destructure as `navReset`.
- SetPinScreen serves both "create wallet" and "change PIN" paths — check `generatedWords.length === 0`.
- Always register `BackHandler` for Android hardware back button.

### Theme Gotchas
- `ThemeMode` is `'system' | 'light' | 'dark'` (persisted in AsyncStorage `app.theme`).
- `useTheme()` returns `ColorTokens` (DARK or LIGHT) — not the mode string.
- Both dark/light variants exist in `packages/theme` — never define colors inline.

## Testing

- Unit tests: `packages/*/src/tests/` — run with `pnpm --filter <pkg> test`
- Type-check: `pnpm exec tsc --noEmit -p <path>/tsconfig.json`
- Manual mobile testing: `make dev` (starts Metro + launches app on device)
- ADB UI dump: `adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/ui.xml`

## Dependency Notes

| Dependency | Version | Note |
|---|---|---|
| React Native | 0.84.1 | New Architecture enabled |
| React | 19.2.3 | (root has 18.3.1 — Metro resolver pins to mobile's copy) |
| pnpm | 9.0.0 | `shamefully-hoist=true` in `.npmrc` |
| Turbo | 2.x | Build orchestration |
| Java | 17 | Required for Gradle (openjdk-amd64) |

## For Agent Orchestration

When splitting work across agents:
- **Crypto/wallet logic** → can be tested in isolation, no device needed
- **UI/screen changes** → need `make dev` to verify on device
- **BLE changes** → require device + host app (OKX) for full E2E
- **Package changes** → run type-check for all consumers: `pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json`
- **Theme changes** → verify both dark and light modes on device