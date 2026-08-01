---
title: "分层架构 + 接口隔离"
status: accepted
date: 2026-06-21
superseded_by: ""
---

# ADR-001: 分层架构 + 接口隔离

## 背景

`iron-vault-flutter` 经过 task1–task12 的快速搭建，核心功能（14 屏幕、Rust SDK、Wallet Service、BLE 外设、APDU/AirGap/EIP-4527 协议）均已完成并通过基础验证。但架构在快速迭代中自然生长，出现了以下结构性问题：

1. **上帝类**：`AppState` 322 行管理 8 个关注点（主题/语言/钱包/BLE/auto-lock/APDU 分发/导航），任何变更都需修改此文件。
2. **类臃肿**：`WalletService` 704 行混合了 PIN 认证、ChaCha20 加解密、种子派生、5 链账号派生、持久化，单一类承载了安全原语 + 业务编排 + 数据访问三层职责。
3. **依赖方向模糊**：Screen 层直接 import `CryptoBridge`（FFI）跳过 Service 层；`Storage` 接口与数据模型混放于 `models/`。
4. **测试困难**：单元测试需要完整 Rust FFI 环境 + 真实 Storage，无法独立 mock Service 的任一依赖。

## 方案选项

### 方案 A：Feature-First（按功能纵向切割）

每个功能自包含 data/domain/presentation 三层。

**优点：**
- 功能内聚度高，改一个功能只碰一个目录

**缺点：**
- 功能间交叉依赖（如"设置页显示钱包版本号"）导致边界模糊
- 共享逻辑无处安放，容易复制粘贴或形成循环依赖
- 中等规模项目（14 屏幕、7 个功能域）下过度切割

→ **拒绝**

### 方案 B：Clean Architecture 三层（Domain/Data/Presentation）

Domain 层纯 Dart 零 Flutter 依赖，每项业务操作为一个 UseCase 类。

**优点：**
- 最严格的分层，Domain 可独立于 Flutter 测试
- 适合长期维护的多团队项目

**缺点：**
- 文件爆炸：一个 `setupWallet` 需要接口 + UseCase + 实现至少 3 个文件
- 本项目的 14 个业务操作变成 14+ 个 UseCase 类，前期进度慢
- 过度工程风险高

→ **拒绝**

### 方案 C：水平分层 + 接口隔离（选定）

水平方向按技术职责分 5 层（core/data/services/infrastructure/ui+app），垂直方向 Service 层按业务边界切 5 个 Service。依赖方向单向不可逆：

```
ui/ → app/ → services/ → core/ ← data/ ← infrastructure/
```

**优点：**
- 依赖方向明确，违反即编译错误
- 每个 Service 可独立 mock 所有依赖（只依赖 `core/interfaces/`）
- 加新功能（如 Enigma 解锁方式）只改 7 个文件，其余不动
- 相比 Clean Architecture，文件数可控

**缺点：**
- 初期 mock 成本（每个 Service 需写 mock 类）
- 5 个 Service 粒度需实战验证是否需要合并/拆分

→ **选定**

## 决策

选择方案 C：**水平分层 + 接口隔离**。

**理由：**
1. 项目功能域 7 个，拆分 5 个 Service 粒度适中，不会文件爆炸也不会耦合
2. 后端分层经验可直接迁移（core = domain model + interface，data = DAO 层，services = Service 层）
3. 单测可独立于 Rust FFI 运行，CI 速度大幅提升
4. 依赖方向编译期可检查，Agent 不会放错文件

### 分层结构

```
lib/
├── core/                         ← 纯 Dart 实体 + 抽象接口（零依赖）
│   ├── models/                   ← WalletAccounts, ApduCommand...
│   └── interfaces/               ← Storage, ICryptoService, IWalletRepository...
│
├── data/                         ← Repository 实现（只做存取，不做判断）
│   ├── repositories/
│   └── bip39_wordlist.dart
│
├── services/                     ← 业务逻辑（5 个 Service）
│   ├── wallet_service.dart        ← 钱包生命周期编排
│   ├── pin_auth_service.dart      ← PIN 认证
│   ├── account_service.dart       ← 账号管理
│   ├── mnemonic_service.dart      ← 助记词生成+验证
│   └── settings_service.dart      ← 设置管理
│
├── infrastructure/               ← 平台/设备封装（不改）
│   ├── ble/
│   ├── ffi/
│   └── persistence/
│
├── protocols/                    ← 协议层（不改）
├── app/                          ← 应用组装（AppState 瘦身）
└── ui/                           ← 表现层（screens/ + theme/ + i18n/）
```

### 依赖方向规则

| Layer | May import from | Must NOT import from |
|---|---|---|
| `core/` | nothing (pure Dart) | any other layer |
| `data/` | `core/` only | `services/`, `ui/`, `app/` |
| `infrastructure/` | `core/` only | `services/`, `ui/`, `app/` |
| `services/` | `core/` only | `data/`, `infrastructure/`, `ui/` |
| `app/` | `services/`, `infrastructure/`, `core/` | `ui/`, `data/` |
| `ui/` | `services/`, `core/` | `data/`, `infrastructure/` |

## 影响

- **正面**：单测从"需要 Rust .so"变为"mock 接口即可"；修改隔离度大幅提升
- **负面**：文件数增加约 19 个（新建）+ 10 个（修改）；导入路径全量更新工作量大
- **不改动的模块**：`infrastructure/`、`protocols/`、`rust/`、主题/i18n 逻辑不变（仅目录移动）
- **后续评估**：5 个 Service 的粒度是否合理，是否需合并（如 `MnemonicService` + `AccountService` 合并为 `CryptoService`）需在 Phase 4 实战中验证

## 关联

- 关联任务：`tasks/task13.md`
- 关联讨论：`discusses/discuss001.md`
