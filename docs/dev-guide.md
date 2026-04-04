# Development Guide

## Prerequisites

- Node.js >= 20.19.0 (use nvm)
- pnpm >= 9.0.0
- For mobile: Android Studio + JDK 17
- For web debugger / prototype: Chrome or Edge (Web Bluetooth API required)

## Remote Development Server

The monorepo runs on `robot@192.168.1.170`. Always source the shell profile first:

```bash
ssh robot@192.168.1.170
source ~/.zshrc   # loads nvm → node/pnpm available
```

## Running Apps

```bash
# Install all dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Run specific apps
pnpm --filter prototype dev     # http://192.168.1.170:3002
pnpm --filter debugger dev      # http://192.168.1.170:3001

# If pnpm --filter fails with "Cannot find module next", use root .bin directly:
cd apps/prototype && /home/robot/workspace/ble-vault-mono/node_modules/.bin/next dev -p 3002
```

## Type Checking

```bash
# Must run from monorepo root, not app dir
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json
```

## Mobile (React Native)

```bash
pnpm --filter @iron-vault/mobile start   # Metro bundler
pnpm --filter @iron-vault/mobile android # Run on Android device
```

## Package Dependency Graph

```
@iron-vault/theme        (no deps)
      ↑
@iron-vault/crypto       (@noble/curves, @noble/hashes, @scure/bip32, @scure/bip39)
      ↑
@iron-vault/apdu         (→ @iron-vault/crypto)

@iron-vault/wallet       (→ @iron-vault/crypto, @noble/hashes)
      ↑
apps/prototype          (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme)
apps/mobile             (→ @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme,
                            react-native-keychain, react-native-get-random-values)
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
4. Add preset button in `apps/debugger/app/page.tsx`
5. Add decode branch in `apps/debugger/lib/apdu-commands.ts`

## File Editing Over SSH

Heredocs with backticks break over SSH. Preferred pattern:

```bash
# 1. Write file locally
cat > /tmp/MyFile.ts << 'EOF'
...content...
EOF

# 2. SCP to remote
scp /tmp/MyFile.ts robot@192.168.1.170:/home/robot/workspace/ble-vault-mono/path/to/file.ts
```

## Project Conventions

- TypeScript strict mode everywhere
- `packages/crypto` must remain platform-free (no RN, no browser APIs)
- `packages/wallet` service functions take `WalletStorage` as first argument — never import storage directly
- Screen names: `p01`–`p11` (prototype) / `P01`–`P11` (mobile)
- Colors and radius from `@iron-vault/theme` only — never hardcoded in mobile screens
- APDU constants in `packages/apdu` — never hardcoded in app layer
