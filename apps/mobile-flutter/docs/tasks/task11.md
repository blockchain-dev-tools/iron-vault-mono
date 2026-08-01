接下来我需要你帮我重新梳理下项目的架构，从架构角度看怎么优化可以使项目变得更合理更适合拓展。
有问题可以一起探讨。

---

## Refined Task Description

### Goal

对 `iron-vault-flutter` 项目做一次架构健康检查，识别当前架构中的技术债务和优化机会，并提出可执行的重构路线图——目标是让项目在进入下一阶段（生产加固、新链支持、新功能扩展）之前，具备清晰的分层、低耦合的模块边界、以及可测试的核心逻辑。

### Background

项目已完成 **task1–task10 + bug1–bug8a**，核心功能（14 屏幕、Rust SDK、Wallet Service、APDU Handler、BLE 外设、AirGap/EIP-4527 协议）均已实现并通过基础验证。但当前架构是在"快速搭建"阶段自然生长出来的，存在以下结构性问题：

#### 1. 上帝类问题

| 文件 | 行数 | 承担的职责 |
|------|------|-----------|
| `lib/services/wallet_service.dart` | 724 行 | PIN 认证、助记词加密、种子派生、账户派生（5 链）、持久化、PIN 尝试追踪 |
| `lib/app/app_state.dart` | 328 行 | 主题/语言/钱包 状态、BLE 生命周期、APDU 分发、自动锁定、导航追踪 |

`WalletService` 将 **安全原语（哈希/加密）** 和 **业务逻辑（账户管理）** 混在一个类中，测试困难、安全审计困难、替换 Rust 实现困难。

#### 2. 安全债务：Dart 侧自实现加密原语替代 Rust SDK

Rust SDK 有 47 个通过测试，但关键的安全操作仍在 Dart 侧用原型级代码实现：

- **PIN 哈希**: FNV-1a 多轮哈希（`_hashPin`），注释 "NOT cryptographically secure"
- **助记词加密**: XOR 单轮（`_encrypt`/`_decrypt`）
- **种子派生**: 自定义 Murmur 风格混合哈希（`_mnemonicToSeedHex`），非标准 BIP-39 PBKDF2

文件中留有 `// TODO: Replace with Rust SDK ...` 注释共 5 处。

#### 3. 关键 Bug：种子派生不一致

`ApduHandler._computeSeed()` 的后备路径使用 `$mnemonic|$passphrase`（不含 salt）计算种子，而 `WalletService._mnemonicToSeedHex()` 使用 `$mnemonic|$passphrase|$salt`。当 `setContext(mnemonic:)` 方式给 ApduHandler 设置上下文时（未传递预计算的 `seedHex`），BLE 客户端将获得**不同的私钥/地址**，与 Vault 页展示的不一致。

#### 4. 死代码：AirGap + EIP-4527 + Bip39Wordlist

- `lib/services/airgap/` (~1200 行) — 自包含的 SHA-256/Base58/CBOR 实现，无任何屏幕或服务引用
- `lib/services/eip4527/` (~800 行) — UR 编码协议，同样无引用
- `lib/data/bip39_wordlist.dart` (2342 行) — Rust SDK 已通过 FFI 提供 BIP-39 词表，此文件冗余

**总计 ~4300 行从未执行的死代码**。需要决策：连接 UI 还是移除。

#### 5. 状态管理：全树重建 + 手动构造注入

- `ListenableBuilder` 包裹了整个 `MaterialApp.router`——任何 `AppState` 的变化都触发全树 rebuild
- 屏幕通过 `router.dart` 的构造函数注入服务（`walletService`、`appState`），都是可空类型，屏幕内部被迫防御性编程
- `SettingsScreen` 无法访问 `AppState`，主题切换和重置钱包功能实际上不工作（代码中有 `TODO: Wire to AppState`）

#### 6. 重复/冗余代码

- **SHA-256** 在 `airgap_protocol.dart` 和 `wallet_service.dart` 中各实现一遍
- **Hex 编解码** 在 `crypto_bridge.dart` 和 `airgap_protocol.dart` 中各实现一遍
- `bip39_wordlist.dart` **2342 行**纯数据文件，应改为 JSON 资源文件
- `airgap_protocol.dart` **902 行**包含 SHA-256/Base58/CBOR/AirGap 4 个独立关注点
- 多个屏幕直接硬编码 `ColorTokens.dark`，light mode 不可用

