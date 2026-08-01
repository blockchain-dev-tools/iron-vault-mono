我是一个资深的开发工程时，有时候我们在开发后端的时候会进行分层，可能有业务层有service，有DAO层有API层，有时候还会有model层。
我想知道的事情是对于App来说，他一般是怎么分层？
我觉得现在我们这个项目并不是特别规范
我希望没有明确的分层，然后每个特定的功能有袭击的模块，通过interface定义对外的接口。
所以首先你能帮我先调研一下，或者如果你知道可以直接回答我就是一般App是怎么分层，
然后你尝试优化一下我们现有的功能的分层，就是重构一下，看一下要分成几层然后每层应该有哪些模块，
再把现有的功能放到应该有的模块里面，
不要互相之间耦合，内聚一点

---

## 讨论结论（2026-06-21）

### 方案选型

调研了三种主流 App 分层模式，结合本项目规模和业务特点：

| 方案 | 决定 | 理由 |
|---|---|---|
| Repository 轻量模式 | 不够 | 只抽象了数据存取，业务逻辑还是耦合在 Service 里 |
| Clean Architecture 三层 | 过度 | 文件爆炸（每个操作一个 UseCase 类），本项目不需要 |
| **水平分层 + 接口隔离** | **选定** | 后端分层经验可直接迁移，5 层 + 5 个 Service 粒度适中 |

### 最终架构

```
lib/
├── core/                 ← 最内层：实体 + 抽象接口（纯 Dart，零依赖）
│   ├── models/           ← WalletAccounts, ApduCommand, BleTypes...
│   └── interfaces/       ← Storage, ICryptoService, IWalletRepository...
│
├── data/                 ← Repository 实现（只做存取，无业务判断）
│   ├── repositories/
│   └── bip39_wordlist.dart
│
├── services/             ← 5 个 Service
│   ├── wallet_service.dart   ← 钱包生命周期编排
│   ├── pin_auth_service.dart ← PIN 认证
│   ├── account_service.dart  ← 账号派生管理
│   ├── mnemonic_service.dart ← 助记词生成/验证
│   └── settings_service.dart ← 设置管理
│
├── infrastructure/       ← BLE, FFI, persistence（不改）
├── protocols/            ← APDU, AirGap, EIP-4527（不改）
├── app/                  ← Auto-lock + BLE ↔ APDU 桥接（瘦身）
└── ui/                   ← screens/ + theme/ + i18n/
```

依赖方向：`ui → app → services → core ← data / infrastructure`（单向不可逆）

### 关键设计

1. **接口隔离**：每个 Service 只依赖 `core/interfaces/` 的抽象，下层（data/infrastructure）实现接口，但 Service 不知道是谁实现的
2. **5 个 Service 职责边界**：
    - WalletService = 编排，不管怎么加密、怎么派生
    - PinAuthService = 管 PIN，不管助记词
    - AccountService = 管账号，不管种子从哪来
    - MnemonicService = 管生成，不管怎么存
    - SettingsService = 管设置，不管钱包
3. **TDD 测试**：单测 mock `core/interfaces/`（不依赖 Rust .so），测试文件与源文件并列，禁止 mock 具体类

### 验证了扩展性

- 加一种新解锁方式（Enigma 无 PIN）→ 改 7 个文件，30+ 个不动
- 换存储方案 → 只改 RepositoryImpl 一个文件

### 相关产出

- ADR: `docs/adr/001-layered-architecture.md`
- 测试指南: `docs/guides/testing.md`
- 任务: `docs/tasks/task13.md`
- 进度: `docs/progress/README.md`