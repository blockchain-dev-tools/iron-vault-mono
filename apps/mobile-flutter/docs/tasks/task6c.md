# Task 6c — 14 屏幕完整实现 + Enigma

## Refined Task Description

### Goal
将全部 14 个屏幕的脚手架变为完整实现，并新增 Enigma 和 EnigmaMnemonic 两个屏幕（共 16 屏）。所有屏幕遵循 Welcome/Unlock 的 UI 风格和 Theme 系统。

### Background

当前屏幕状态：
- ✅ 完成：Welcome（完整 UI + 导航）、Unlock（完整 UI + 6 位 PIN 逻辑）
- 🟡 部分：Transaction（Approve/Reject 按钮）、Settings（静态列表）
- ❌ 脚手架（10 个）：Entropy、GenerateMnemonic、VerifyMnemonic、ImportMnemonic、SetPin、Vault、AccountDetail、BackupSeed、Enigma、EnigmaMnemonic

> 对标的 mono 源：`apps/mobile/src/screens/`，`packages/simulator/src/components/screens/`

### Breakdown

- [ ] **3.1 EntropyScreen**：200 触摸点采集 UI（在屏幕任意位置触摸计数）、进度条、SHA-256 哈希 → 调用 `CryptoBridge.generateMnemonic(128)` → 导航到 GenerateMnemonic
- [ ] **3.2 GenerateMnemonicScreen**：12 词网格显示（3×4）、BIP-39 语言选择器（下拉菜单）、passphrase 输入框（可选）、"Continue" 按钮 → 导航到 VerifyMnemonic
- [ ] **3.3 VerifyMnemonicScreen**：位置 3、7、11 的四选一测验，从 mnemonic 单词中选取正确词 + 生成 3 个干扰项，三次全对后导航到 SetPin
- [ ] **3.4 ImportMnemonicScreen**：自由文本输入框 + BIP-39 词表实时自动补全（输入时显示匹配词建议）、验证按钮 → 导航到 SetPin
- [ ] **3.5 SetPinScreen**：两阶段 6 位 PIN 输入（创建：输入→确认；修改：旧PIN→新PIN→确认），数字键盘 3×4 布局，点状密码显示。通过 `generatedWords.isEmpty` 检测"创建" vs "修改"模式
- [ ] **3.6 VaultScreen**：5 链分组账户列表（Ethereum、Solana、Bitcoin、Tron、Sui），每链显示已派生账户数量 + 第一个地址截断，BLE 连接面板（底部 Sheet），活动日志查看器，"Add Account" 按钮（复用 AddAccountSheet）
- [ ] **3.7 AccountDetailScreen**：完整地址显示（长按复制）、QR 码（`qr_flutter` 包）、派生路径标签、"Enable BLE" 开关（如账户已有此开关）
- [ ] **3.8 TransactionScreen**（完善现有骨架）：接收动态交易数据（From/To/Value/Chain/Network），Approve 触发签名并返回，Reject 拒绝并返回
- [ ] **3.9 SettingsScreen**（完善现有骨架）：主题切换（Dark/Light/System）、语言切换、安全设置（Change PIN、Reset Wallet）、BLE 名称编辑
- [ ] **3.10 BackupSeedScreen**：PIN 输入门控，正确后显示 12 词助记词网格，支持长按复制
- [ ] **3.11 EnigmaScreen**：输入"谜语文本" TextField + "秘密盐" TextField，"Generate" 按钮 → 确定性生成 24 词助记词 → 导航到 EnigmaMnemonicScreen
- [ ] **3.12 EnigmaMnemonicScreen**：显示 Enigma 派生的 24 词助记词 + BIP-39 语言重编码选择器，"Continue" → 导航到 SetPin

### Files / Modules Involved

**修改：**
- `lib/screens/entropy_screen.dart`
- `lib/screens/generate_mnemonic_screen.dart`
- `lib/screens/verify_mnemonic_screen.dart`
- `lib/screens/import_mnemonic_screen.dart`
- `lib/screens/set_pin_screen.dart`
- `lib/screens/vault_screen.dart`
- `lib/screens/account_detail_screen.dart`
- `lib/screens/transaction_screen.dart`
- `lib/screens/settings_screen.dart`
- `lib/screens/backup_seed_screen.dart`

**新增：**
- `lib/screens/enigma_screen.dart`
- `lib/screens/enigma_mnemonic_screen.dart`
- `lib/app/router.dart` — 添加 Enigma 路由

**参考：**
- `lib/screens/welcome_screen.dart` — UI 风格参考
- `lib/screens/unlock_screen.dart` — PIN 输入 + 导航模式参考
- `lib/app/theme.dart` — `ColorTokens` + `R` 常量
- `lib/app/widgets/ledger_logo.dart` — 可复用组件

### Notes

- **UI 风格**：统一使用 `ColorTokens`（`C.primary` / `C.bg` / `C.surface`）和 `R` 常量（`R.sm`、`R.lg`、`R.xl`），禁止硬编码颜色和圆角
- **导航规则**：认证成功后必须 `pushAndRemoveUntil` 清栈；重置钱包后导航到 Welcome 清栈
- **SetPin 双用途**：通过 `generatedWords.isEmpty` 判断是"创建"还是"修改"模式
- **Passphrase**：GenerateMnemonic、ImportMnemonic 和 EnigmaMnemonic 都应支持 passphrase 输入
- **12 屏幕可并行**：屏幕之间无强依赖（除了流程顺序），可大量委托给 `deep` 代理并行实现
- 测试策略：可选 widget test，不做强制要求

### Depends On

- Task 6b 完成（WalletService + CryptoBridge 可用）
- `qr_flutter` 包添加到 `pubspec.yaml`

### Verification

- [ ] `flutter analyze lib/screens/` 零错误
- [ ] 所有屏幕可通过路由导航到并正常渲染
- [ ] 导航流程正确（创建钱包流程：Welcome → Entropy → Generate → Verify → SetPin → Vault）

---

> 父任务：Task 6 — iron-vault-mono 剩余功能实现
> 前序：Task 6b — Dart FFI Bridge + Wallet Service
> 下一个：Task 6d — BLE 外设 + APDU 补全