#### 7. 测试缺口

- `wallet_service.dart`（724 行）**0 测试**
- `ble_peripheral.dart`（727 行）**0 测试**
- `crypto_bridge.dart`（542 行）**0 测试**
- 所有 14 个屏幕 **0 单元/Widget 测试**
- 仅 `apdu_handler_test.dart`（310 行）和 exercises 测试存在

#### 8. 模块边界模糊

- `AppState._onApduCommand()` 包含 APDU 解析+日志+调度逻辑，与 `ApduHandler` 职责重叠
- `VaultScreen` 直接订阅 BLE 日志流（`ble.logStream.listen`），UI 层耦合 BLE 实现细节
- `EntropyScreen` 在 `GestureDetector` 回调中直接调用 `CryptoBridge.generateMnemonic()`，无可测试性
- `router.dart` 需要了解所有服务和屏幕的构造函数签名——路由层泄漏服务依赖

### 模块拆分评估

> **结论：当前模块拆分存在 3 个结构性问题——粒度规则不一致、`app/` 杂货铺、缺少基础设施层。以下是逐模块评估和推荐的目标结构。**

#### 当前模块一览

| 模块 | 文件数 | 定位 | 评价 |
|------|--------|------|------|
| `app/` | 6 | 状态 + 路由 + 主题 + 组件 | 🔴 杂货铺 |
| `screens/` | 14 | UI 页面 | 🟢 合理（平铺可接受） |
| `services/` | 5+2 子目录 | 业务逻辑 + 协议 | 🟡 粒度不一致 |
| `models/` | 4 | 纯数据类型 | 🟢 干净 |
| `ble/` | 1 | BLE 外设 | 🟡 边界合理但孤立 |
| `ffi/` | 1 | Rust 桥接 | 🟡 同上 |
| `data/` | 1 | BIP-39 词表 | 🔴 死代码，删 |
| `i18n/` | 6 | 多语言 | 🟢 标准 |
| `exercises/` | 5 | 学习练习 | 🔴 位置错误 |

#### 问题 1：子系统粒度规则不一致

同样级别的"外部通信子系统"，放在不同层级：

| 模块 | 当前位置 | 层级 | 为什么这样放？ |
|------|----------|------|----------------|
| BLE 外设 | `lib/ble/` | 顶级目录 | "BLE 是重要子系统" |
| FFI 桥接 | `lib/ffi/` | 顶级目录 | "FFI 是独立边界" |
| AirGap 协议 | `lib/services/airgap/` | 二级子目录 | "是协议 → 放 services 下" |
| EIP-4527 | `lib/services/eip4527/` | 二级子目录 | 同上 |
| APDU 协议 | `lib/services/` | 平铺文件 | "是协议 → 但不配子目录?" |

新开发者无法推断：如果要加一个新协议（如 `psbt`），应该放 `lib/services/psbt/` 还是 `lib/psbt/`？

**根因**：缺少一个明确的"子系统何时获得顶级目录"的规则。建议统一为两层：

- **基础设施层**（`lib/infrastructure/`）→ 收容 BLE、FFI、持久化存储——这些都是 App 的外部边界
- **协议层**（`lib/protocols/`）→ 收容 APDU、AirGap、EIP-4527——这些都是面向特定格式的编解码逻辑

#### 问题 2：`app/` 是杂货铺

6 个文件承载 4 种完全不同的关注点：

```
app/
├── app_state.dart    ← 状态管理（本质上是个 service）
├── router.dart       ← 路由配置（infrastructure）
├── app_theme.dart    ← 主题配置（design system）
├── theme.dart        ← Design Token（design system）
└── widgets/          ← 共享 UI 组件（design system）
```

"app" 这个词过于泛化——目录下的每个文件都是 "app 的一部分"。**命名应该表达职责，而不是所有权。**

建议拆分：
- 路由 → `lib/core/router.dart`
- 主题 + 组件 → `lib/theme/`（做 design system 内聚：`color_tokens.dart` + `app_theme.dart` + `widgets/`）
- 状态 → 按领域拆入 `lib/state/`（`theme_state.dart`、`wallet_state.dart`、`ble_state.dart`）

#### 问题 3：缺少基础设施/工具层

