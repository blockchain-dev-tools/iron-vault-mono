# AGENTS.md

Guidelines for AI agents working on the `iron-vault-mono` codebase.

---

## Quick Orientation

**Iron Vault** — turns an old Android/iOS phone into a Ledger Nano X-compatible BLE hardware wallet.
The app emulates the Ledger GATT profile + APDU protocol; host wallets (OKX, MetaMask, etc.) treat it as real hardware.

```
apps/mobile       → React Native 0.84.1 + React 19  (Android + iOS, production)
apps/prototype    → Next.js 14  (design canvas + logic test harness, port 3002)
apps/debugger     → Next.js BLE APDU debugger (port 3001)
apps/website      → Next.js SSG (marketing site)

packages/wallet   → PIN auth, mnemonic lifecycle, WalletStorage interface
packages/crypto   → Pure crypto: BIP-32/39, secp256k1, Ed25519/SLIP-10
packages/apdu     → APDU encode/decode + BLE framing (chunking, sequence numbers)
                    Supported chains: ETH, Solana, BTC, Tron, Sui
packages/theme    → Design tokens — DARK / LIGHT ColorTokens + R radius tokens
packages/i18n     → Localization strings (en / zh / ja / ko)
packages/eip4527  → CBOR/UR encoding (QR air-gap comms)
packages/airgap   → Air-gap transport layer (uses eip4527)
packages/simulator→ Web Ledger simulator (integration testing)
packages/assets   → Shared SVGs and images
```

### Package dependency graph

```
@iron-vault/theme        ← no deps

@iron-vault/crypto       ← @noble/curves, @noble/hashes, @scure/bip32, @scure/bip39

@iron-vault/apdu         ← @iron-vault/crypto

@iron-vault/wallet       ← @iron-vault/crypto, @noble/hashes

apps/prototype           ← wallet, apdu, theme
apps/mobile              ← wallet, apdu, theme, i18n, assets
```

---

## Conventions You Must Follow

### TypeScript

- **Strict mode everywhere.** All packages have `strict: true` in tsconfig.
- Type-check: `pnpm exec tsc --noEmit -p <path>/tsconfig.json`
- No `any` — prefer `unknown` + type narrowing.

### React Native (apps/mobile)

**Theme — never hardcode colors:**
```tsx
const C = useTheme();                          // returns ColorTokens (DARK or LIGHT)
const s = useMemo(() => makeStyles(C), [C]);   // always memoize

const makeStyles = (C: ColorTokens) => StyleSheet.create({ ... });
```

**Radius tokens** — use `R` from `@iron-vault/theme` (only 3 values):
```tsx
import { R } from '@iron-vault/theme';
// R.sm = 6  |  R.lg = 12  |  R.xl = 18
// There is no R.md — use R.lg (12) for medium corners.
```

**Navigation — custom stack, NOT React Navigation** (`src/store/AppContext.tsx`):
- `go(name, dir?, params?)` = push (optional direction + params), `goBack()` = pop, `reset(screen)` = replace entire stack
- Auth success / wallet reset → **always `reset()`**, never `go()`
- App startup → render `null` until `hasWallet()` resolves, then `reset()`

**All screen names** (`ScreenName` type):
```
'Welcome' | 'Entropy' | 'GenerateMnemonic' | 'VerifyMnemonic' | 'SetPin' | 'ImportMnemonic'
| 'Vault' | 'Settings' | 'Unlock' | 'AccountDetail' | 'Transaction' | 'BackupSeed'
```
The lock screen is `'Unlock'`.

**Screen flow:**
```
Welcome → Entropy → GenerateMnemonic → VerifyMnemonic → SetPin → Vault
Welcome → ImportMnemonic → SetPin → Vault
Unlock → Vault
Vault ↔ Settings
Vault → AccountDetail → Transaction
Vault / Settings → BackupSeed
```

**Navigator animations:**
- `reset()` → cross-fade (280 ms)
- `go()` forward → spring slide-in from right
- `goBack()` → spring slide-out to right

**Auto-lock:** The app locks after **5 minutes** in the background (`AUTO_LOCK_MS = 5 * 60 * 1000`).
Protected screens that trigger a lock-check on foreground: `Vault`, `Settings`, `AccountDetail`, `Transaction`, `GenerateMnemonic`, `VerifyMnemonic`, `SetPin`.

**Bottom nav** is shown on: `Vault`, `Settings`, `AccountDetail`.

