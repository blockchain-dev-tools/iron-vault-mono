你先确定一下，当前已经实现的iron-vault-mono里app的功能，能把iron-vault-mono剩下的功能都实现一下么？

---

## Refined Task Description

### Goal

完成 iron-vault-mono → Flutter 移植中所有剩余功能，使应用成为一个功能完整的 Ledger Nano X 兼容 BLE 硬件钱包。

### 重要发现

**iron-vault-mono 仓库在 GitHub 上不存在** (`github.com/lbh/iron-vault-mono` 返回 404)。`AGENTS.md` 是 iron-vault-mono **唯一的规范文档**（architecture spec），其中详细描述了原始 TypeScript 项目的架构、API 签名、文件结构和行为约定。本次 gap analysis 以 AGENTS.md 为唯一真源，逐模块对比 Flutter 项目的实际实现。

### 当前实现状态

**已完成 (task1–task5)**：

| 模块 | 状态 | 关键文件 |
|---|---|---|
| 设计系统 | ✅ 完成 | `lib/app/theme.dart` (ColorTokens dark/light + R 常量), `lib/app/app_theme.dart` (ThemeData) |
| App State | ✅ 完成 | `lib/app/app_state.dart` (ChangeNotifier: theme, hasWallet, screen tracking) |
| 路由 | ✅ 完成 | `lib/app/router.dart` (go_router, 15 routes, initial redirect) |
| 数据模型 | ✅ 完成 | `lib/models/` (Storage, WalletAccounts, ApduCommand/Response, BleState) |
| APDU 常量 | ✅ 完成 | `lib/services/apdu_constants.dart` (Cla/Ins/Sw 全量) |
| Rust BIP-39 | ✅ 完成 | `rust/src/mnemonic.rs` (9/9 tests), `lib.rs` (FFI exports) |
| Welcome 屏 | ✅ 完成 | 完整 UI: LedgerLogo + 3 entry cards + 导航 |
| Unlock 屏 | ✅ 完成 | 完整 UI: 数字键盘 + 震动动画 + 5次锁定 + 重置钱包 (⚠️ PIN 验证硬编码为 `'000000'`) |
| 启动流程 | ✅ 完成 | `main.dart`: `SizedBox.shrink()` 直到 `hasWallet()` 解析 |

**部分完成**：

| 模块 | 状态 | 缺什么 |
|---|---|---|
| APDU Handler | 🟡 骨架 | `lib/services/apdu_handler.dart`: 路由正确，但所有链处理器（BTC/TRX/SUI/ETH/SOL）返回 `INS_NOT_SUPPORTED`；仅 `getVersion`/`getAppName` 有实现 |
| Vault 屏 | 🟡 骨架 | 显示 5 链名称但无真实账户数据，无 BLE sheet，无日志查看器 |
| Transaction 屏 | 🟡 骨架 | 有 Approve/Reject 按钮但无实际签名逻辑，无 BLE 集成 |
| Rust hdkey/signer/address/btc | 🔴 占位 | 4 个文件全部是 `unimplemented!()` 宏 |

**完全缺失**：

| 模块 | 缺失文件 |
|---|---|
| FFI Bridge | `lib/ffi/crypto_bridge.dart` 不存在（目录仅含 `.gitkeep`） |
| Wallet Service | `lib/services/wallet_service.dart` 不存在 |
| BLE 外设 | `lib/ble/` 目录为空（仅含 `.gitkeep`） |
| 10 个屏幕 | Entropy, GenerateMnemoic, VerifyMnemonic, ImportMnemonic, SetPin, Enigma, EnigmaMnemoic, AccountDetail, Settings, BackupSeed — 全部是 `Scaffold + AppBar` 空壳 |
| 生产 Storage | `flutter_secure_storage` 实现不存在（仅 InMemoryStorage 测试用） |

### Breakdown

按依赖关系和实际缺口拆分为 4 个阶段：

#### 阶段 1：Rust 加密 SDK 补全 🔴 阻塞阶段 2

> 当前 4/5 个 Rust 模块为 `unimplemented!()` 占位。此阶段无上游依赖，4 个子任务可并行。