以下内容在当前结构中没有归属，导致四处散落：

| 缺失的目录 | 当前散落在 | 后果 |
|------------|-----------|------|
| `utils/` | Hex 编解码在 `crypto_bridge.dart` 和 `airgap_protocol.dart` 各实现一遍 | 重复代码 |
| `persistence/` | `Storage` 接口和 `SharedPreferencesStorage` 实现都挤在 `models/storage.dart` | 接口和实现不分 |
| `protocols/` | APDU 平铺、AirGap 子目录、EIP-4527 子目录——三个协议三种放法 | 新人困惑 |

#### 推荐的目标结构

```
lib/
├── main.dart
├── core/                       ← 应用配置
│   └── router.dart
├── theme/                      ← Design System（内聚）
│   ├── color_tokens.dart       （原 theme.dart）
│   ├── app_theme.dart
│   └── widgets/
│       ├── chain_icons.dart
│       └── ledger_logo.dart
├── state/                      ← 状态管理（原 app_state 拆分）
│   ├── theme_state.dart
│   ├── wallet_state.dart
│   ├── ble_state.dart
│   └── locale_state.dart
├── services/                   ← 业务逻辑（不碰 UI 和硬件）
│   ├── wallet_service.dart
│   └── auto_lock_service.dart
├── infrastructure/             ← 外部边界（硬件/FFI/存储）
│   ├── ble/
│   │   └── ble_peripheral.dart
│   ├── ffi/
│   │   └── crypto_bridge.dart
│   └── persistence/
│       ├── storage.dart            ← Storage 接口
│       ├── shared_prefs_storage.dart
│       └── secure_storage.dart     （未来）
├── protocols/                  ← 协议实现
│   ├── apdu/
│   │   ├── apdu_handler.dart
│   │   └── apdu_constants.dart
│   ├── airgap/
│   │   ├── airgap_protocol.dart
│   │   └── airgap_bridge.dart
│   └── eip4527/
│       └── eip4527.dart
├── models/                     ← 不动
│   ├── wallet_accounts.dart
│   ├── apdu_message.dart
│   └── ble_types.dart
├── screens/                    ← 可加子目录（非必须）
│   ├── onboarding/             ← welcome, entropy, generate, verify, import, enigma*
│   ├── vault/                  ← vault, account_detail, transaction
│   └── settings/               ← settings, backup_seed, unlock, set_pin
├── utils/                      ← 新建
│   ├── hex.dart
│   └── crypto.dart
└── i18n/                       ← 不动
```

**相比当前结构的变化**：

| 变化 | 说明 |
|------|------|
| `app/` 消失 | 拆成 `core/` + `theme/` + `state/` |
| `ble/`、`ffi/` 归入 `infrastructure/` | 统一"外部边界"概念 |
| `airgap/`、`eip4527/`、apdu 归入 `protocols/` | 统一"协议"概念 |
| `models/storage.dart` 中的实现移入 `infrastructure/persistence/` | 接口与实现分离 |
| 新建 `utils/`、`state/` | 补充缺失的基础设施 |
| 删除 `data/` | 死代码 |
| 移出 `exercises/` | 非生产代码 |

#### 需要讨论的决策点

1. **`screens/` 要不要加子目录？** 14 个平铺目前可接受，但若预计新增 5+ 屏（如 AirGap UI、新链详情），应趁早加子目录。建议先加 `onboarding/` 和 `vault/` 两层。

2. **`state/` vs `services/` 的边界在哪？** 建议：`state/` 放纯状态（ChangeNotifier），不包含 FFI 调用、网络、硬件操作；`services/` 放业务逻辑，可调用 infrastructure 和 protocols。

3. **重构顺序**：先做模块拆分（文件移动+import 更新，不改变逻辑），还是先做 P0 安全重构（改逻辑）？建议**先拆模块再改逻辑**——干净的目录结构让后续改动更安全。

---

### Breakdown

架构重构应分优先级执行，每步可独立验证、可独立合并：

#### P0 — 安全债务清偿（必须先做）

