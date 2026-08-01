---
title: "分层架构重构：5 层 + 5 Service + 接口隔离 + TDD"
status: draft
created: 2026-06-21
---

# 分层架构重构

## Goal

将 `iron-vault-flutter` 从"快速搭建自然生长"的架构重构为**水平分层 + 接口隔离**的架构，实现每个 Service 可独立 mock 测试、加新功能只改少量文件、依赖方向单向可控。

## Background

当前问题（详见 [discuss001](../discusses/discuss001.md)）：

| 问题 | 现状 |
|------|------|
| 上帝类 | `AppState` 322 行管 8 件事（主题/BLE/wallet/auto-lock/APDU/nav） |
| 类臃肿 | `WalletService` 704 行混了 PIN 认证、加解密、账号派生、持久化 |
| 耦合 | Screen 直接调 `CryptoBridge`（FFI），跳过 service 层 |
| 测试难 | 测 PIN 锁定需要 Rust .so + 真 Storage + 完整助记词 |
| 接口混放 | `Storage` 接口和 `WalletAccounts` 数据并存于 `models/` |

## Decision: 5 层 + 5 Service

### 分层结构

```
lib/
├── core/                         ← 最内层：实体 + 抽象接口（纯 Dart，零依赖）
│   ├── models/                   ← WalletAccounts, ApduCommand, BleTypes...
│   └── interfaces/               ← Storage, ICryptoService, IWalletRepository...
│
├── data/                         ← 数据层：Repository 实现（只做存取，不做判断）
│   ├── repositories/             ← WalletRepositoryImpl, SettingsRepositoryImpl
│   └── bip39_wordlist.dart
│
├── services/                     ← 业务层：5 个 Service
│   ├── wallet_service.dart        ← 钱包生命周期编排（setup/unlock/lock/reset）
│   ├── pin_auth_service.dart      ← PIN 认证（验证/修改/尝试计数/锁死）
│   ├── account_service.dart       ← 账号管理（5 链派生/增删）
│   ├── mnemonic_service.dart      ← 助记词生成+验证+Enigma
│   └── settings_service.dart      ← 设置（主题/语言/BLE名称/storePassphrase）
│
├── infrastructure/               ← 基础设施（基本不改）
│   ├── ble/ble_peripheral.dart
│   ├── ffi/crypto_bridge.dart     ← 实现 ICryptoService
│   └── persistence/               ← 实现 Storage
│
├── protocols/                    ← 协议层（不改）
│   ├── apdu/
│   ├── airgap/
│   └── eip4527/
│
├── app/                          ← 应用组装（AppState 瘦身）
│   └── app_state.dart             ← 只做：生命周期协调 + BLE ↔ APDU 桥接
│
└── ui/                           ← 表现层
    ├── screens/                   ← 14 屏，逻辑尽量薄
    ├── theme/
    └── i18n/
```

### 依赖方向（单向，不可逆）

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
| `data/` | `core/` only | `services/`, `ui/`, `app/` |
| `infrastructure/` | `core/` only | `services/`, `ui/`, `app/` |
| `services/` | `core/` only | `data/`, `infrastructure/`, `ui/` |
| `app/` | `services/`, `infrastructure/`, `core/` | `ui/`, `data/` |
| `ui/` | `services/`, `core/` | `data/`, `infrastructure/` |

### 5 个 Service 职责边界

| Service | 拥有 | 不拥有 |
|---|---|---|
| `WalletService` | 钱包生命周期编排（setup/unlock/lock/reset） | PIN 验证、加密、账号派生 |
| `PinAuthService` | PIN 哈希、验证、尝试计数、锁死 | 助记词加密（委托给加密服务） |
| `AccountService` | 5 链账号派生、增删 | 钱包生命周期、PIN |
| `MnemonicService` | BIP-39 生成/验证、Enigma 派生 | PIN、账号管理 |
| `SettingsService` | 主题、语言、BLE设备名、storePassphrase | 任何钱包相关内容 |

### 文件放置规则

| 要添加的内容 | 放哪里 | 示例 |
|---|---|---|
| 新数据类型 | `core/models/` | `ChainAccount`, `Transaction` |
| 新接口 | `core/interfaces/` | `IAuthStrategy`, `ISettingsRepository` |
| 新 Repository 实现 | `data/repositories/` | `WalletRepositoryImpl` |
| 新 Service | `services/` | `PinAuthService`, `TransactionService` |
| 新协议处理器 | `protocols/` | 新链的 APDU handler |
| 新屏幕 | `ui/screens/<feature>/` | `ui/screens/auth/unlock_screen.dart` |
| 静态数据/配置 | `data/` | BIP-39 词表 |
| 平台/设备代码 | `infrastructure/` | BLE, FFI, persistence |