**Locale / i18n:**
```tsx
const { t } = useLocale();   // NOT useI18n() — that hook does not exist
// useLocale() is exported from store/AppContext, returns { locale, setLocale, t: Translations }
// Supported locales: 'system' | 'en' | 'zh' | 'ja' | 'ko'
```

**Icons** — `Icon` component, hyphen-cased names; prefix `mci:` for MaterialCommunityIcons.

**State updaters** — pure computation only, no side effects inside `setState(prev => ...)`.
React Strict Mode calls updaters twice; use `useEffect` to react to state changes instead.

**Animations** — use RN built-in `Animated` API. `react-native-reanimated` is **not installed** (v4 crashes on this device with `JSI: Global was not installed`).

### Package Boundaries

- `packages/*` must be **platform-agnostic** — no React Native, no browser APIs.
- `packages/crypto` — pure algorithms, no I/O, no state, no platform deps.
- `packages/wallet` — defines `WalletStorage` interface; implementations live in apps:
  - `apps/prototype` → `LocalStorageWalletStorage`
  - `apps/mobile` → `SecureWalletStorage` (`react-native-keychain` → Android Keystore / iOS Secure Enclave)
- `packages/apdu` — APDU framing only; no BLE transport.
- BLE code lives exclusively in `apps/mobile/src/ble/`.

### Naming

- npm scope: `@iron-vault/`
- Android bundle ID: `com.ironvault`
- Screen names: PascalCase (`Welcome`, `Vault`, `AccountDetail`) — NOT `P01`, `P06`
- Style tokens: camelCase (`primaryBg`, `onSurface`)

### File Organization (apps/mobile/src/)

```
ble/              # BLE peripheral (BlePeripheral.ts — iOS + Android native bridge)
components/       # Reusable UI components
│   ui/           # Design system atoms: Icon, Button, TopBar, …
hooks/            # Custom hooks (useBleSession)
i18n/             # Locale loader (loads translation JSON; useLocale lives in store/AppContext)
lib/              # Utilities: chains, apdu-utils
navigation/       # Navigator.tsx (screen transitions + animations)
screens/          # One directory per screen — screens/<ScreenName>/index.tsx
store/            # AppContext.tsx (app state, navigation, theme, locale) + storage adapters
```

> **Important:** `AppContext.tsx` is in `src/store/`, **not** `src/ble/`.

---

## Development Commands

### Monorepo

```bash
pnpm install                                            # install all deps
pnpm dev                                                # run all apps
pnpm --filter prototype dev                             # prototype only (port 3002)

# Type-check (run from monorepo root)
pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
pnpm exec tsc --noEmit -p packages/wallet/tsconfig.json

# Unit tests
pnpm --filter @iron-vault/<pkg> test
```

### apps/mobile — Android (Makefile, recommended)

Run from the **monorepo root** (the `Makefile` is at the repo root):

```bash
make dev            # metro + launch app  ← daily driver
make all            # build + install + metro + launch
make metro          # start Metro + ADB forwarding
make restart        # restart Metro
make stop           # stop Metro
make metro-log      # tail Metro log
make metro-status   # check if Metro is running
make adb            # ADB reverse forwarding only (after daemon restart)
make build          # build debug APK
make install        # install APK to device
make app            # build + install
make launch         # force-stop + reopen app
```

### apps/mobile — manual commands

```bash
# Build APK (Java 17 required — set JAVA_HOME)
cd apps/mobile/android && ./gradlew assembleDebug

# Metro (must run as foreground process)
cd apps/mobile && node node_modules/.bin/react-native start --no-interactive

# ADB (run after every daemon restart)
adb reverse tcp:8081 tcp:8081

# App control
adb shell am start -n com.ironvault/.MainActivity
adb shell am force-stop com.ironvault

# UI inspection
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/ui.xml
adb shell input tap X Y
```

---

## Common Pitfalls

### BLE Session Hook
`useBleSession(activeChain, acct)` — owns all APDU module-level singletons.
- Pass `activeChain = null` to disable BLE without unmounting.
- Reject callback: always `reject: () => resolve('6985')` — **never** raw `Promise.reject`.
- `BleState` has four values: `'idle' | 'broadcasting' | 'connected' | 'error'`.

### Metro Bundler
- Metro `watchFolders` includes `packages/` and the root `node_modules/` (pnpm hoists everything there) — not the full repo root.
- Metro must run as **foreground** process — background processes may be killed.
- `FallbackWatcher.js` is patched with try-catch for ENOENT (pnpm creates ephemeral temp files).
- `resolveRequest` override forces `react`/`react-native` to resolve from `apps/mobile/node_modules`.