- [ ] **1.1 hdkey.rs** — BIP-32 (secp256k1) + SLIP-10 (Ed25519) 层次化派生
  - `derive_child(&seed, &path) -> Vec<u8>`：从 BIP-39 seed 推导到指定路径子私钥
  - 支持 hardened derivation（路径中使用 `'` 标记）
  - Dependencies：`bip32`、`ed25519-dalek`、`k256` crate
  - 完成后在 `lib.rs` 添加 FFI 导出：`derive_child_ffi` + `free_string`

- [ ] **1.2 signer.rs** — secp256k1 ECDSA + Ed25519 签名
  - `sign_secp256k1(&privkey, &message) -> Vec<u8>`（ETH/BTC/TRX）
  - `sign_ed25519(&privkey, &message) -> Vec<u8>`（SOL/SUI）
  - Dependencies：`k256`、`ed25519-dalek`
  - 完成后在 `lib.rs` 添加对应 FFI 导出

- [ ] **1.3 address.rs** — 5 链地址派生
  - Ethereum: `keccak256(pubkey)` → last 20 bytes → `0x`-prefixed hex
  - Solana: Ed25519 pubkey → base58
  - Bitcoin: P2WPKH (bech32 segwit)
  - Tron: base58check + `0x41` prefix
  - Sui: blake2b(pubkey) + `0x00` scheme byte
  - Dependencies：`sha3`(keccak256), `ripemd`, `bech32`, `bs58`

- [ ] **1.4 btc.rs** — `derive_p2wpkh` / `derive_tron_address` / `derive_sui_address` 专用工具函数

#### 阶段 2：Dart FFI + Wallet Service 🔴 阻塞阶段 3

> 强依赖：阶段 1 全部完成（Rust FFI 函数必须可用）。

- [ ] **2.1 `lib/ffi/crypto_bridge.dart`** — Dart FFI 桥接层
  - 使用 `dart:ffi` 封装 Rust FFI 函数为 Dart 静态 API：
    - `CryptoBridge.generateMnemonic(int strength) -> String`
    - `CryptoBridge.validateMnemonic(String) -> bool`
    - `CryptoBridge.reencodeMnemonic(String) -> String`
    - `CryptoBridge.deriveAccounts(String mnemonic, {String passphrase}) -> List<Map>`
    - `CryptoBridge.signEthTx(Uint8List privKey, Uint8List rlp) -> Uint8List`
    - `CryptoBridge.signSolMessage(Uint8List privKey, Uint8List message) -> Uint8List`
  - 正确处理 CString/CStr 内存管理（调用 `free_string` 释放 Rust 分配内存）
  - 正确处理 null-terminated `*const c_char` 边界

- [ ] **2.2 `lib/services/wallet_service.dart`** — 钱包生命周期服务
  - `hasWallet(Storage) -> bool` — 检查 `wallet.pinKdf` 是否存在
  - `setupWallet(Storage, mnemonic, pin, {passphrase}) -> WalletAccounts`
  - `unlockWallet(Storage, pin, {passphrase}) -> WalletAccounts?`
  - `verifyPin(Storage, pin) -> bool`
  - `getAccounts(Storage)` / `addAccount` / `removeAccount`
  - `revealMnemonic(Storage, pin) -> String`
  - `clearWallet(Storage)` / `updatePin(Storage, oldPin, newPin)`
  - PIN 存储：PBKDF2 (10k iterations, random salt)，格式 `salt_hex:hash_hex`，key `wallet.pinKdf`
  - 兼容 Legacy SHA-256 迁移路径
  - 种子缓存失效：passphrase 或 mnemonic provider 变更时清空

- [ ] **2.3 `flutter_secure_storage` 生产 Storage 实现** — 替换当前 `_NoWalletStorage` stub

#### 阶段 3：屏幕实现 (12 屏)

> 强依赖：阶段 2（Wallet Service + CryptoBridge）；部分阻塞阶段 4（Vault/AccountDetail → BLE 入口）。

**3.1 创建钱包流程（4 屏）**：