## Breakdown

### Phase 1 — 准备工作（不改代码）

- [ ] 创建 `docs/adr/001-layered-architecture.md` — 架构决策记录（背景→方案→决定→后果）
- [ ] 创建 `docs/guides/testing.md` — 测试指南（分层测试策略 + mock 原则 + 集成测试时机）
- [ ] 更新 `docs/progress/README.md` — 新架构的模块状态记录
- [ ] 更新 `AGENTS.md` — 写入分层规范 + 文件放置规则 + TDD 流程

### Phase 2 — core/ 层重构

- [ ] 新建 `core/interfaces/` 目录
- [ ] 将 `models/storage.dart`（`Storage` 抽象类）移动到 `core/interfaces/storage.dart`
- [ ] 从 `WalletService` 提取 `IWalletRepository` 接口 → `core/interfaces/wallet_repository.dart`
- [ ] 从 `WalletService` 提取 `ICryptoService` 接口 → `core/interfaces/crypto_service.dart`
- [ ] 从 `AppState` 提取 `ISettingsRepository` 接口 → `core/interfaces/settings_repository.dart`
- [ ] 确认 `core/models/` 下所有文件只有纯数据结构，无业务逻辑、无 I/O
- [ ] 全局更新 import 路径（所有引用 `models/storage.dart` 的地方）

### Phase 3 — data/ 层重构

- [ ] 新建 `data/repositories/` 目录
- [ ] 创建 `data/repositories/wallet_repository_impl.dart` — 实现 `IWalletRepository`
  - 从 `WalletService` 移入：存储 key 常量、序列化逻辑、`_saveAccounts` / `_loadAllPersistedAccounts`
- [ ] 创建 `data/repositories/settings_repository_impl.dart` — 实现 `ISettingsRepository`
  - 从 `AppState` 移入：`_persistThemeMode`、`_persistLocale`、`_persistStorePassphrase`、`loadSettings`
- [ ] 将 `infrastructure/persistence/` 下的 `SharedPreferencesStorage` 和 `InMemoryStorage` **保留不动**（它们实现 `Storage` 接口，位置合理）

### Phase 4 — services/ 层重构（核心）

- [ ] **拆分 `WalletService` → 5 个 Service：**
- [ ] `services/wallet_service.dart`（~180 行）— 只做生命周期编排：setup/unlock/lock/reset，依赖其他 Service
- [ ] `services/pin_auth_service.dart`（~120 行）— 从 WalletService 拆出：
  - `_hashPin`、`verifyPin`、`updatePin`、`_incrementPinAttempts`、`_resetPinAttempts`、`isLocked`
- [ ] `services/account_service.dart`（~120 行）— 从 WalletService 拆出：
  - `_deriveDefaultAccounts`、`_deriveSingleAccount`、`addAccount`、`removeAccount`
- [ ] `services/mnemonic_service.dart`（~80 行）— 整合：
  - `_mnemonicToSeedHex`（从 WalletService）
  - `_fingerprintMnemonic`（从 WalletService）
  - `generateMnemonic`（封装 CryptoBridge，替代 EntropyScreen 直接调 FFI）
  - `generateEnigmaMnemonic`（从 `utils/enigma.dart` 移入或委托）
- [ ] `services/settings_service.dart`（~60 行）— 从 AppState 拆出：
  - 主题/语言/BLE名称/storePassphrase 的读写
  - 作为 `ChangeNotifier`，UI 层通过 `context.watch` 监听

### Phase 5 — app/ 层瘦身

- [ ] `AppState` 移除：
  - 主题/语言/设置持久化 → 委托给 `SettingsService`
  - BLE APDU 命令分发中的日志逻辑（保留桥接角色）
- [ ] `AppState` 保留：
  - 钱包存在性判断 → 调用 `WalletService.hasWallet()`
  - Auto-lock 定时器（5 分钟后台锁定）
  - BLE ↔ APDU 桥接（`_onApduCommand`）
  - App 生命周期协调（`onAppBackgrounded` / `onAppForegrounded`）

### Phase 6 — ui/ 层调整

- [ ] `lib/screens/` → `lib/ui/screens/`（目录移动 + 全局 import 更新）
- [ ] `lib/theme/` → `lib/ui/theme/`
- [ ] `lib/i18n/` → `lib/ui/i18n/`
- [ ] 屏幕重构原则：逻辑尽量薄，业务逻辑委托 Service
  - `EntropyScreen._finalize()` 不再直接调 `CryptoBridge`，改用 `MnemonicService`
  - `VerifyMnemonicScreen` 的验证逻辑委托给 `MnemonicService`
  - `ImportMnemonicScreen` 的自动补全和验证委托给 `MnemonicService`

