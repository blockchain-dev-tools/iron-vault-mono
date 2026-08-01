# Bug 5: Welcome 入口页面缺少后退功能

状态：已修复

## 症状
1. 在 Welcome 页点击 "Create New Wallet" 进入 Entropy 页，无法返回 Welcome
2. 在 Welcome 页点击 "Import Existing" 进入 ImportMnemonic 页，后退按钮无效
3. 在 Welcome 页点击 "Enigma Setup" 进入 Enigma 页，AppBar 没有后退按钮

## 诊断

**根因：3 个目标页面均缺失可用的后退导航。**

Welcome 页使用 `context.go()` 导航到子页面（`/entropy`、`/import`、`/enigma`），而 GoRouter 的 `go()` 会替换路由栈而非压栈。因此：
- `Navigator.canPop()` 返回 `false`
- AppBar 的自动后退按钮不显示

### 具体断裂

1. **EntropyScreen（`/entropy`）** — 完全没有 AppBar 或后退按钮。Scaffold 只有 `body`，用户进入后无法回头。
2. **ImportMnemonicScreen（`/import`）** — 有一个自定义后退箭头图标，但 `onTap` 中使用了 `if (context.canPop()) context.pop()`，由于 `go()` 替换了栈，`canPop()` 始终为 `false`，后退箭头形同虚设。
3. **EnigmaScreen（`/enigma`）** — 有 AppBar 但只有 `title`，没有 `leading` 后退按钮。自动后退按钮因 `go()` 替换路由栈而不显示。

## 修复

1. **`lib/screens/entropy_screen.dart`** — 为 Scaffold 添加 `appBar` 属性：
   - 透明背景（`c.bg`）、无阴影（`elevation: 0`）
   - `leading` 后退按钮 → `context.go('/welcome')`
2. **`lib/screens/import_mnemonic_screen.dart`** — 修改自定义后退箭头的 `onTap`：
   - 从 `if (canPop()) pop()` 改为 `context.go('/welcome')`
3. **`lib/screens/enigma_screen.dart`** — 为已存在的 AppBar 添加 `leading` 后退按钮：
   - 统一使用 `c.text` 作为图标颜色
   - `context.go('/welcome')`

## 涉及文件
- lib/screens/entropy_screen.dart
- lib/screens/import_mnemonic_screen.dart
- lib/screens/enigma_screen.dart

## 影响范围
- Welcome → Entropy（创建钱包入口）
- Welcome → ImportMnemonic（导入钱包入口）
- Welcome → Enigma（谜语钱包入口）

## 验证
- 修改后逻辑验证：三个页面的后退按钮均直接调用 `context.go('/welcome')`，在 GoRouter flat route 结构下可靠返回
- 视觉一致性：EntropyScreen 和 EnigmaScreen 使用 AppBar 自带布局，ImportMnemonicScreen 保留原有自定义后退图标布局
- 无新依赖引入，无需额外测试