- [ ] **3.1a Entropy** — `entropy_screen.dart`（当前：空壳）
  - StatefulWidget：`GestureDetector` 收集触摸坐标
  - SHA-256 哈希坐标 → BIP-39 种子
  - 实时进度条（X/200 points）
  - 完成自动导航到 GenerateMnemonic，传递 generated mnemonic

- [ ] **3.1b GenerateMnemonic** — `generate_mnemonic_screen.dart`（当前：空壳）
  - 接收 mnemonic 参数，显示真实 12-word 网格
  - 语言选择器（BIP-39 word lists）
  - 可选 passphrase 输入
  - "I've written it down" 确认按钮 → 导航到 VerifyMnemonic

- [ ] **3.1c VerifyMnemonic** — `verify_mnemonic_screen.dart`（当前：空壳）
  - 接收 mnemonic 参数
  - 在位置 3, 7, 11 依次出题，每题 4 选 1
  - 错误回答 → 重试；全部正确 → 导航到 SetPin
  - 选项从 BIP-39 word list 随机抽取 + 混入正确答案

- [ ] **3.1d SetPin** — `set_pin_screen.dart`（当前：空壳）
  - StatefulWidget：两阶段 6-digit PIN 输入（输入 + 确认）
  - 数字键盘 (0-9 + backspace)，PIN 圆点填充动画
  - 模式检测：`generatedWords.isNotEmpty` → 创建模式 / `generatedWords.isEmpty` → 变更模式
  - 创建模式：调用 `WalletService.setupWallet` → 导航到 Vault（`pushAndRemoveUntil`）
  - 变更模式：调用 `WalletService.updatePin` → `pop()`

**3.2 导入 / Enigma 流程（3 屏）**：

- [ ] **3.2a ImportMnemonic** — `import_mnemonic_screen.dart`（当前：空壳）
  - StatefulWidget：自由文本输入 + 实时 BIP-39 单词自动补全（2048 word list）
  - 支持空格/换行分隔的 12/24 词输入
  - 实时验证 + 错误提示
  - 有效导入 → 导航到 SetPin

- [ ] **3.2b Enigma** — `enigma_screen.dart`（当前：空壳）
  - Enigma 入口屏 + 触摸收集（参照 mono Enigma 协议逻辑）
  - "Start Enigma Setup" → 导航到 EnigmaMnemonic

- [ ] **3.2c EnigmaMnemonic** — `enigma_mnemonic_screen.dart`（当前：空壳）
  - 接收 Enigma 生成的 mnemonic，展示 12 词
  - 确认按钮 → 导航到 SetPin

**3.3 主界面流程（4 屏）**：

- [ ] **3.3a Vault** — `vault_screen.dart`（当前：骨架）
  - 从 WalletService 获取真实账户数据，按 5 链分组（ETH/SOL/BTC/TRX/SUI）
  - 每链显示账户数量 + 展开显示账户地址
  - 点击账户 → 导航到 `AccountDetail`
  - BLE 连接 sheet 入口（阶段 4 集成）
  - 日志查看器
  - Settings 按钮 → 导航到 Settings

- [ ] **3.3b AccountDetail** — `account_detail_screen.dart`（当前：空壳）
  - 接收账户参数（chain, address, derivation path）
  - 地址展示 + 复制到剪贴板
  - QR 码显示（`qr_flutter`）
  - 派生路径展示
  - BLE 启用/禁用开关

- [ ] **3.3c Transaction** — `transaction_screen.dart`（当前：骨架）
  - 接收交易参数（from, to, value, chain, raw data）
  - 交易详情展示
  - Approve 按钮 → 调用 `WalletService.signTransaction` → 通过 BLE 返回签名
  - Reject 按钮 → 通过 BLE 返回拒绝

- [ ] **3.3d Settings** — `settings_screen.dart`（当前：空壳）
  - 主题切换（dark/light）— 调用 `AppState.toggleTheme()`
  - 语言选择
  - 安全设置（变更 PIN → 导航到 SetPin 变更模式）
  - BLE 设备名称可编辑

