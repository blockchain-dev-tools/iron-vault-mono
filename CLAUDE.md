# CLAUDE.md

This file provides guidance to Claude Code when working with the iron-vault-mono repository.

## Project Overview

**Iron Vault** — implements the Ledger Nano X BLE/APDU protocol on an Android phone,
making it compatible with Ledger-enabled host apps.

**Status:** Active development.
- `packages/wallet` business logic implemented, wired into `apps/prototype` and `apps/mobile`
- Mobile UI: 14 screens — full onboarding (entropy collection, Enigma wallet, BIP-39 import), PIN, vault, settings, account detail, transaction signing, seed backup
- Multi-chain: Ethereum, Solana, Bitcoin, Tron, Sui
- BLE peripheral: Android + iOS native modules in `apps/mobile/src/ble/`

## Repository Layout

```
iron-vault-mono/                    ← Turborepo monorepo root (pnpm workspaces)
├── apps/
│   ├── mobile/                 ← React Native 0.84.1 + React 19 production app
│   ├── prototype/              ← Next.js 14 design canvas + logic test harness (port 3002)
│   └── website/                ← Marketing/docs site (Next.js SSG)
└── packages/
    ├── wallet/                 ← PIN auth, mnemonic lifecycle, WalletStorage interface
    ├── apdu/                   ← APDU encode/decode (shared, no platform deps)
    ├── crypto/                 ← HD key derivation, secp256k1/Ed25519 signing (pure)
    ├── theme/                  ← Shared design tokens (DARK/LIGHT ColorTokens)
    ├── i18n/                   ← Localization strings
    ├── simulator/              ← Ledger device simulator (web component)
    ├── airgap/                 ← Air-gap / QR-code transport layer
    ├── eip4527/                ← EIP-4527 (CBOR/UR encoding for QR wallet comms)
    └── assets/                 ← Shared SVG/image assets
```

## Development Commands

### Monorepo

```bash
pnpm install                              # Install all deps
pnpm dev                                  # Run all apps in dev mode
pnpm --filter prototype dev               # Prototype only (port 3002)
pnpm --filter @iron-vault/mobile android  # Run mobile on device (rarely used directly)

# Type-check (run from monorepo root)
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json
pnpm exec tsc --noEmit -p packages/wallet/tsconfig.json
```

**Note:** `.npmrc` has `node-linker=hoisted` + `shamefully-hoist=true` — required for Gradle + Metro.

### apps/mobile — Android Build & Run

**Makefile (recommended)**:

```bash
make metro          # Start Metro bundler + ADB forwarding (auto-waits for ready)
make restart        # Restart Metro
make stop           # Stop Metro
make metro-log      # Tail Metro log
make metro-status   # Check if Metro running
make adb            # ADB reverse forwarding only (after daemon restart)
make build          # Build debug APK
make install        # Install APK to device
make app            # build + install
make launch         # Force-stop + reopen app
make dev            # metro + launch
make all            # build + install + metro + launch
```

**Manual commands:**
```bash
# Build APK (requires Java 17 — set JAVA_HOME to your local JDK 17 path)
cd apps/mobile/android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Metro bundler (must be foreground process)
cd apps/mobile && npx react-native start --reset-cache

# ADB (after every daemon restart)
adb reverse tcp:8081 tcp:8081

# App control
adb shell am start -n com.ironvault/.MainActivity
adb shell am force-stop com.ironvault
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/ui.xml
adb shell input tap X Y
```

## Architecture

### Package Responsibilities

| Package | Responsibility |
|---|---|
| `packages/crypto` | Pure algorithm layer: BIP-32/39, secp256k1, Ed25519/SLIP-10, address derivation |
| `packages/wallet` | Account management, mnemonic lifecycle, PIN auth (`setupWallet`, `unlockWallet`, `hasWallet`) |
| `packages/apdu` | APDU encode/decode, BLE framing (sequence numbers, chunking) |
| `packages/theme` | `DARK`/`LIGHT` ColorTokens (`C = DARK` for backward compat), `R` border radius constants |
| `packages/i18n` | `t()` localization, `useI18n()` hook |
| `packages/eip4527` | CBOR/UR encoding for QR-based air-gap wallet comms |
| `packages/airgap` | High-level air-gap / QR transport (uses eip4527) |
| `packages/simulator` | Web-based Ledger simulator (for integration testing without real hardware) |

### Storage Interface

