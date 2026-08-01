# 项目进度仪表盘

> 最后更新：2026-07-04 (task16: Rust SDK 三层 workspace + FFI 现代化 + 错误处理 + feature flags)
> 
> Agent 每次完成任务后**必须**更新此文件的模块状态和最后更新时间。

---

## 总体健康

| 指标 | 状态 |
|---|---|
| `flutter analyze lib/` | ✅ 零新错误（仅预存 tools/exercises 错误）|
| `cargo test` | ✅ 84/84 passed (+ ChainError + thiserror) |
| `flutter test` | ✅ 192/194（2 预存 APDU 失败不变）|
| Dart 桥接 | ✅ FfiResult 模式，free_ffi_result 释放 |
| `cargo build --release` | ✅ 零错误 (host + arm64-v8a cross-compile) |
| `flutter build apk --debug` | ✅ 已安装到测试设备 |
| 任务进度 | task1–task14 完成 ✅；task15 完成 ✅；task16 完成 ✅ (Rust SDK 三层重组) |

---

## 模块进度

### Flutter 层

| 模块 | 进度 | 测试 | 关键文件 |
|---|---|---|---|
| Core / Router | ✅ 完成 | — | `lib/core/router.dart` |
| Core / Interfaces | ✅ 新建 | — | `lib/core/interfaces/` (5 接口: Storage, ICryptoService, IWalletRepository, ISettingsRepository, IPinAuthService, IAccountService, IMnemonicService) |
| Core / Models | ✅ 完成 | — | `lib/core/models/` (WalletAccounts, ApduCommand/Response+PendingSignRequest, BleTypes) |
| Data / Repositories | ✅ 新建 | — | `lib/data/repositories/` (WalletRepositoryImpl, SettingsRepositoryImpl) |
| App State | ✅ 完成 (签名拦截 + approve/reject) | — | `lib/app/app_state.dart` (BLE 桥接 + APDU 签名拦截 pending 机制) |
| Theme / Design System | ✅ 完成 | — | `lib/ui/theme/color_tokens.dart`, `app_theme.dart`, `widgets/` |
| i18n 多语言 | ✅ 完成 | — | `lib/ui/i18n/` (4 .arb, EN/ZH/JA/KO) |
| Screens | ✅ 17/17 → `ui/screens/` | — | +SignatureResultScreen |
| 　├ TransactionScreen | ✅ 重写 | — | 签名确认页：解析/chainId/decimals/地址高亮/Data 折叠 |
| 　├ SignatureResultScreen | ✅ 新建 | — | 签名结果页 |
| 　└ AccountDetailScreen | ✅ 清理 | — | 移除 Sign Transaction 按钮 |
| FFI Bridge (Dart) | ✅ 完 | — | `lib/infrastructure/ffi/crypto_bridge.dart` (+parseSignData)|
| Wallet Service | ✅ 完成 (拆为 5 Services) | — | `lib/services/` |
| 　├ WalletService | ✅ 完成 | — | 只做生命周期编排 (setup/unlock/lock/reset) |
| 　├ PinAuthService | ✅ 新建 | — | PIN 认证 (hash/verify/update/chacha20/attempts) |
| 　├ AccountService | ✅ 新建 | — | 5 链账号派生 (derive/add/remove) |
| 　├ MnemonicService | ✅ 新建 | — | 助记词生成/验证/种子/指纹/Enigma |
| 　└ SettingsService | ✅ 新建 | ✅ 12/12 | 设置管理 (ChangeNotifier, 委托 ISettingsRepository) |
| AirGap 协议 | ✅ 完成 (待接UI) | — | `lib/protocols/airgap/` |
| EIP-4527 | ✅ 完成 (待接UI) | — | `lib/protocols/eip4527/` |
| Utils | ✅ 新建 | — | `lib/utils/hex.dart` |
| Assets | ✅ 新建 | — | `assets/chains.json` (链名映射) |

### Rust 层 — 三层 Workspace 架构

#### L1: iron-vault-crypto（加密原语层）

| 模块 | 进度 | 测试 | 关键文件 |
|---|---|---|---|
| secp256k1 | ✅ 完成 | ✅ 4/4 | `rust/iron-vault-crypto/src/secp256k1.rs` |
| ed25519 | ✅ 完成 | ✅ 3/3 | `rust/iron-vault-crypto/src/ed25519.rs` |
| keccak256 | ✅ 完成 | ✅ 4/4 | `rust/iron-vault-crypto/src/keccak256.rs` |
| blake2b | ✅ 完成 | ✅ 2/2 | `rust/iron-vault-crypto/src/blake2b.rs` |
| hash160 | ✅ 完成 | ✅ 3/3 | `rust/iron-vault-crypto/src/hash160.rs` |
| sha256d | ✅ 完成 | ✅ 3/3 | `rust/iron-vault-crypto/src/sha256d.rs` |
| bech32 | ✅ 完成 | ✅ 2/2 | `rust/iron-vault-crypto/src/bech32.rs` |
| base58 | ✅ 完成 | ✅ 3/3 | `rust/iron-vault-crypto/src/base58.rs` |
| rlp | ✅ 完成 | ✅ 3/3 | `rust/iron-vault-crypto/src/rlp.rs` |
| pbkdf2_chacha20 | ✅ 完成 | ✅ 4/4 | `rust/iron-vault-crypto/src/pbkdf2_chacha20.rs` |
| bip39 (seed derivation) | ✅ 完成 | ✅ 6/6 | `rust/iron-vault-crypto/src/bip39.rs` |

