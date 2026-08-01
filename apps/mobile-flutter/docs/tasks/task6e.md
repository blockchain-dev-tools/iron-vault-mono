# Task 6e — 周边功能（i18n + AirGap + EIP-4527 + 链图标 + 多语言词表）

## Refined Task Description

### Goal
实现 i18n 多语言界面（EN/ZH/JA/KO）、AirGap 离线 QR 签名协议、EIP-4527 UR 编码协议、链图标资源、BIP-39 多语言词表（11 语言）、链名称解析等增强功能。

### Background

当前状态：
- 无 i18n 系统（所有界面文字硬编码为英文）
- 无 AirGap 协议实现
- 无 EIP-4527 协议实现
- 无链 SVG 图标
- Rust 侧仅支持 English BIP-39 词表

> 对标的 mono 源：`packages/i18n/src/`、`packages/airgap/src/`、`packages/eip4527/src/`、`packages/assets/src/`

### Breakdown

- [ ] **5.1** i18n 多语言界面：
  - 创建 `lib/i18n/` 目录 + Flutter 标准 `.arb` 文件（`app_en.arb`、`app_zh.arb`、`app_ja.arb`、`app_ko.arb`）
  - 支持 4 语言：English、中文简体、日本語、한국어
  - 覆盖范围：所有 16 个屏幕的所有 UI 文字 + 通用元素（按钮、提示、错误信息）
  - 语言选择器集成到 `SettingsScreen`（已通过 Task 6c 实现）
  - 系统语言自动检测（fallback 到 en）
- [ ] **5.2** 设置持久化：
  - 用 `SharedPreferences` 或 `flutter_secure_storage` 存储用户偏好
  - 持久化项：主题模式（dark/light/system）、语言选择、storePassphrase 开关
  - 在 `AppState` 初始化时从存储恢复设置
- [ ] **5.3** AirGap 协议（`lib/services/airgap/`）：
  - AirGap IAC Protocol v3 实现：CBOR 编码 → pako deflate → base58check
  - 消息类型：AccountShare、TransactionSignRequest、TransactionSignResponse、MessageSignRequest、MessageSignResponse
  - 分块编码/解码（大 payload 分多个 QR 码）
  - 链特定 payload：ETH、SOL、BTC、TRON、SUI
- [ ] **5.4** EIP-4527 UR 协议（`lib/services/eip4527/`）：
  - CBOR tag 定义：CryptoHDKey、CryptoKeypath、CryptoCoinInfo、CryptoAccount、CryptoPSBT
  - 签名请求类型：EthSignRequest、EthSignature、SolSignRequest、SolSignature、Tron/Sui 对应类型
  - UR（Uniform Resource）编码/解码
  - 派生路径编码（支持 hardened 索引）
  - CryptoAccount、CryptoHDKey → UR 格式转换
- [ ] **5.5** 链图标资源：
  - 创建 `lib/app/widgets/chain_icons.dart`
  - 实现 EthIcon、SolIcon、BtcIcon、TronIcon、SuiIcon 为 Flutter CustomPainter
  - 在 VaultScreen 和 AccountDetailScreen 中使用
- [ ] **5.6** BIP-39 多语言词表（11 语言）：
  - Rust 侧支持多语言：en、zh-Hans、zh-Hant、cs、fr、it、ja、ko、pt、es
  - Dart 侧 CryptoBridge 暴露 language 参数
  - GenerateMnemonic、ImportMnemonic、EnigmaMnemonic 屏幕中集成语言选择
- [ ] **5.7** 链名称解析：
  - 在 WalletService 或单独的 util 中实现链名称映射
  - 支持主流网络：Ethereum Mainnet、Optimism、BNB Chain、Gnosis、Polygon、Fantom、zkSync Era、Base、Arbitrum、Avalanche
  - 在 VaultScreen 账户列表中显示网络名称

### Files / Modules Involved

**新增：**
- `lib/i18n/` + `.arb` 文件 — 多语言字符串
- `lib/services/airgap/` — AirGap 协议
- `lib/services/eip4527/` — EIP-4527 UR 编码
- `lib/app/widgets/chain_icons.dart` — 链图标

**修改：**
- `rust/src/mnemonic.rs` — 多语言词表支持
- `rust/src/lib.rs` — FFI 导出 language 参数
- `lib/ffi/crypto_bridge.dart` — 添加 language 参数
- `lib/app/app_state.dart` — 设置持久化
- `pubspec.yaml` — 可能需要 `shared_preferences`、`cbor` 等依赖
- `lib/screens/settings_screen.dart` — 语言选择器集成
- `lib/screens/vault_screen.dart` — 链图标 + 链名称

### Notes

- **i18n 遵循项目规范**：使用 Flutter 内置 i18n（`.arb` 文件 + `flutter_localizations`），不引入第三方 i18n 包
- **AirGap + EIP-4527** 可以独立模块开发，与核心屏幕隔离
- **BIP-39 多语言**：Rust `bip39` crate v2 可能已支持部分语言，需验证；若不足需自行扩展
- **链图标**：使用 CustomPainter 而非 SVG，避免额外依赖，与 `LedgerLogo` 风格一致
- 所有外部依赖需在 `pubspec.yaml` 中声明

### Depends On

- Task 6c 完成（屏幕需要 i18n 集成 + 链图标 + 链名称）
- Rust task6a 完成（BIP-39 多语言需要 Rust 支持）

### Verification

- [ ] `flutter analyze` 零错误
- [ ] 多语言切换后所有屏幕文字正确更新
- [ ] AirGap 编解码 round-trip 无数据丢失
- [ ] EIP-4527 UR 编解码 round-trip 无数据丢失

---

> 父任务：Task 6 — iron-vault-mono 剩余功能实现
> 前序：Task 6c — 屏幕完整实现（+ 部分依赖 Task 6a）