`packages/wallet` defines `WalletStorage`; each app provides its own implementation:

```ts
interface WalletStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
// Keys: 'wallet.mnemonic', 'wallet.pinHash' (sha256 — never plaintext)
```

| App | Implementation |
|---|---|
| `apps/prototype` | `LocalStorageWalletStorage` (browser `localStorage`) |
| `apps/mobile` | `SecureWalletStorage` (Keychain/Keystore via `react-native-keychain`) |

### BLE Architecture (apps/mobile)

- `apps/mobile/src/ble/BlePeripheral.ts` — cross-platform JS bridge (Android + iOS)
  - Android: `BleModule` — `startAdvertising`, `stopAdvertising`, `sendApduResponse`, events: `onApduReceived`, `onBleLog`, `onBleStatus`
  - iOS: `BLEPeripheralModule` — same API surface; iOS status strings are normalised to Android equivalents
- `apps/mobile/src/hooks/useBleSession.ts` — owns all APDU module-level singletons
  - Sets up: `setMnemonicProvider`, `setCurrentApp`, `setLogFn`, `setSignRequestHandler`
  - Subscribes to: `onApduReceived`, `onBleLog`, `onBleStatus`
  - Returns: `{ logs, clearLogs, startBle, stopBle }`
  - Pass `activeChain = null` to disable without unmounting
  - **reject pattern**: always `reject: () => resolve('6985')` — never pass raw Promise reject
- `apps/mobile/src/lib/apdu-utils.ts` — decodes APDU instruction bytes for the log viewer

### Navigation (apps/mobile)

Custom stack in `AppContext` (`apps/mobile/src/store/AppContext.tsx`) rendered by `apps/mobile/src/navigation/Navigator.tsx`:
- `go(screen, dir?, params?)` = push, `goBack()` = pop, `reset(screen)` = replace stack
- `direction: 'forward' | 'back' | 'reset'`
- **Transitions**: forward/back = spring-animated horizontal slide; reset = 280ms fade-in
- **Swipe-back gesture**: left-edge `PanResponder` (40px) in Navigator — velocity or 50% threshold triggers back
- **Auto-lock**: 5-min background timer; on resume, if elapsed ≥ 5 min and screen is in `PROTECTED_SCREENS`, clears accounts and resets to `Unlock`
- `PROTECTED_SCREENS`: Vault, Settings, AccountDetail, Transaction, GenerateMnemonic, VerifyMnemonic, SetPin, Enigma
- `BOTTOM_NAV_SCREENS`: Vault, Settings — only these two show the persistent `BottomNav`

**Rules:**
- Auth success → `reset('Vault')` never `go('Vault')`
- Reset wallet → `reset('Welcome')`
- Back buttons → `goBack()` never `go('Vault')`
- App startup → render `null` until `hasWallet()` resolves, then `reset()`

### Screen Map (apps/mobile/src/screens/)

```
Welcome → Entropy → GenerateMnemonic → VerifyMnemonic → SetPin → Vault
Welcome → Enigma → EnigmaMnemonic → SetPin → Vault
Welcome → ImportMnemonic → SetPin → Vault
Unlock → Vault
Vault ↔ Settings → BackupSeed
Vault → AccountDetail → Transaction
```

| Screen | Purpose |
|---|---|
| `Welcome` | Entry point; routes to Create/Import/Enigma wallet flows |
| `Entropy` | Collects 200 touch-point randomness → SHA-256 → 12-word BIP-39 mnemonic |
| `GenerateMnemonic` | Displays mnemonic word grid; `LangPicker`; optional BIP-39 passphrase |
| `VerifyMnemonic` | Quiz words at positions 3, 7, 11 (4-choice each) before proceeding |
| `ImportMnemonic` | Free-text BIP-39 import with live word autocomplete; language-aware masking |
| `Enigma` | Deterministic wallet: riddle text + secret salt → `sha256(sha256(words) ‖ sha256(salt))` → 24-word mnemonic |
| `EnigmaMnemonic` | Shows Enigma-derived mnemonic; skips verify quiz (deterministic) |
| `SetPin` | Two-phase PIN setup; doubles as Change PIN (detected via `generatedWords.length === 0`) |
| `Vault` (WalletManager) | 5 chain sections (ETH, SOL, BTC, Tron, Sui); BLE connect sheet + log viewer |
| `AccountDetail` | Address display, QR code, derivation path, BLE toggle, log viewer |
| `Transaction` | Sign approval: shows network/action/from/to/amount/gas; raw hex toggle |
| `Settings` | Appearance, language (EN/中文/日本語/한국어), security, BLE device name, app version |
| `Unlock` | Cold-start unlock; max 5 attempts; lockout → Reset Wallet |
| `BackupSeed` | PIN-gated seed reveal; decrypts via `revealMnemonic`; `LangPicker` re-encoding |