### Phase 7 — 测试体系 + TDD 规范

- [ ] 为 5 个新 Service 各写单元测试（TDD 方式：先写测试，再写实现）
  - `services/pin_auth_service_test.dart` — mock `IWalletRepository`
  - `services/account_service_test.dart` — mock `ICryptoService`
  - `services/mnemonic_service_test.dart` — mock `ICryptoService`
  - `services/wallet_service_test.dart` — mock 所有依赖接口
  - `services/settings_service_test.dart` — mock `ISettingsRepository`
- [ ] 为 Repository 实现写单元测试
  - `data/repositories/wallet_repository_impl_test.dart` — mock `Storage`
  - `data/repositories/settings_repository_impl_test.dart` — mock `Storage`

### Phase 8 — 验证

- [ ] `flutter analyze` — 零新问题
- [ ] `flutter test` — 所有新测试 + 已有测试通过
- [ ] `cargo test` — Rust 侧不受影响，54 测试通过
- [ ] Android arm64 APK 编译通过
- [ ] 真机验收：3 条核心用户流（Import / Create / Unlock）功能正常

## Verification Checklist

- [ ] 所有文件 import 遵守分层依赖规则（"import 不该 import 的东西" → analyze 报错）
- [ ] `core/` 下没有任何其他层的 import
- [ ] `services/` 下没有任何 `data/` 或 `infrastructure/` 的 import（只 import `core/`）
- [ ] 每个新 Service 的单元测试可以独立运行（`flutter test services/pin_auth_service_test.dart`）
- [ ] 5 个 Service 职责无交叉（不改一个功能需要同时改两个 Service 的情况）

## Knowledge Crystallization

### 模式记录

- **水平分层 + UI 按功能分组**：下层（core/data/services/infrastructure）按技术职责分层，上层（ui/screens/）按功能建目录。Feature-First 的"功能间交叉依赖"问题通过 services 层下沉共享逻辑解决。
- **接口隔离**：每个 Service 只依赖 `core/interfaces/` 的抽象，不知道具体实现。测试 mock 接口，生产注入实现。换存储方案只改 RepositoryImpl。
- **新功能代价衡量**：加一种新解锁方式（Enigma 不存 PIN）→ 只改 7 个文件（+1 接口 +1 Service，改 WalletService 2 行，其余不动）。

### 测试策略

- **单元测试**（mock 接口，<0.5s）：测业务编排、流程顺序、边界条件
- **集成测试**（真调 Rust FFI，10s+）：测 crypto 正确性、Enigma 确定性
- **测试文件与源文件并列**：`services/pin_auth_service_test.dart` 与 `services/pin_auth_service.dart` 同目录

## Files Created/Modified

### 新建（19 files）

**docs/**
- `docs/adr/001-layered-architecture.md`
- `docs/guides/testing.md`

**core/**
- `core/interfaces/storage.dart`（从 `models/` 移动）
- `core/interfaces/wallet_repository.dart`
- `core/interfaces/crypto_service.dart`
- `core/interfaces/settings_repository.dart`

**data/**
- `data/repositories/wallet_repository_impl.dart`
- `data/repositories/settings_repository_impl.dart`

**services/**
- `services/pin_auth_service.dart`
- `services/account_service.dart`
- `services/mnemonic_service.dart`
- `services/settings_service.dart`

**tests/**
- `services/pin_auth_service_test.dart`
- `services/account_service_test.dart`
- `services/mnemonic_service_test.dart`
- `services/wallet_service_test.dart`
- `services/settings_service_test.dart`
- `data/repositories/wallet_repository_impl_test.dart`
- `data/repositories/settings_repository_impl_test.dart`

### 修改（~10 files）

- `AGENTS.md` — 分层规范 + TDD 流程
- `docs/progress/README.md` — 模块状态更新
- `lib/services/wallet_service.dart` — 大幅精简
- `lib/app/app_state.dart` — 瘦身
- `lib/core/router.dart` — import 路径更新
- `lib/main.dart` — 依赖注入调整
- `lib/screens/` 下多个文件 — import 路径更新 + UI 重构

### 不动的文件（30+ files）

- `infrastructure/` 全部
- `protocols/` 全部
- `theme/` 全部（仅目录移动）
- `i18n/` 全部（仅目录移动）
- `utils/enigma.dart`（逻辑委托给 MnemonicService 后可移除或保留）
- `data/bip39_wordlist.dart`
- `rust/` 全部