### Android Build
- Java 17 required — set `JAVA_HOME` to your local JDK 17 path.
- After `adb` daemon restart: `adb reverse tcp:8081 tcp:8081`.

### Navigation Traps
- `handleComplete(pin, reset)` — the `reset` param **silently shadows** `useApp().reset`.
  Fix: `const { reset: navReset } = useApp()`.
- `SetPinScreen` serves both "create wallet" and "change PIN" — distinguish with `generatedWords.length === 0`.
- Always register `BackHandler` for Android hardware back button.
- The lock screen is named `'Unlock'`.

### Theme Gotchas
- `ThemeMode` = `'system' | 'light' | 'dark'` (persisted in AsyncStorage key `app.theme`).
- `useTheme()` returns `ColorTokens`, **not** the mode string.
- Never define colors inline — use `C.primary`, `C.bg`, `C.surface`, etc.
- `R` has only **three** radius values: `R.sm` (6), `R.lg` (12), `R.xl` (18). There is no `R.md`.

### PIN Storage
The PIN is hashed with **PBKDF2** (10,000 iterations, random salt), stored as `${salt_hex}:${hash_hex}` under key `wallet.pinKdf`.
- Legacy key `wallet.pinHash` (plain sha256) is migrated on first unlock and then deleted.
- Do not refer to "sha256(pin)" in new code or comments — it's outdated.

### State Updater Side Effects
React Strict Mode double-invokes updaters. `setTimeout`, navigation, and any I/O must go in `useEffect`, not `setState(prev => ...)`.

```tsx
// ✅ correct
useEffect(() => {
  if (pin.length === 6) {
    const t = setTimeout(() => onComplete(pin, resetPin), 150);
    return () => clearTimeout(t);
  }
}, [pin]);
```

### Startup Flash
Check `hasWallet()` before first render — render `null` until resolved, then `reset()` to the right screen.

```tsx
const [ready, setReady] = useState(false);
useEffect(() => {
  hasWallet(storage).then(has => {
    navReset(has ? 'Unlock' : 'Welcome');
    setReady(true);
  });
}, []);
if (!ready) return null;
```

---

## `@iron-vault/wallet` API

Full set of exported functions from `packages/wallet/src/service.ts`:

```typescript
import {
  hasWallet, setupWallet, unlockWallet, clearWallet,  // lifecycle
  verifyPin,                                           // check PIN without full unlock
  getAccounts, addAccount, removeAccount,             // account management
  revealMnemonic,                                     // export mnemonic (requires PIN)
} from '@iron-vault/wallet';

await hasWallet(storage);                        // → boolean
await setupWallet(storage, mnemonic, pin);       // → WalletAccounts
await unlockWallet(storage, pin);                // → { accounts, passphrase } | null  (null = wrong PIN)
await clearWallet(storage);                      // wipe wallet
await verifyPin(storage, pin);                   // → boolean
await getAccounts(storage);                      // → Account[]
await addAccount(storage, index);               // derive + persist new account
await removeAccount(storage, address);          // remove by address
await revealMnemonic(storage, pin);             // → string | null  (null = wrong PIN)
```

---

## Key Dependencies

| Dependency | Version | Note |
|---|---|---|
| React Native | 0.84.1 | New Architecture enabled; supports Android + iOS |
| React | 19.2.3 | Root has 18.3.1 — Metro resolver pins to mobile's copy |
| pnpm | 9.0.0 | `shamefully-hoist=true` + `node-linker=hoisted` in `.npmrc` |
| Turbo | 2.x | Build orchestration |
| Java | 17 | Required for Gradle (openjdk-amd64) |
| react-native-keychain | latest | Secure storage (Android Keystore / iOS Secure Enclave) |
| react-native-qrcode-svg | latest | QR code display |

> **Not present:** `react-native-reanimated` — do not add it; it crashes on the target device.

---

## Agent Orchestration

When splitting work across agents, use these isolation boundaries:

| Work type | Isolation | Verification |
|---|---|---|
| `packages/*` logic | No device needed | `pnpm exec tsc --noEmit -p packages/<pkg>/tsconfig.json` |
| Package changes | Must check all consumers | `pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json` |
| UI / screen changes | Need device | `make dev` |
| BLE changes | Need device + host app (OKX) | Full E2E |
| Theme changes | Need device | Verify both dark and light modes |

**After any edit:** run `tsc --noEmit` on changed package + all consumers. Type errors = not done.