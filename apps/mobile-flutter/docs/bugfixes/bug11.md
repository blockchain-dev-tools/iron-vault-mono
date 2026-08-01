# Bug11: EnigmaMnemonicScreen initState 中调用 GoRouterState.of(context) 导致崩溃

状态：已修复

## 症状

进入 Enigma 助记词页面后，屏幕底部出现红底黄字的 Flutter 错误条，点击后 app 无法继续操作。

## 诊断

`GoRouterState.of(context)` 内部调用 `dependOnInheritedWidgetOfExactType<_ModalScopeStatus>()`，该 API 只能在 widget 的 build 阶段或 `didChangeDependencies` 中调用，不能在 `initState()` 中调用。

`_EnigmaMnemonicScreenState` 的 `initState()` 直接调用了 `_initFromExtra()`，而后者调用了 `GoRouterState.of(context)`，违反 Flutter 框架约定，导致崩溃。

类似问题：
- https://docs.flutter.dev/testing/errors
- Flutter 官方文档建议：references to inherited widgets should occur in widget build() methods, or in didChangeDependencies()

## 修复

`lib/ui/screens/enigma_mnemonic/enigma_mnemonic_screen.dart`:

1. 将 `_initFromExtra()`（内含 `GoRouterState.of(context)`）从 `initState()` 移到 `didChangeDependencies()` 中
2. 添加 `_initialized` 标志位，防止 `didChangeDependencies` 多次触发时重复初始化

## 涉及文件

- `lib/ui/screens/enigma_mnemonic/enigma_mnemonic_screen.dart`

## 验证

- `flutter analyze`: No issues found
- `flutter test`: 2/2 widget tests passed
- APK 安装后 Enigma 流程可正常运行