## Theme System

`packages/theme/src/index.ts` exports `DARK`, `LIGHT`, `C = DARK`, and `R` (border radius constants).

**In React Native components:**
```tsx
const C = useTheme();   // returns DARK or LIGHT ColorTokens
const s = useMemo(() => makeStyles(C), [C]);  // always memoize
```

- `ThemeMode = 'system' | 'light' | 'dark'` — persisted via `AsyncStorage` key `app.theme`
- **Never hardcode colors** — always use `C.primary`, `C.bg`, `C.surface`, etc.
- Dark: `primary: '#8FC322'`, `bg: '#0F0F0F'`, `surface: '#1A1A1A'`
- Light: `primary: '#5f8a0e'`, `bg: '#FFFFFF'`, `surface: '#FFFFFF'`
- Border radius: use `R.sm`, `R.lg`, `R.xl`, etc. — never hardcode radius values

**Typography** (from `apps/mobile/src/lib/fonts.ts`):
- `SpaceGrotesk` (400/600/700) — headlines, labels, buttons
- `Manrope` (400/500/700/800) — body text, descriptions

## Icon System (apps/mobile)

`components/ui/Icon.tsx` renders Material Icons + MaterialCommunityIcons:
- Keys use **hyphens** (`arrow-back`) — component normalizes underscores automatically
- `mci:` prefix → MaterialCommunityIcons (e.g. `mci:wallet-outline`, `mci:cog-outline`)
- TTF font files must be in `android/app/src/main/assets/fonts/`

## Key Metro Config Notes

- Root `node_modules` MUST be in `watchFolders` (pnpm hoists everything there)
- `FallbackWatcher.js` is patched (try-catch for ENOENT) — pnpm creates ephemeral temp files
- `resolveRequest` override forces `react`/`react-native` to resolve from `apps/mobile/node_modules`
- Metro must run as **foreground** process (background processes may be killed)

## Engineering Lessons

### 1. 不要在 state updater 内产生副作用

React Strict Mode 会把 state updater 调用两次。`setTimeout`、导航等绝对不能放在 `setState(prev => ...)` 内部。

```tsx
// ✅ 正确 — useEffect 监听状态变化再触发
useEffect(() => {
  if (pin.length === 6) {
    const t = setTimeout(() => onComplete(pin, resetPin), 150);
    return () => clearTimeout(t);
  }
}, [pin]);
```

### 2. 注意回调参数遮蔽 context 同名变量

`handleComplete(pin, reset)` 的 `reset` 参数会静默覆盖 `const { reset: navReset } = useApp()`。
**规避：** context 解构时立即重命名 `const { reset: navReset } = useApp()`。

### 3. 鉴权边界用 `reset()` 替换整个导航栈

`go('Vault')` 只叠加历史；返回键会退回鉴权页。鉴权成功后必须用 `reset('Vault')`。

### 4. 入口屏幕检测要在渲染前完成，否则会闪屏

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

### 5. 同一屏幕服务多条入口路径时，要显式区分

`SetPinScreen` 同时服务"新建钱包"和"修改 PIN"。用 `const isChangingPin = generatedWords.length === 0` 区分路径。

### 6. Android 硬件返回键需要手动注册

```tsx
useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (canGoBack) { goBack(); return true; }
    return false;
  });
  return () => sub.remove();
}, [canGoBack, goBack]);
```

### 7. react-native-reanimated v4 与 RN 0.84 不兼容

JSI crash: `Global was not installed`。使用 RN 内置 `Animated` API 代替。

## Prototype App Notes (apps/prototype)

**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS

Provider tree:
```
AppProvider (app/page.tsx)
  └─ DevFrame
       └─ NavProvider (scoped to phone only)
            └─ Phone → Screen
```

Screen IDs: `p01` welcome → `p02` generate → `p03` verify → `p04` set PIN → `p05` import →
`p06` vault → `p08` settings → `p09` unlock → `p10` account detail → `p11` sign confirm

`transform: translateZ(0)` on phone frame — `position: fixed` children stay inside the frame.