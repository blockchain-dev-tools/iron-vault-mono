# Bug 10: 设置页面 Light/Dark 模式切换不生效

状态：已修复

## 症状

1. 在 Settings 页面切换 Theme 开关（Light/Dark）时，只有 Switch 组件和文字标签变化，但页面背景色、卡片色、文字颜色等所有 UI 样式不变，始终显示为 Dark 模式。
2. 切换主题后应用直接"退出"（导航重置到 Unlock 页面），需要重新输入 PIN。
3. UnlockScreen 和 VaultScreen 不响应主题切换，始终显示为 Dark 模式。

## 诊断

4 个根本原因：

1. **`_toggleTheme()` 未调用 Service**：`SettingsScreen._toggleTheme()` 仅翻转了本地 `_isDarkMode` 布尔值，从未调用 `SettingsService.toggleTheme()`。`MaterialApp.router` 的 `themeMode` 来自 `AppState.themeMode` → `SettingsService.themeMode`，该值从未被更新，因此在所有页面上 theme 切换均不生效。

2. **硬编码 `ColorTokens.dark`**：`SettingsScreen.build()` 使用 `final c = ColorTokens.dark;`，无论 `_isDarkMode` 为何值，颜色始终使用 Dark 模式。两个 AlertDialog（BLE 名称编辑、重置钱包确认）也硬编码了 `ColorTokens.dark`。

3. **`ListenableBuilder` 重建 GoRouter**：`main.dart` 中 `ListenableBuilder` 监听 `_appState`，每次 `SettingsService.toggleTheme()` 触发 `notifyListeners()` 时都会重建 `ListenableBuilder`。builder 中每次都创建新的 `GoRouter` 实例，导致导航状态丢失，应用重置到初始路由（`/unlock` 或 `/welcome`）。

4. **UnlockScreen/VaultScreen 也硬编码 `ColorTokens.dark`**：这两个屏幕同样在 `build()` 方法中使用 `final c = ColorTokens.dark;`，不会随 theme 切换更新颜色。

## 涉及文件

- `lib/main.dart` — GoRouter 稳定性修复
- `lib/core/router.dart` — 传递 SettingsService 到 SettingsScreen
- `lib/ui/screens/settings_screen.dart` — 主修复文件
- `lib/ui/screens/unlock_screen.dart` — 动态颜色修复
- `lib/ui/screens/vault_screen.dart` — 动态颜色修复

## 修复

### Fix 1: GoRouter 稳定性 (main.dart)

将 `GoRouter` 实例从每次 rebuild 创建改为在 `_initApp()` 中创建一次，保存为 `_IronVaultAppState` 的字段 `_router`。`ListenableBuilder` 仅更新 `themeMode`/`locale` 等 `MaterialApp.router` 参数，不重建 router。

```dart
// Before: 每次 AppState 通知都创建新 router，导航重置
final router = createRouter(initialHasWallet: hasWallet, appState: _appState);
return MaterialApp.router(routerConfig: router, ...);

// After: 稳定引用，theme 切换时 Router 保持不动
_router = createRouter(initialHasWallet: ..., appState: _appState);
return MaterialApp.router(routerConfig: _router!, ...);
```

### Fix 2: Router 传递 SettingsService

`lib/core/router.dart` 中 `/settings` 路由的 builder 改为传递 `appState?.settingsService` 给 `SettingsScreen`。

### Fix 3: SettingsScreen 接入 SettingsService

1. 添加 `SettingsService? settingsService` 构造函数参数
2. 在 `initState()` 中监听 SettingsService 变化 + `dispose()` 取消监听
3. `_toggleTheme()` 改为调用 `widget.settingsService?.toggleTheme()`
4. 所有颜色使用根据 theme mode 动态切换：
   - `build()`: `_isDarkMode ? ColorTokens.dark : ColorTokens.light`
   - `_editBleName()`: 同上，使用动态 `ColorTokens`
   - `_confirmResetWallet()`: 同上，使用动态 `ColorTokens`
5. 移除 `didChangeDependencies()` 中的 `_isDarkMode` 读取逻辑（由 Service listener 代替）

### Fix 4: UnlockScreen/VaultScreen 动态颜色

两屏幕的 `build()` 方法中的 `ColorTokens.dark` 改为根据 `Theme.of(context).brightness` 动态选择：
```dart
final isDark = Theme.of(context).brightness == Brightness.dark;
final c = isDark ? ColorTokens.dark : ColorTokens.light;
```

VaultScreen 中 `_showBleLogSheet()` 和 `_copyAddress()` 方法同样修复。

## 验证

- `flutter analyze`: 零新错误，仅存 pre-existing 问题（test/exercise 文件中的 `uri_does_not_exist`、`avoid_print` 等）
- APK 构建成功并安装到设备
