# Bug 4: 导入助记词后账户不显示 + 重启后回到欢迎页

状态：已修复

## 症状
1. 通过 ImportMnemonic → SetPin 流程导入钱包后，Vault 页面显示"No accounts yet"
2. 杀掉 App 重新打开，回到 Welcome 页面而非 Unlock 页面

## 诊断
**根因：依赖注入完全缺失，整个钱包创建链在 3 处断裂。**

### 断裂 1: Router 忽略 `state.extra`（助记词丢失）
- `ImportMnemonicScreen._import()` 通过 `context.go('/set-pin', extra: mnemonic)` 传递助记词
- Router 的 `/set-pin` 路由写死 `const SetPinScreen()`，完全忽略 `state.extra`
- `SetPinScreen.mnemonic` 始终为 `null` → `isCreateMode` 返回 false → 进入"改 PIN"流程而非"创建"流程

### 断裂 2: Router 不传递 WalletService（setupWallet 从未调用）
- `SetPinScreen._setupWallet()` 检查 `widget.walletService == null || widget.mnemonic == null`
- 两者都为 null → 直接跳转到 `/vault`，**不创建任何钱包**
- `WalletService.setupWallet()` 从未被调用，没有任何数据持久化

### 断裂 3: main.dart 使用 `_NoWalletStorage` 桩
- `main.dart._initApp()` 使用 `_NoWalletStorage()` 调用 `resolveWallet()`，该桩永远返回 null
- 所以 `hasWallet` 始终为 false → 启动时总是路由到 `/welcome`
- 存储层根本没有真实的持久化实现（`flutter_secure_storage` 是计划中的依赖，从未安装）

### 连带问题
- `UnlockScreen` 硬编码 PIN 为 `'000000'`，不校验真实 PIN
- `WelcomeScreen` 使用 `Navigator.push()` 而非 `context.go()`，混合两种导航系统
- `VaultScreen` 和 `UnlockScreen` 从未接收到 `WalletService`

## 修复
1. **`lib/models/storage.dart`**: 新增 `SharedPreferencesStorage`（基于已有的 `shared_preferences` 依赖）
2. **`lib/main.dart`**: 
   - 创建 `SharedPreferencesStorage` + `WalletService`
   - 通过 `AppState.resolveWallet()` 传入
   - 移除 `_NoWalletStorage` 桩
   - 将 `_appState` 传给 `createRouter()`
3. **`lib/app/app_state.dart`**: 修改 `resolveWallet()` 签名，接受 `WalletService` 而非 `Storage`，同时缓存 `walletService`
4. **`lib/app/router.dart`**: 
   - 接受 `AppState` 参数
   - SetPinScreen: 传 `state.extra` 为 mnemonic + `appState.walletService`
   - VaultScreen: 传 `appState.walletService`
   - UnlockScreen: 传 `appState.walletService`
5. **`lib/screens/unlock_screen.dart`**: 
   - 接受 `WalletService` 参数
   - 使用 `walletService.verifyPin()` 替代硬编码 `'000000'`
   - 使用 `context.go()` 替代 `Navigator.pushAndRemoveUntil`
6. **`lib/screens/welcome_screen.dart`**: 使用 `context.go()` 替代 `Navigator.push()`

## 涉及文件
- lib/models/storage.dart
- lib/main.dart
- lib/app/app_state.dart
- lib/app/router.dart
- lib/screens/unlock_screen.dart
- lib/screens/welcome_screen.dart

## 影响范围
- ImportMnemonic → SetPin → Vault 全链路
- 冷启动 hasWallet() 判断
- Unlock 页 PIN 验证
- Welcome 页导航一致性

## 验证
- `flutter analyze`: 零新错误（仅 6 个预存 test 文件 issue）
- `flutter test`: 47/47 全部通过