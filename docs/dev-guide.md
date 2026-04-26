# Development Guide

## Prerequisites

- Node.js >= 20.19.0 (use nvm)
- pnpm >= 9.0.0
- For mobile: Android Studio + JDK 17 (set `JAVA_HOME` to your local JDK 17 path)
- For web prototype: Chrome or Edge (Web Bluetooth API required)

## Running Apps

```bash
# Install all dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Prototype only (http://localhost:3002)
pnpm --filter prototype dev
```

## Mobile (React Native) — Android

**Makefile (recommended):**

```bash
make metro          # Start Metro bundler + ADB forwarding
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
# Build APK
cd apps/mobile/android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Metro bundler (must run as foreground process)
cd apps/mobile && npx react-native start --reset-cache

# ADB forwarding (required after every daemon restart)
adb reverse tcp:8081 tcp:8081

# App control
adb shell am start -n com.ironvault/.MainActivity
adb shell am force-stop com.ironvault
```

## Type Checking

```bash
# Run from monorepo root
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json
pnpm exec tsc --noEmit -p packages/wallet/tsconfig.json
```

## Package Dependency Graph

```
@iron-vault/theme        (no deps)
@iron-vault/i18n         (no deps)

@iron-vault/crypto       (@noble/curves, @noble/hashes, @scure/bip32, @scure/bip39)

@iron-vault/apdu         (→ @iron-vault/crypto)

@iron-vault/wallet       (→ @iron-vault/crypto, @noble/hashes)
      ↑
apps/prototype          (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme)
apps/mobile             (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme,
                            @iron-vault/i18n, react-native-keychain)
```

## Import Path Notes

`@noble/hashes` v2 and `@scure/bip39` v2 use an `exports` map with `.js` suffixes. All sub-path imports must include the extension:

```typescript
// ✓ Correct
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac }   from '@noble/hashes/hmac.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { wordlist } from '@scure/bip39/wordlists/english.js';

// ✗ Wrong (TS cannot resolve)
import { sha256 } from '@noble/hashes/sha256';
```

`@noble/curves` v1.9 exports both bare names and `.js` versions — both work.

## Adding a New APDU Command

1. Add constant to `packages/apdu/src/index.ts`
2. Add parser branch in `packages/apdu/src/parser.ts`
3. Add handler branch in `packages/apdu/src/handler.ts`

## Project Conventions

- TypeScript strict mode everywhere
- `packages/crypto` must remain platform-free (no RN, no browser APIs)
- `packages/wallet` service functions take `WalletStorage` as first argument — never import storage directly
- Colors and radius from `@iron-vault/theme` only — never hardcoded in mobile screens (`const C = useTheme()`)
- APDU constants in `packages/apdu` — never hardcoded in app layer
- Metro must run as a **foreground** process (background processes may be killed)
- `.npmrc` has `node-linker=hoisted` + `shamefully-hoist=true` — required for Gradle + Metro

## Release Build (Android)

### Signing setup

The release keystore file (`release.keystore`) and its credentials are **never committed to git**.

**Local development** — create `apps/mobile/android/keystore.properties` (gitignored):

```properties
STORE_PASSWORD=your-store-password
KEY_ALIAS=your-key-alias
KEY_PASSWORD=your-key-password
```

See `apps/mobile/android/keystore.properties.example` for the template.

**CI/CD** — set environment variables instead:

```
KEYSTORE_STORE_PASSWORD
KEYSTORE_KEY_ALIAS
KEYSTORE_KEY_PASSWORD
```

The `release.keystore` file itself must be provisioned separately (e.g. downloaded from a secrets manager or CI secret file) into `apps/mobile/android/app/` before building.

### Building a release APK

```bash
cd apps/mobile/android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Building a release AAB (Play Store)

```bash
cd apps/mobile/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```