- [ ] **P0.1**: Rust SDK 新增 `pbkdf2_verify` + `pbkdf2_hash` FFI 函数，替换 `_hashPin` 的 FNV-1a
- [ ] **P0.2**: Rust SDK 新增 `chacha20_encrypt` + `chacha20_decrypt` FFI 函数，替换 XOR 助记词加密
- [ ] **P0.3**: `_mnemonicToSeedHex` 改用已有的 Rust `bip39::Mnemonic::to_seed()`（无需新 FFI，仅修改 Dart 调用路径）
- [ ] **P0.4**: `BackupSeedScreen` 移除硬编码 PIN（`_validPin = '000000'`），改为通过路由注入 `WalletService` 进行真实验证
- [ ] **P0.5**: **修复 ApduHandler 种子不一致 Bug**：`_computeSeed()` 后备路径缺少 salt 参数，导致 BLE 返回的地址与 Vault 页展示的不一致。修复方案：统一 `setContext()` 入口，始终传递预计算的 `seedHex`，删除后备路径

#### P1 — 服务层拆分

- [ ] **P1.1**: 将 `WalletService` 拆分为：
  - `WalletAuthService` — PIN 验证/锁定/尝试追踪（~120 行）
  - `WalletCryptoService` — 种子派生/加密/解密（~80 行，薄封装 Rust FFI）
  - `WalletAccountService` — 账户派生/管理（~150 行）
  - 保留 `WalletService` 作为门面（Facade），协调以上三个子服务
- [ ] **P1.2**: 将 `AppState` 拆分为：
  - `ThemeState` — 主题 + 持久化
  - `LocaleState` — 语言 + 持久化
  - `WalletState` — 钱包存在性 + 解锁状态
  - `BleState` — BLE 外设生命周期 + 日志
  - `AutoLockService` — 后台锁定逻辑
- [ ] **P1.3**: 提取共享工具：
  - `lib/utils/hex.dart` — 唯一 Hex 编解码实现
  - `lib/utils/crypto.dart` — 从 `airgap_protocol.dart` 提取 SHA-256 独立文件（或改为调用 Rust FFI）
- [ ] **P1.4**: 死代码清理：
  - 删除 `lib/data/bip39_wordlist.dart`（Rust SDK 已通过 FFI 提供多语言 BIP-39 词表）
  - 为 AirGap/EIP-4527 模块（~2000 行）做出决策：连接 UI 或归档移除

#### P* — 模块目录重组（先于 P2，建议在新分支上做）

> 此步骤**只移动文件、更新 import，不改变任何逻辑**。干净的目录结构让后续 P2 DI 升级更安全。

- [ ] **P*.1**: 拆解 `app/`：
  - `router.dart` → `lib/core/router.dart`
  - `theme.dart` + `app_theme.dart` → `lib/theme/`
  - `app/widgets/` → `lib/theme/widgets/`
  - `app_state.dart` → 等 P1.2 拆分后各归各位
- [ ] **P*.2**: 统一基础设施层：
  - `ble/` → `lib/infrastructure/ble/`
  - `ffi/` → `lib/infrastructure/ffi/`
  - 从 `models/storage.dart` 提取实现 → `lib/infrastructure/persistence/`
- [ ] **P*.3**: 统一协议层：
  - `services/apdu_handler.dart` + `apdu_constants.dart` → `lib/protocols/apdu/`
  - `services/airgap/` → `lib/protocols/airgap/`
  - `services/eip4527/` → `lib/protocols/eip4527/`
- [ ] **P*.4**: 新建 + 清理：
  - 新建 `lib/utils/`，外移 Hex/Crypto 工具
  - 删除 `lib/data/`（死代码）
  - 移出 `lib/exercises/` → `tools/exercises/`
- [ ] **P*.5**: 全量编译验证：`flutter analyze lib/` + `flutter test` 零回归

#### P2 — 依赖注入 & 状态管理升级

- [ ] **P2.1**: 引入 `provider`（零学习成本，与现有 `ChangeNotifier` 模式兼容）或 `riverpod`（编译时安全）
- [ ] **P2.2**: 用 `MultiProvider` 替换手动构造注入——屏幕通过 `context.read<XxxState>()` 获取状态
- [ ] **P2.3**: 修复 `SettingsScreen`——通过 DI 获取 `ThemeState` + `WalletService`，使主题切换和重置钱包功能正常工作
- [ ] **P2.4**: `router.dart` 移除所有服务参数——路由不再了解服务实现

#### P3 — 模块边界清晰化