#### L2: iron-vault-biz（业务逻辑层）

| 模块 | 进度 | 测试 | 关键文件 |
|---|---|---|---|
| hdkey (BIP-32/SLIP-10) | ✅ 完成 | ✅ 8/8 | `rust/iron-vault-biz/src/hdkey.rs` |
| mnemonic (generate/validate) | ✅ 完成 | ✅ 6/6 | `rust/iron-vault-biz/src/mnemonic.rs` |
| enigma | ✅ 完成 | ✅ 8/8 | `rust/iron-vault-biz/src/enigma.rs` |
| eth (签名+地址+EIP-55) | ✅ 完成 | ✅ 9/9 | `rust/iron-vault-biz/src/eth.rs` |
| solana | ✅ 完成 | ✅ 4/4 | `rust/iron-vault-biz/src/solana.rs` |
| btc | ✅ 完成 | ✅ 2/2 | `rust/iron-vault-biz/src/btc.rs` |
| tron | ✅ 完成 | ✅ 1/1 | `rust/iron-vault-biz/src/tron.rs` |
| sui | ✅ 完成 | ✅ 2/2 | `rust/iron-vault-biz/src/sui.rs` |
| parser (RLP 交易解析) | ✅ 完成 | ✅ 7/7 | `rust/iron-vault-biz/src/parser.rs` |

#### L3: iron-vault-ffi（FFI 边界层）

| 模块 | 进度 | 关键文件 |
|---|---|---|
| FfiResult / 错误码映射 | ✅ 完成 | `rust/iron-vault-ffi/src/types.rs` |
| extern "C" 导出 (25 函数) | ✅ 完成 | `rust/iron-vault-ffi/src/lib.rs` |
| zeroize 敏感数据清除 | ✅ 完成 | 所有 seed/privkey FFI 函数 |
| Feature flag 条件编译 | ✅ 完成 | eth/sol/btc/tron/sui 可选 |

---

## 关键依赖状态

| 依赖 | 状态 | 用途 |
|---|---|---|
| `go_router` | ✅ 已激活 | 导航路由 |
| `ffi` (Dart) | ✅ 已添加 | Dart FFI String 转换 |
| `flutter_secure_storage` | ⬜ 注释中 | 安全存储（待 P1 之后启用） |
| `ble_gatt_server` | ✅ 已激活 | BLE GATT Server (Ledger Nano X) |
| `qr_flutter` | ⬜ 注释中 | QR 码显示 |
| Rust `bip39` v2 | ✅ | BIP-39 助记词 |
| Rust `bip32` v0.5 | ✅ | BIP-32 secp256k1 派生 |
| Rust `ed25519-dalek` v2 | ✅ | Ed25519 签名 |
| Rust `k256` v0.13 | ✅ | secp256k1 ECDSA |
| Rust `sha3` v0.10 | ✅ | Keccak-256 |
| Rust `sha2` v0.10 | ✅ | SHA-256 |
| Rust `ripemd` v0.1 | ✅ | RIPEMD-160 |
| Rust `bech32` v0.11 | ✅ | SegWit 地址 |
| Rust `bs58` v0.5 | ✅ | Base58 编解码 |
| Rust `blake2` v0.10 | ✅ | Sui 地址 |
| Rust `pbkdf2` v0.12 | ✅ | PBKDF2-HMAC-SHA256 (PIN auth) |
| Rust `chacha20poly1305` v0.10 | ✅ | ChaCha20-Poly1305 |
| Rust `rlp` v0.5 | ✅ 新增 | ETH 交易 RLP 解码 |

---

## 最近完成

| 日期 | 内容 |
|---|---|
| 2026-07-04 | **task16 全部 Phase 完成** — 单体 → 三层 workspace + FFI 现代化 + 错误处理 + feature flags |
| 2026-07-04 | **iron-vault-crypto**: 37 tests，新增 `CryptoError`（thiserror）|
| 2026-07-04 | **iron-vault-biz**: 47 tests，新增 `ChainError`（thiserror + From&lt;CryptoError&gt;）|
| 2026-07-04 | **iron-vault-ffi**: `FfiResult` 结构体替代 null 返回，`free_ffi_result` 释放，`zeroize` 清除敏感数据 |
| 2026-07-04 | **Dart 桥接更新**: 所有 FFI 绑定改为 `Pointer&lt;FfiResult&gt;`，新 `_resultToStr/OptionalStr` 错误处理 |
| 2026-07-04 | **Feature flags**: eth/sol/btc/tron/sui 条件编译，default = all |
| 2026-07-04 | **task15 BLE 签名确认流程完成** |

---

## 下一步

1. **ABI 文件加载系统**：外部 Ethereum ABI JSON → Rust 通用参数解码器
2. **更多链交易解析**：SOL/BTC/TRON/SUI 交易解析
3. **EIP-712 多 APDU 流程完善**：INS 0x0C → 0x0D 拦截验证
