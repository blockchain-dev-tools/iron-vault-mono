# AGENTS.md

Guidelines for AI agents working on the `iron-vault-flutter` codebase.

**Project goal:** Flutter port of [iron-vault-mono](https://github.com/lbh/iron-vault-mono) — turn an old Android/iOS phone into a Ledger Nano X-compatible BLE hardware wallet. Crypto primitives live in a **Rust SDK** called via FFI (instead of JS noble/curves).

---

## Architecture

> Architecture Decision Record: [ADR-001](docs/adr/001-layered-architecture.md) (2026-06-21)

### Layer Structure (normative — agents MUST follow)

```
lib/
├── core/                         ← Innermost: entities + abstract interfaces (pure Dart, zero deps)
│   ├── models/                   ← Pure data: WalletAccounts, ApduCommand, BleTypes...
│   └── interfaces/               ← Abstract contracts: Storage, ICryptoService, IWalletRepository...
│
├── data/                         ← Data access: Repository implementations (I/O only, no logic)
│   ├── repositories/             ← WalletRepositoryImpl, SettingsRepositoryImpl
│   └── bip39_wordlist.dart       ← Static data
│
├── services/                     ← Business logic: 5 Services
│   ├── wallet_service.dart        ← Wallet lifecycle orchestration (setup/unlock/lock/reset)
│   ├── pin_auth_service.dart      ← PIN auth (verify/change/attempt-counting/lockout)
│   ├── account_service.dart       ← Account management (5-chain derivation/add/remove)
│   ├── mnemonic_service.dart      ← Mnemonic generation/validation/Enigma
│   └── settings_service.dart      ← Settings (theme/locale/BLE name/storePassphrase)
│
├── infrastructure/               ← External boundaries (implements core/interfaces)
│   ├── ble/ble_peripheral.dart    ← BLE GATT server
│   ├── ffi/crypto_bridge.dart    ← Rust FFI (implements ICryptoService)
│   └── persistence/               ← Storage implementations
│
├── protocols/                    ← Protocol implementations
│   ├── apdu/
│   ├── airgap/
│   └── eip4527/
│
├── app/                          ← App assembly (AppState — lifecycle + BLE ↔ APDU bridge)
│   └── app_state.dart
│
└── ui/                           ← Presentation (screens/ + theme/ + i18n/)
    ├── screens/
    ├── theme/
    └── i18n/
```

### Dependency Direction (UNIDIRECTIONAL — NEVER reverse)

```
ui/ ────────────────┐
app/                │  only imports services/ + infrastructure/
                    ▼
              services/          ← business logic (only imports core/)
           ╱    │    ╲
          ╱     │     ╲
         ▼      ▼      ▼
      core/  ← ALL layers may depend on core/
         ▲
         │  (implements)
      data/          ← implements core/interfaces
      infrastructure/ ← implements core/interfaces
```

| Layer | May import from | Must NOT import from |
|---|---|---|
| `core/` | nothing (pure Dart) | any other layer |
| `data/` | `core/` only | `services/`, `app/`, `ui/` |
| `infrastructure/` | `core/` only | `services/`, `app/`, `ui/` |
| `services/` | `core/` only | `data/`, `infrastructure/`, `app/`, `ui/` |
| `app/` | `services/`, `infrastructure/`, `core/` | `ui/`, `data/` |
| `ui/` | `services/`, `core/` | `data/`, `infrastructure/` |

### File Placement Rules

When creating new code, place it by answering these questions in order:

1. Is it a pure data structure with zero logic? → `core/models/`
2. Is it an abstract contract (interface)? → `core/interfaces/`
3. Is it a concrete implementation of a core interface that does I/O? → `data/` or `infrastructure/`
4. Is it business logic (orchestration, validation, decision-making)? → `services/`
5. Is it UI? → `ui/screens/<feature>/` or `ui/widgets/`

| What you're adding | Where it goes | Example |
|---|---|---|
| New data type | `core/models/` | `ChainAccount`, `Transaction` |
| New interface | `core/interfaces/` | `IAuthStrategy`, `ISettingsRepository` |
| New repository impl | `data/repositories/` | `WalletRepositoryImpl` |
| New service | `services/` | `PinAuthService`, `TransactionService` |
| New protocol handler | `protocols/` | New chain handler in `apdu/` |
| New screen | `ui/screens/<feature>/` | `ui/screens/auth/unlock_screen.dart` |
| Static data / config | `data/` | BIP-39 wordlist |
| Platform/device code | `infrastructure/` | BLE, FFI, persistence |

### Service Responsibilities (DO NOT cross boundaries)

| Service | Owns | Does NOT own |
|---|---|---|
| `WalletService` | Wallet lifecycle orchestration (setup/unlock/lock/reset) | PIN validation, crypto, account derivation |
| `PinAuthService` | PIN hashing, verification, attempt counting, lockout | Mnemonic encryption (delegated to crypto) |
| `AccountService` | Chain account derivation (5 chains), add/remove | Wallet lifecycle, PIN |
| `MnemonicService` | BIP-39 generation, validation, Enigma derivation | PIN, account management |
| `SettingsService` | Theme, locale, BLE device name, storePassphrase | Anything wallet-related |

### Testing Strategy

- **Unit tests** (mock `core/interfaces/` abstractions, <0.5s): Test business logic, flow order, edge cases
- **Integration tests** (real Rust FFI, 10s+): Test crypto correctness, Enigma determinism
- **Test files** live next to source: `services/pin_auth_service_test.dart` beside `services/pin_auth_service.dart`
- **Mock rules**: ONLY mock `core/interfaces/` abstract classes. NEVER mock concrete classes.
- **NEVER** require Rust .so or real device for unit tests

See: `docs/guides/testing.md`

### Layer map (from mono → flutter)

| Mono (TypeScript) | Flutter equivalent |
|---|---|
| `@iron-vault/crypto` | **Rust crate** (`rust/src/`), called via `dart:ffi` |
| `@iron-vault/wallet` | `services/wallet_service.dart` (+ `pin_auth_service.dart`, `account_service.dart`) |
| `@iron-vault/apdu` | `protocols/apdu/apdu_handler.dart` |
| `@iron-vault/theme` | `ui/theme/color_tokens.dart` — `ColorTokens`, `R` radius constants |
| `@iron-vault/i18n` | Flutter built-in i18n via `.arb` |
| `apps/mobile` screens | `ui/screens/` — 15 screens |
| `apps/mobile/src/ble/` | `infrastructure/ble/` — BLE peripheral |
| `apps/mobile/src/store/AppContext` | `app/app_state.dart` — app state + nav |

### Crypto boundary (Rust SDK → FFI)

Crypto runs in Rust. The FFI layer exposes a minimal, safe API via `ICryptoService` interface in `core/interfaces/`, implemented by `infrastructure/ffi/crypto_bridge.dart`.

```dart
// core/interfaces/crypto_service.dart
abstract class ICryptoService {
  String pbkdf2Derive(String input, String salt, int outputLength);
  String chacha20Encrypt(String plaintext, String pin, String salt);
  String chacha20Decrypt(String ciphertext, String pin, String salt);
  String generateMnemonic({int strength = 128});
  bool validateMnemonic(String mnemonic);
  String mnemonicToSeed(String mnemonic, {String passphrase = ''});
  String deriveEthAddress(String seedHex, String path);
  // ... etc
}
```

**Rust deps:** `bip39`, `bip32`, `ed25519-dalek`, `k256`, `sha2`, `ripemd`, `bech32`, `bs58`, `pbkdf2`, `chacha20poly1305`.

### Wallet Service (`services/wallet_service.dart`)

Mirrors `packages/wallet/src/service.ts` — lifecycle orchestration only:

```dart
class WalletService {
  final IPinAuthService _pinAuth;
  final IAccountService _accountService;
  final IMnemonicService _mnemonicService;
  final IWalletRepository _repo;

  Future<bool> hasWallet();
  Future<WalletAccounts> setupWallet(String mnemonic, Map<String, String> authParams);
  Future<WalletAccounts> unlockWallet(Map<String, String> authParams);
  void lock();
  Future<void> clearWallet();
}
```

PIN storage uses **PBKDF2-HMAC-SHA256** via `ICryptoService`. Mnemonic encryption uses **ChaCha20-Poly1305** AEAD.

**Storage interface** (in `core/interfaces/storage.dart`, simple `getItem`/`setItem`/`removeItem`):
- Mobile: `flutter_secure_storage` (Android Keystore / iOS Keychain)
- Test: in-memory map (implemented in `infrastructure/persistence/`)

### APDU Handler (`protocols/apdu/apdu_handler.dart`)

Mirrors `packages/apdu/src/handler.ts` — dispatches Ledger APDU commands by CLA byte:
- CLA `0xe0` → OS commands or app-specific (Solana/Ethereum)
- CLA `0xe1`/`0xf8` → Bitcoin
- CLA `0x14` → Tron
- CLA `0x07` → Sui

All INS codes defined in `protocols/apdu/apdu_constants.dart`.

### Screen Flow (15 screens)

```
Welcome
 ├── Entropy → GenerateMnemonic → VerifyMnemonic → SetPin → Vault
 ├── Enigma → EnigmaMnemonic ──────────────────→ SetPin → Vault
 └── ImportMnemonic ────────────────────────────── SetPin → Vault

[cold start with wallet] → Unlock → Vault

Vault ↔ Settings → BackupSeed
Vault → AccountDetail → Transaction → AccountDetail

Bottom tabs: Accounts · BLE · History · Settings
```

| Screen | Key Behavior |
|---|---|
| `Welcome` | Route to Create / Import / Enigma wallet |
| `Entropy` | Collect 200 touch-points → SHA-256 → 12-word BIP-39 |
| `GenerateMnemonic` | Display mnemonic grid; language picker; optional passphrase |
| `VerifyMnemonic` | Quiz words at 3, 7, 11 (4-choice each) |
| `ImportMnemonic` | Free-text import with live word autocomplete |
| `SetPin` | Two-phase 6-digit PIN; doubles as Change PIN (detect via `generatedWords.length == 0`) |
| `Vault` (WalletManager) | 5 chain sections; BLE connect sheet + log viewer |
| `AccountDetail` | Address, QR code, derivation path, BLE toggle |
| `Transaction` | Sign approval UI |
| `Settings` | Theme, language, security, BLE name |
| `History` | Chronological list of past signing operations with expandable details |
| `Unlock` | Cold-start PIN gate; max 5 attempts → lockout → Reset Wallet |
| `BackupSeed` | PIN-gated seed reveal |

### Navigation rules

- Auth success → `pushAndRemoveUntil` (never `push`)
- Reset wallet → `pushAndRemoveUntil('Welcome')`
- Back buttons → `pop()`
- App startup → render nothing until `hasWallet()` resolves

### Theme

Port of `packages/theme/src/index.ts`:

```dart
class ColorTokens {
  final Color primary, bg, surface, text, error, ...;
  static const dark = ColorTokens(...);
  static const light = ColorTokens(...);
}
const R = (sm: 6.0, lg: 12.0, xl: 18.0);
```

- Dark primary: `#8FC322`, bg: `#0F0F0F`, surface: `#1A1A1A`
- Light primary: `#5f8a0e`, bg: `#FFFFFF`, surface: `#FFFFFF`
- No `R.md` — use `R.lg` (12) for medium corners
- Never hardcode colors — use `C.primary`, `C.bg`, etc.
- Never hardcode radius — use `R.sm`, `R.lg`, `R.xl`

### BLE Peripheral

- GATT service UUID: `13d63400-2c97-0004-0000-4c6564676572` (same as Ledger Nano X)
- Package candidate: `flutter_blue_plus` (peripheral mode on Android)
- APDU request/response over characteristic notifications
- BLE state machine: `idle → broadcasting → connected → error`

---

## Key Dependencies (planned)

| Package | Use |
|---|---|
| `flutter_blue_plus` | BLE peripheral |
| `flutter_secure_storage` | Keychain/Keystore |
| `dart:ffi` + `ffi` package | Rust bridge |
| `provider` or `riverpod` | State management |
| `go_router` or custom navigator | Screen routing |
| `qr_flutter` or `qr` | QR code display |

---

## Development Commands

```bash
# Build Rust SDK (host)
cd rust && cargo build --release

# Build Rust SDK (Android cross-compile)
cd rust && cargo build --target aarch64-linux-android --release

# Flutter (from repo root)
flutter pub get
flutter run

# Code generation (if using freezed/json_serializable/etc.)
dart run build_runner build --delete-conflicting-outputs

# Tests (run Dart-only first, then Rust)
flutter test
cd rust && cargo test

# Full pipeline: git pull → build → install (see scripts/README.md)
./scripts/build_and_install.sh
./scripts/build_and_install.sh --skip-rust   # Dart-only changes
./scripts/build_and_install.sh --device emulator-5554
```

> Agents: use `/build-and-install [args]` to invoke the full pipeline from OpenCode.

### Test commands

```bash
# Unit tests (mock interfaces, no Rust required)
flutter test

# Single service test
flutter test lib/services/pin_auth_service_test.dart

# Rust tests
cd rust && cargo test

# Integration tests (needs Rust .so + real device)
flutter test integration_test/
```

---

## Common Pitfalls

1. **Rust FFI strings** — all string data crosses the FFI boundary as `null`-terminated `*const c_char`. Use `CString` and `CStr` consistently. Never pass Dart `String` directly without encoding.

2. **BLE peripheral on Android** — requires `BLUETOOTH_ADVERTISE` permission + location. On Android 12+ use `BLUETOOTH_PERIPHERAL`. Must be in `foreground service` for reliable advertising.

3. **PIN storage** — use PBKDF2 from Rust SDK (not Dart). Legacy SHA-256 migration path must exist. PIN never stored in plaintext.

4. **SetPin screen serves two purposes** — "create wallet PIN" and "change PIN". Detect which via `generatedWords.isEmpty`.

5. **Navigation on auth** — must clear the stack with `pushAndRemoveUntil`. Do not leave auth screens in history.

6. **No `react-native-reanimated` equivalent needed** — Flutter's built-in animation is sufficient. Do not add extra animation packages.

7. **Startup flash prevention** — check `hasWallet()` before building the widget tree. Return `SizedBox.shrink()` or a splash widget until resolved.

8. **Timing-safe PIN comparison** — implement constant-time string comparison in the Rust SDK, not in Dart.

9. **Seed cache invalidation** — clear cached seed when passphrase or mnemonic provider changes.

10. **Hermes TextDecoder workaround not needed** — Dart has built-in UTF-8 decoding via `utf8.decode()`.

11. **FFI calls in GestureDetector callbacks** — `onTapDown` / `onTap` / 等 GestureDetector 回调会**静默吞掉异常**（不崩溃也不跳转，页面直接卡死）。所有含 FFI 调用的逻辑必须用 try-catch 包裹并显式展示错误状态。

12. **Rust .so 打包进 APK** — Cargo 编译的 `.so` 不会自动打包进 Flutter APK。必须将编译产物复制到 `android/app/src/main/jniLibs/<abi>/` 目录，Gradle 才会纳入。打包后可用 `unzip -l app-debug.apk | grep .so` 验证。

13. **Rust Android 交叉编译** — 需要 (a) `rustup target add aarch64-linux-android`，(b) 在 `rust/.cargo/config.toml` 配置 NDK linker 路径，(c) `cargo build --target aarch64-linux-android --release`。

14. **GFW 构建三板斧** — (a) Gradle 仓库: `build.gradle.kts` + `settings.gradle.kts` 添加 aliyun mirror; (b) Flutter 引擎: `export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn`; (c) Rustup: TUNA 镜像仅保留最近 2 周的 nightly/beta 档案，过旧的 stable 版本可能缺少 Android target，需要 `rustup update stable`。

15. **测试机截图/临时文件放项目根 `tmp/`** — adb 截取的测试截图、`uiautomator dump` 的 XML、以及任何临时产物，统一保存到**项目根 `tmp/` 目录**（该目录已在 `.gitignore`，不会入库）。命名规范：`tmp/device_screen_<unix时间戳>.png`（截图）、`tmp/ui.xml`（UI 层级）。禁止散落到 `/tmp` 或项目其他目录——用户需要在浏览器/code-server 里随时打开查看。截图分析完成后**保留文件**，不要删除。

---

## Key Reference Files in iron-vault-mono

| mono file | What it defines |
|---|---|
| `packages/crypto/src/mnemonic.ts` | BIP-39 generation, validation, re-encoding |
| `packages/crypto/src/hdkey.ts` | BIP-32 + SLIP-10 derivation |
| `packages/crypto/src/signer.ts` | ETH/Solana signing |
| `packages/crypto/src/address.ts` | WalletAccounts type, deriveAccountsFromPaths |
| `packages/crypto/src/btc.ts` | BTC/Tron/Sui address derivation |
| `packages/wallet/src/service.ts` | Wallet lifecycle + PIN auth |
| `packages/apdu/src/handler.ts` | APDU command dispatch |
| `packages/apdu/src/constants.ts` | CLA/INS/SW enums |
| `packages/theme/src/index.ts` | ColorTokens + R constants |
| `apps/mobile/src/screens/` | All 15 screen implementations |
| `apps/mobile/src/store/AppContext.tsx` | Global state + navigation |
| `apps/mobile/src/ble/BlePeripheral.ts` | BLE GATT server bridge |