- [ ] **P3.1**: 将 `AppState._onApduCommand()` 的 APDU 分发逻辑完全移入 `ApduHandler`——`AppState` 仅做流订阅和日志记录
- [ ] **P3.2**: `VaultScreen` 不再直接订阅 `ble.logStream`——通过 `BleState`（一个 `ChangeNotifier`）暴露结构化的 BLE 状态和日志
- [ ] **P3.3**: `EntropyScreen` 的助记词生成通过 `WalletCryptoService` 调用，不直接调用 `CryptoBridge`
- [ ] **P3.4**: 提取 `BlePeripheral` 接口（`abstract class BleInterface`）以支持 mock 测试

#### P4 — 数据 & 资源优化

- [ ] **P4.1**: 将 `bip39_wordlist.dart`（2342 行）改为 JSON 资源文件，按需加载指定语言
- [ ] **P4.2**: 拆分 `airgap_protocol.dart` 为 `sha256.dart` / `base58.dart` / `cbor.dart` / `airgap_encoder.dart`
- [ ] **P4.3**: 拆分 `eip4527.dart` 为类型定义（`ur_types.dart`）和编码器（`ur_encoder.dart`）

#### P5 — 测试补全

- [ ] **P5.1**: 编写 `WalletService` 单元测试（在所有 P0/P1 重构之后）
- [ ] **P5.2**: 编写 `BlePeripheral` 单元测试（在 P3.4 接口提取之后）
- [ ] **P5.3**: 编写 `ApduHandler` 完整测试（含 wallet context 场景）
- [ ] **P5.4**: 编写关键屏幕（Welcome、Unlock、Vault）的 Widget 测试

#### P6 — 可选增强

- [ ] **P6.1**: 将 `flutter_secure_storage` 解注释，替换 `SharedPreferencesStorage` 用于敏感数据
- [ ] **P6.2**: 将 `qr_flutter` 解注释，实现 AccountDetail 和 AirGap 的 QR 码显示
- [ ] **P6.3**: 所有屏幕将硬编码 `ColorTokens.dark` 替换为 `Theme.of(context)` 感知的颜色，启用 light mode

### Files / Modules Involved

**当前结构（重构起点）：**
- `lib/app/` → 拆为 `core/` + `theme/` + `state/`
- `lib/ble/` → 归入 `infrastructure/ble/`
- `lib/ffi/` → 归入 `infrastructure/ffi/`
- `lib/services/airgap/`、`eip4527/`、apdu → 归入 `protocols/`
- `lib/data/` → 删除（死代码）
- `lib/models/storage.dart` → 实现移入 `infrastructure/persistence/`
- `lib/exercises/` → 移出 `lib/`

**目标结构（重构终点）：**

| 目标目录 | 来源 | 内容 |
|----------|------|------|
| `lib/core/` | `app/router.dart` | 路由配置 |
| `lib/theme/` | `app/theme.dart` + `app/app_theme.dart` + `app/widgets/` | Design System |
| `lib/state/` | `app/app_state.dart` 拆分 | 领域状态（ThemeState, WalletState, BleState, LocaleState） |
| `lib/services/` | `services/wallet_service.dart` 拆分 | 业务逻辑 |
| `lib/infrastructure/ble/` | `ble/ble_peripheral.dart` | BLE 外设 |
| `lib/infrastructure/ffi/` | `ffi/crypto_bridge.dart` | Rust 桥接 |
| `lib/infrastructure/persistence/` | `models/storage.dart` 实现部分 | 存储实现 |
| `lib/protocols/apdu/` | `services/apdu_handler.dart` + `apdu_constants.dart` | APDU 协议 |
| `lib/protocols/airgap/` | `services/airgap/` | 离线 QR 协议 |
| `lib/protocols/eip4527/` | `services/eip4527/` | UR 编码协议 |
| `lib/models/` | 不动 | 纯数据类型 |
| `lib/screens/` | 不动 | UI（可加子目录） |
| `lib/utils/` | 新建，Hex/Crypto 外移 | 共享工具 |
| `lib/i18n/` | 不动 | 多语言 |
| `lib/main.dart` | 不动 | 入口 |

### Notes