**3.4 辅助屏幕（1 屏）**：

- [ ] **3.4 BackupSeed** — `backup_seed_screen.dart`（当前：空壳）
  - PIN 输入门控 → 调用 `WalletService.revealMnemonic`
  - 种子词展示 + 安全警告

#### 阶段 4：BLE 外设

> 强依赖：阶段 2（APDU Handler 已有骨架 + Wallet Service）+ 阶段 3 的 Vault/AccountDetail 屏。

- [ ] **4.1 `lib/ble/ble_peripheral.dart`** — GATT Server 核心
  - 注册 service UUID `13d63400-2c97-0004-0000-4c6564676572`
  - APDU command characteristic (0002) — write with response
  - APDU response characteristic (0001) — notify
  - 状态机：idle → broadcasting → connected → error
  - Android 权限：`BLUETOOTH_ADVERTISE` + `BLUETOOTH_PERIPHERAL` (12+)
  - Package: `flutter_blue_plus`

- [ ] **4.2 BLE 与屏幕集成**
  - Vault 屏：BLE 连接 sheet（设备可见性切换、连接状态、日志流）
  - AccountDetail 屏：BLE 启用/禁用开关

### Files / Modules Involved

**新建文件（4 个）**：

| 文件 | 描述 |
|---|---|
| `lib/ffi/crypto_bridge.dart` | Dart FFI 桥接层（封装 Rust FFI 函数） |
| `lib/services/wallet_service.dart` | Wallet Service（钱包生命周期 + PIN 认证 + PBKDF2） |
| `lib/ble/ble_peripheral.dart` | BLE GATT Server 核心实现 |
| `lib/ble/ble_manager.dart` | BLE 状态管理 |

**需完整实现的屏幕文件（12 个，当前均为 Scaffold 空壳）**：

| 文件 | 当前 | 需实现 |
|---|---|---|
| `entropy_screen.dart` | 空壳 StatelessWidget | GestureDetector 触摸收集 + SHA-256 + 进度条 |
| `generate_mnemonic_screen.dart` | 空壳 StatelessWidget | 真实 12 词网格 + 语言选择 + passphrase |
| `verify_mnemonic_screen.dart` | 空壳 StatelessWidget | 位置 3/7/11 四选一测验 |
| `import_mnemonic_screen.dart` | 空壳 StatelessWidget | TextField + BIP-39 自动补全 + 验证 |
| `set_pin_screen.dart` | 空壳 StatelessWidget | 两阶段 6-digit PIN + 数字键盘 + 模式检测 |
| `enigma_screen.dart` | 空壳 StatelessWidget | Enigma 入口 + 触摸收集 |
| `enigma_mnemonic_screen.dart` | 空壳 StatelessWidget | Enigma 生成 mnemonic 展示 |
| `vault_screen.dart` | 骨架 (5 链列表) | 真实账户数据 + BLE sheet + 日志 |
| `account_detail_screen.dart` | 空壳 StatelessWidget | 地址 + QR 码 + 派生路径 + BLE 开关 |
| `transaction_screen.dart` | 骨架 (有按钮) | 真实交易数据 + 签名/拒绝逻辑 |
| `settings_screen.dart` | 空壳 StatelessWidget | 主题切换 + 语言 + 安全 + BLE 名称 |
| `backup_seed_screen.dart` | 空壳 StatelessWidget | PIN 门控 + 种子词展示 |

**Rust 模块（4 个，当前均为 `unimplemented!()` 占位）**：

| 文件 | 需实现 |
|---|---|
| `rust/src/hdkey.rs` | BIP-32 + SLIP-10 层次化派生 |
| `rust/src/signer.rs` | secp256k1 ECDSA + Ed25519 签名 |
| `rust/src/address.rs` | 5 链地址派生 |
| `rust/src/btc.rs` | BTC P2WPKH / Tron base58check / Sui |
| `rust/src/lib.rs` | 添加 hdkey/signer/address 的 FFI 导出函数 |

**需更新的现有文件**：

