# Bug 7: 正确 PIN 无法解锁钱包

**日期**：2026-06-07

**状态：已修复**

---

## 症状

在 Unlock 页面输入正确的 PIN（如 "123456"），无法进入 Vault。用户看到 "Verification error" 错误提示，PIN 输入框重置重试，始终无法解锁。

---

## 上下文（Unlock 流程全链路）

```
用户输入 6 位 PIN（UnlockScreen._onDigitTap）
    ↓
UnlockScreen._verifyPin()
    → ws.verifyPin(entered)       ← 步骤 A：读 salt + 读 hash → 计算比对
    ↓ (ok == true)
    → ws.unlockWallet(entered)    ← 步骤 B：解密助记词 → 校验 → 派生账户
    ↓
成功 → context.go('/vault')
失败 → catch 显示错误
```

---

## 根因

`unlockWallet()` 与 `setupWallet()` 对**助记词 BIP-39 校验策略不一致**：

| 函数 | 行为 | 原因 |
|---|---|---|
| `setupWallet()` | **跳过** `validateMnemonic()` | 兼容 Enigma 流程（使用 BIP-39 词表但无标准 checksum 的助记词）|
| `unlockWallet()` | **强制** `validateMnemonic()` | 无任何理由——纯粹的编码疏忽 |

**后果链**：

1. 用户通过 Generate / Import / Enigma 流程创建钱包，PIN="123456"
2. `setupWallet()` 存储了 `salt`、`pinKdf`（FNV-1a hash）、加密后的助记词
3. 用户关闭 App 后重新打开 → 路由到 Unlock 页面
4. 输入 "123456" → `verifyPin()` 正确比对 hash → **返回 true** ✓
5. 进入 `unlockWallet()` → 解密助记词成功 → **`CryptoBridge.validateMnemonic()` 被强制调用**
6. 如果是 Enigma 钱包（无 checksum）→ FFI 返回 `false` → **抛出 `StateError`**
7. UnlockScreen catch 块吞掉异常 → 显示误导性 **"Verification error"**
8. PIN 输入框重置 → 用户反复输入正确 PIN → 永远失败

**不只是 Enigma**：即使是普通 BIP-39 钱包，如果 Rust FFI 调用 `validate_mnemonic` 因任何原因（编码问题、Rust panic）返回 false，同样会被拦截。

**附加问题**：`unlockWallet()` 内部还冗余调用了一次 `verifyPin()`（UnlockScreen 已经在步骤 A 验证过了），且返回值 `WalletAccounts?` 被 UnlockScreen 完全忽略（即使返回 null 也照样导航到 vault）。

---

## 修复

### 修改文件

| 文件 | 变更 |
|---|---|
| `lib/services/wallet_service.dart` | `unlockWallet()`: 移除 `validateMnemonic` + 移除冗余 `verifyPin` + 返回类型 `WalletAccounts?` → `WalletAccounts` |
| `lib/screens/unlock_screen.dart` | `_verifyPin()`: 区分三种错误类型 + `StateError` 捕获 + 移除失效的返回值处理 |

### 具体 diff

#### 1. `unlockWallet()` — 移除校验 + 简化签名

```dart
// BEFORE（有 2 个问题）:
Future<WalletAccounts?> unlockWallet(String pin) async {
    // ... lockout check ...

    // 问题 1: 冗余 verifyPin（UnlockScreen 已经验证过）
    if (!await verifyPin(pin)) {
      await _incrementPinAttempts();
      return null;
    }

    // ... decrypt ...

    // 问题 2: 与 setupWallet 不一致的强制校验
    if (!CryptoBridge.validateMnemonic(mnemonic)) {
      throw StateError('Decrypted mnemonic is invalid...');
    }
    // ...
}

// AFTER:
Future<WalletAccounts> unlockWallet(String pin) async {
    // ... lockout check ...

    // 直接解密（调用方已 verifyPin）
    final salt = await _storage.getItem(_keyPinSalt);
    final encryptedMnemonic = await _storage.getItem(_keyMnemonicEncrypted);
    final mnemonic = _decryptWithPin(encryptedMnemonic, pin, salt);
    // Note: BIP-39 validation intentionally skipped (matching setupWallet)
    // ...
    return _accounts!;
}
```

#### 2. `UnlockScreen._verifyPin()` — 区分错误类型

```dart
// BEFORE:
if (ok) {
    await ws.unlockWallet(entered);   // 忽略返回值
    if (mounted) context.go('/vault');
}
// ... 所有异常统一显示 "Verification error"

// AFTER:
if (ok) {
    try {
        await ws.unlockWallet(entered);
        if (mounted) context.go('/vault');
    } on StateError catch (e) {
        _error = e.message;     // 显示具体原因（如数据损坏）
    }
} else {
    _error = 'Incorrect PIN';   // 真正的 PIN 错误
}
// catch-all → 'Unexpected error'
```

---

## 部署

> **⚠️ 关键**：Flutter hot reload 只在 debug session 中有效。独立 APK 必须重新 `flutter build` + `adb install` 才能包含代码修改。

```bash
flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

---

## 验证

- `flutter analyze`：零新问题（6 个 info/warning 均为测试文件预先存在）
- `flutter test`：**47/47 全部通过**（零回归）
- `cargo test`：**54/54 全部通过**（Rust SDK 不受影响）
- APK 构建 + 安装：成功，新代码已部署到设备 `bcb0051`