- **安全优先**：PIN 哈希和助记词加密是硬钱包的核心安全基元，必须在任何功能扩展前用 Rust SDK 替换 Dart 原型实现
- **渐进式重构**：每个 P 级别可以独立 PR，不阻塞其他工作。推荐的合并顺序：P0（安全）→ P1（服务拆分）→ P3.1–P3.3（边界清晰化）→ P2（DI 升级）→ P4（数据优化）→ P5（测试）
- **兼容性**：P2 引入 provider/riverpod 会改变屏幕获取服务的方式，但与 P0/P1 可以并行——P0/P1 可以直接修改现有文件，后续 P2 再统一替换获取方式
- **已有模式参考**: AGENTS.md 提到 `provider` 或 `riverpod` 作为候选状态管理方案，目前项目用的是更原始的 `ChangeNotifier` + `ListenableBuilder`
- **Rust 编译**: P0 新增 FFI 函数后需重新交叉编译 `.so` 并放置到 `android/app/src/main/jniLibs/<abi>/`
- **现有 Light mode 已经定义但不可用**：`ColorTokens.light` 存在，但因为屏幕硬编码 `ColorTokens.dark`，实际无法切换
- **ApduHandler 种子 Bug 影响 BLE 功能**：`_computeSeed()` 后备路径缺少 salt，会导致 OKX Wallet 等 BLE 客户端获得错误地址。修复应优先于其他 P0 项目
- **死代码（~4300 行）阻塞决策**：AirGap/EIP-4527（~2000 行）+ Bip39Wordlist（2342 行）从未被执行，需决定保留并连接 UI 还是移除减负
- **进度仪表盘（docs/progress/README.md）过时**：最后更新于 2026-06-01，缺少 bug4–bug8a 的记录，应在重构过程中同步更新
- **重构顺序建议**：先做模块拆分（P3 文件移动 + import 更新，不改逻辑）→ 再做 P0 安全重构（改逻辑）→ 再做 P2 DI 升级。干净的目录结构让后续改动更安全

### Open Questions

1. **DI 方案选择：provider vs riverpod？**
   - `provider` 是 Flutter 官方推荐，与现有 `ChangeNotifier` 完全兼容，迁移成本低
   - `riverpod` 提供编译时安全、无 context 依赖、更好的测试支持，但学习曲线陡一点
   - 建议：用 `provider`，与现有模式无缝衔接

2. **P0 安全重构的时机？**
   - 当前 WalletService 同时支持 FNV-1a（旧）和 Rust SDK（新）？还是直接替换？
   - 若保留旧方案：增加迁移路径和向后兼容负担
   - 建议：直接替换，因为当前没有线上用户，无兼容顾虑

3. **`flutter_secure_storage` 何时启用？**
   - 当前 PIN/助记词存储在 `SharedPreferences`（明文，root 后可读）
   - 建议在 P1 之后（`WalletAuthService` 拆分完成）启用，作为独立 PR

4. **AirGap / EIP-4527 是否当前需要连接 UI？**
   - 这两个协议的实现是 self-contained 的，但没有任何屏幕或服务调用它们
   - 是否应在此次架构重构中为其创建对应的 UI（如 AirGap QR 扫描屏）？

5. **Bip39Wordlist 的数据加载策略？**
   - 改为 JSON 资源后，是按需加载（用户所选语言）还是预加载全量？
   - 目前 2342 行包含英文 + 中文两份词表，改为 JSON 可显著减少 bundle size

6. **APDU 链处理器拆分策略？**
   - 当前 `apdu_handler.dart` (637 行) 用一个巨大的 switch 处理 6 条链
   - 可以改为策略模式：每个链一个 handler 类，ApduHandler 只做路由
   - 好处：新增链只需加一个 handler 文件，不修改 ApduHandler

7. **模块重组的执行时机？**
   - 推荐在 P0（安全重构）之前先做 P*（模块目录重组）——只移动文件不改逻辑，风险低
   - 或者等 P0/P1 都做完、服务拆清楚了再做目录重组？
   - 前者的好处是后续改动在干净的目录结构中进行；后者避免了移动文件的噪音干扰安全重构的 review
   - 建议：在新分支上先做 P*，验证零回归后合并，再基于新结构做 P0/P1

8. **`exercises/` 移出后放哪？**
   - 选项 A：`tools/exercises/` — 仍在仓库内，但不在 lib/ 中
   - 选项 B：单独仓库 — 过度设计
   - 建议：选 A，lib/ 保持纯生产代码