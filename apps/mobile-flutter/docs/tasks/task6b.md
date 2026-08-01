# Task 6b — Dart FFI Bridge + Wallet Service

## Refined Task Description

### Goal
创建 Dart ↔ Rust FFI 桥接层（`CryptoBridge`），实现钱包生命周期服务（`WalletService`），集成 auto-lock 机制。

### Background

当前状态：
- Rust 加密核心（task6a）实现后，所有加密函数可通过 `dart:ffi` 调用
- `lib/ffi/` 目录为空（仅有 `.gitkeep`），`crypto_bridge.dart` 不存在
- `lib/services/wallet_service.dart` 不存在
- `lib/models/storage.dart` 已定义 `Storage` 抽象接口
- `lib/models/wallet_accounts.dart` 已完整定义数据模型
- `AppState` 已有 `hasWallet` 检测，但无 auto-lock

> 对标的 mono 源：`packages/wallet/src/service.ts`

### Breakdown

- [ ] **2.1** 创建 `lib/ffi/crypto_bridge.dart`：
  - 动态库加载（`ffi.DynamicLibrary.open('libiron_vault_crypto.so')`）
  - `CryptoBridge` 类，封装所有 Rust FFI 函数为静态方法
  - 方法签名：`generateMnemonic(int strength)`、`validateMnemonic(String mnemonic)`、`deriveAccounts(String mnemonic, {String passphrase})`、`signEthTx(Uint8List privKey, Uint8List rlp)`、`signSolMessage(Uint8List privKey, Uint8List message)`、`signPersonalMessage`、`signEIP712`、`deriveAddress`、`deriveChildKey` 等
  - `CString` ↔ `CStr` 内存管理（`malloc`/`free` via FFI）
- [ ] **2.2** 创建 `lib/services/wallet_service.dart`：
  - `hasWallet(Storage s)` — 检查存储中是否存在钱包数据
  - `setupWallet(Storage s, String mnemonic, String pin, {String? passphrase})` — 创建钱包，PIN 用 PBKDF2（Rust 侧），存储加密数据
  - `unlockWallet(Storage s, String pin, {String? passphrase})` — 验证 PIN 并解密钱包
  - `verifyPin(Storage s, String pin)` — 纯 PIN 验证（不解密）
  - `getAccounts()`, `addAccount()`, `removeAccount()` — 账户管理
  - `revealMnemonic(Storage s, String pin)` — 揭示助记词（需 PIN）
  - `clearWallet(Storage s)` — 清除所有钱包数据
  - `updatePin(Storage s, String oldPin, String newPin)` — 修改 PIN（重新加密）
  - PIN 存储：PBKDF2（10k 迭代，随机 16-byte salt），格式 `salt_hex:hash_hex`，存储键 `wallet.pinKdf`
  - 旧版 SHA-256 PIN 迁移路径
  - passphrase 加密：ChaCha20-Poly1305（用 PIN 派生的密钥加密 passphrase）
  - PIN 尝试次数追踪：`getPinAttempts()` / `incrementPinAttempts()` / `resetPinAttempts()`，最多 5 次 → 锁定 → 重置钱包
  - `storePassphrase` 开关
- [ ] **2.3** 在 `AppState` 中集成 auto-lock：
  - 用 `WidgetsBindingObserver.didChangeAppLifecycleState` 监听前后台切换
  - 记录进入后台时间戳
  - 回到前台时检查时间差，超过 5 分钟 → 锁定（清除解密数据，导航到 Unlock 屏幕）
  - 不在此 Phase 修改 screen 导航逻辑，仅添加状态管理

### Files / Modules Involved

- `lib/ffi/crypto_bridge.dart` — 新增：Dart FFI Rust 桥接层
- `lib/services/wallet_service.dart` — 新增：钱包生命周期服务
- `lib/app/app_state.dart` — 修改：添加 auto-lock 状态管理
- `lib/models/storage.dart` — 参考：Storage 接口
- `lib/models/wallet_accounts.dart` — 参考：数据模型

### Notes

- **PIN 安全**：PBKDF2 必须在 Rust 侧实现，Dart 不参与密钥派生
- **常量时间 PIN 比较**：在 Rust 侧实现，不可在 Dart 侧用 `==` 比较
- **Auto-lock**：仅管理状态，不修改屏幕导航（屏幕导航在 Phase 3 完成）
- `wallet.pinKdf` 存储格式：`salt_hex:hash_hex`（与 mono 一致）
- 所有异步操作必须处理 Storage 错误（网络/磁盘失败）
- 遵循 AGENTS.md "Common Pitfalls" #3（PIN storage）、#8（timing-safe）、#9（seed cache invalidation）

### Depends On

- Task 6a 完成（Rust 加密核心 FFI 可用）

### Verification

- [ ] `flutter analyze lib/ffi/ lib/services/` 零错误
- [ ] `flutter test`（如果编写了单元测试）零失败

---

> 父任务：Task 6 — iron-vault-mono 剩余功能实现
> 前序：Task 6a — Rust 加密核心
> 下一个：Task 6c — 屏幕完整实现