| 文件 | 变更 |
|---|---|
| `lib/screens/unlock_screen.dart` | 替换硬编码 `'000000'` 为 `WalletService.verifyPin()` |
| `lib/screens/welcome_screen.dart` | 改为 `context.go()` 导航（当前使用 `Navigator.push`） |
| `lib/app/app_state.dart` | 添加 WalletService 实例管理、PIN 尝试计数持久化 |
| `lib/app/router.dart` | 可能需要调整路由参数传递 |
| `lib/main.dart` | 集成 WalletService 初始化 + `flutter_secure_storage` |
| `pubspec.yaml` | 添加 `ffi`、`flutter_blue_plus`、`flutter_secure_storage`、`qr_flutter`、`path_provider` |
| `rust/Cargo.toml` | 添加 `bip32`、`ed25519-dalek`、`k256`、`sha3`、`ripemd`、`bech32`、`bs58` |

### Notes

1. **阶段间依赖不可跳过**：阶段 2 依赖阶段 1 的 Rust FFI 函数；阶段 3 依赖阶段 2 的 WalletService + CryptoBridge；阶段 4 依赖阶段 2（APDU Handler）和阶段 3（Vault/AccountDetail 作为 BLE 入口）。
2. **阶段内可并行**：阶段 1 的 hdkey/signer/address/btc 可同时开发；阶段 3 的多个屏幕可分配给不同并行工作流。
3. **iron-vault-mono 仓库不存在**：`github.com/lbh/iron-vault-mono` 返回 404。所有实现参考 AGENTS.md 规范 + 行业标准（BIP-39/32/44, SLIP-10, Ledger APDU 协议）。
4. **Pitfall 关注**：参照 AGENTS.md 第 192–212 行的 10 个常见陷阱，特别注意 FFI 字符串边界、BLE Android 权限、PIN 存储 PBKDF2、SetPin 双用途、导航栈清理。
5. **主题约束**：所有屏幕必须使用 `ColorTokens`（`C.primary`、`C.bg` 等）和 `R` 常量（`R.sm`、`R.lg`、`R.xl`），不得硬编码颜色或圆角。
6. **UI 模式参考**：已完成的 Welcome 屏和 Unlock 屏作为 UI 模式和代码风格参考。新屏幕应保持一致的 StatefulWidget 结构、主题使用方式和动画风格。
7. **测试策略**：每个 Rust 模块完成后添加测试（参照 mnemonic 的 9 测试模式）。Dart 侧：Wallet Service 和 APDU Handler 需单元测试；关键屏幕（SetPin, Unlock, Vault）需 Widget 测试。
8. **安全关键路径**：PIN 验证必须使用 Rust SDK 中的 timing-safe 比较（AGENTS.md Pitfall #8）。PIN 明文不得在任何地方日志或持久化。

### Open Questions

1. **优先实现哪条流程？** 建议按依赖关系：创建钱包流程（Entropy → GenerateMnemonic → VerifyMnemonic → SetPin）作为第一条完整通路，然后是导入流程（ImportMnemonic → SetPin），最后是 Enigma。
2. **Rust hdkey 实现方案：使用 `bip32` crate 还是手写？** `bip32` crate 的 hardened derivation 支持和跨链路径兼容性需调研后确认。
3. **BLE 外设模式：`flutter_blue_plus` 的 peripheral mode 在 Android/iOS 上的实际可用性？** 是否需要备选方案或独立原生实现？
4. **State Management 升级？** 当前使用 `ChangeNotifier`。随着 Wallet Service 和 BLE 状态的加入，是否需要迁移到 `riverpod`？（AGENTS.md 列为候选）
5. **Enigma 功能范围？** iron-vault-mono 的 Enigma 协议逻辑在 AGENTS.md 中只有一行描述（"Collect 200 touch-points → SHA-256 → 12-word BIP-39"）。Enigma 与 Entropy 的差异需要确认——是仅 UI 不同还是种子生成逻辑不同？
6. **i18n 实现时机？** AGENTS.md 提到 Flutter 内置 i18n via `.arb`。当前所有文本为硬编码英文。是否在本任务中建立 i18n 框架？
