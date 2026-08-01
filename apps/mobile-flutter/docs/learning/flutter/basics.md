# Flutter 基础知识（面向 iron-vault-flutter 项目）

> 一份面向具有 JS/Python/Rust 背景、刚接触 Flutter 和 Dart 的开发者的实用指南。专门为 `iron-vault-flutter` 项目编写。

---

## 第一部分：Flutter 和 Dart 是什么？

**Flutter** 是 Google 开源的 UI 工具包，用于从单一的 Dart 代码库构建移动端（Android、iOS）、Web 和桌面端的原生编译应用程序。与 React Native 或类似框架不同，Flutter 不使用 JavaScript 桥接层或原生 UI 组件。相反，它使用高性能 2D 渲染引擎（Skia，目前在 iOS 上为 Impeller）来渲染自己的 widget。这提供了像素级的控制力和可预测的性能。

**Dart** 是用于编写 Flutter 应用程序的语言。Dart 在 release 构建时通过 AOT（提前编译）编译为原生 ARM/x64 代码，启动时间和运行时性能可与 Kotlin 或 Swift 媲美。在开发过程中，Dart 以 JIT（即时编译）模式运行，并带有热重载引擎，让你在一秒内看到代码变更，同时不丢失应用状态。Dart 拥有垃圾回收机制（分代 GC，类似于现代 JavaScript 引擎）、带可靠空安全的静态类型系统，以及 JS/TS 开发者会感到熟悉的类 C 语法。

### 与本项目的关系

在 `iron-vault-flutter` 中，Flutter 驱动着 Android 和 iOS 上的整个 UI。应用流程中定义的所有 14 个界面（欢迎、熵值采集、生成助记词、设置 PIN、保险库等）都是 Flutter widget。Dart 充当 UI 和 Rust 加密 SDK 之间的胶水层。繁重的工作（BIP-39 助记词生成、BIP-32 密钥派生、secp256k1/Ed25519 签名、地址派生）在 Rust 中完成，通过 Dart 的 FFI (`dart:ffi`) 进行调用。Dart 负责处理业务逻辑、导航、状态管理、BLE 通信和界面渲染，而 Rust 负责所有加密操作。

与 `iron-vault-mono`（全程使用 TypeScript，加密部分使用 `@noble/curves`）相比，本项目将 JS 加密层替换为 Rust crate，并将 React Native UI 替换为 Flutter。来自 `packages/wallet` 和 `packages/apdu` 的 TypeScript 业务逻辑将变为 `lib/services/` 中的 Dart 服务。

---

## 第二部分：安装和环境配置

### Flutter 的安装方式

Flutter **不是**通过系统包管理器安装的。它是从 Gitee 镜像（面向中国用户）克隆到 `~/flutter` 的：

```bash
git clone https://gitee.com/mirrors/Flutter.git ~/flutter
```

然后设置了 stable 频道。Flutter 自己的工具链管理其内部 Dart SDK，你不需要单独安装 Dart。

### PATH 配置

以下内容已添加到 `~/.zshrc`（并且 shell 中已经 source 过）：

```bash
# Flutter
export PATH="$PATH:$HOME/flutter/bin"

# 中国镜像（在中国境内稳定下载包的必需配置）
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
export PUB_HOSTED_URL=https://pub.flutter-io.cn

# Android SDK（已安装）
export ANDROID_HOME=$HOME/Android/Sdk
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/emulator"
```

编辑 `~/.zshrc` 后，应用更改：

```bash
source ~/.zshrc
```

### 验证环境：`flutter doctor`

运行以下命令来检查你的环境：

```bash
source ~/.zshrc && flutter doctor
```

`flutter doctor` 检查以下项目：

| 检查项 | 验证内容 |
|---|---|
| Flutter 版本 | 显示已安装的 Flutter 版本（当前为 **3.44.0**，Dart **3.12.0**）。 |
| Android 工具链 | 查找 `ANDROID_HOME`、`platform-tools`、`cmdline-tools` 和 Java。 |
| Android 许可证 | 检查 Android SDK 许可证是否已接受。 |
| Chrome / Web | 不需要（本项目仅针对 Android/iOS）。 |
| Linux 桌面端 | 可以忽略（我们不针对 Linux 桌面端）。 |
| VS Code / IntelliJ | IDE 插件检测。非必需但有用。 |
| 已连接的设备 | 显示当前连接的模拟器或物理设备。 |

### 本机已知问题及解决方法

**1. Android `cmdline-tools` 组件缺失**

错误：`Android SDK file not found: cmdline-tools`

解决方法：打开 Android Studio，进入 SDK Manager（SDK Tools 选项卡），安装 "Android SDK Command-line Tools (latest)"。或者直接使用 `sdkmanager`：

```bash
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --install "cmdline-tools;latest"
```

如果 `cmdline-tools` 完全不存在，手动下载：

```bash
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip -d ~/Android/Sdk/cmdline-tools
mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest
```

**2. Android 许可证未接受**

错误：`Android sdkmanager tool not found` 或许可证未接受。

安装 `cmdline-tools` 后执行：

```bash
flutter doctor --android-licenses
```

然后逐个输入 `y` 接受每个许可证。

**3. Java 未安装**

错误：`No Java Development Kit (JDK) found`。

Flutter 需要 JDK 17 来构建 Android。安装 OpenJDK 17：

```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

验证：`java --version` 应显示 "openjdk 17.x.x"。

**4. Linux 桌面工具链问题**

这些警告（`GTK 3.0`、`librsvg`、`pkg-config` 等）可以安全地忽略。本项目仅针对 Android 和 iOS。

---

## 第三部分：默认 Flutter 项目结构（`flutter create`）

本项目通过以下命令创建：

```bash
flutter create --project-name iron_vault_flutter --platforms android,ios .
```

`.` 表示项目是在当前目录（而非子目录）中创建的。`--platforms android,ios` 标志确保 `web`、`linux`、`macos` 和 `windows` 平台目录不会被生成。

以下是每个生成的文件和目录的作用：

### 根级文件

| 文件 | 用途 |
|---|---|
| `lib/main.dart` | **应用的入口。** 包含调用 `runApp()` 挂载根 widget 的 `main()` 函数。这是应用启动的地方。 |
| `pubspec.yaml` | **项目清单。** 定义项目名称、版本、SDK 约束、依赖项（包括 Flutter SDK 和第三方包）、资源、字体和插件配置。类似于 `package.json`（npm）或 `Cargo.toml`（Rust）。 |
| `analysis_options.yaml` | **Dart 代码检查配置。** 控制静态分析规则（代码风格、潜在错误）。当前包含 `package:flutter_lints/flutter.yaml`，启用 Flutter 团队推荐的 lint 规则。类似于 `.eslintrc.js`。 |
| `.gitignore` | 标准的 Flutter/Dart/IDE 忽略规则：`build/`、`.dart_tool/`、`.idea/`、`*.iml`、`*.log` 等。 |
| `README.md` | 自动生成的 Flutter 项目自述文件。本项目在仓库根目录有自己的自述文件。 |
| `.metadata` | Flutter 工具内部跟踪文件。不要手动编辑。它记录了创建项目的 Flutter 版本并跟踪迁移状态。 |
| `iron_vault_flutter.iml` | IntelliJ IDEA 模块文件。自动生成；不要提交（`.gitignore` 已排除 `*.iml`）。 |

### 根级目录

| 目录 | 用途 |
|---|---|
| `lib/` | **你的 Dart 源代码。** 所有应用逻辑、UI 和业务代码都放在这里。这相当于典型项目中的 `src/`。 |
| `test/` | **测试文件。** 默认包含 `widget_test.dart`，提供了一个验证应用可以正常构建的冒烟测试。测试使用 `flutter_test` 包。类似于 `__tests__/` 或 `tests/`。 |
| `android/` | **Android 平台项目。** 包含 Kotlin 源代码（`MainActivity.kt`）、Gradle 构建脚本（`build.gradle`、`settings.gradle`）、Android 清单和原生资源。除非需要平台特定配置（权限、深度链接等），否则你很少会碰这些文件。 |
| `ios/` | **iOS 平台项目。** 包含 Swift 源代码（`AppDelegate.swift`）、Xcode 工作空间（`Runner.xcworkspace`）、Info.plist 和 storyboard。只能在 macOS 上通过 Xcode 编辑。 |
| `.idea/` | **IntelliJ/Android Studio 项目设置。** 包含代码风格、运行配置和 Dart 分析设置。可以纳入版本控制以保持团队一致性。 |
| `.dart_tool/` | Dart 工具内部缓存（package_config.json、代码生成输出）。不要提交。 |

### 关键文件详解

**`pubspec.yaml`** 是最重要的配置文件。关键部分：

- `name: iron_vault_flutter` — 包名，用作 Dart 库的命名空间。
- `description:` — 简短描述。
- `publish_to: 'none'` — 这不是发布到 pub.dev 的包。
- `version: 0.1.0+1` — 语义化版本号 + 构建号。
- `environment: sdk: ^3.12.0` — 需要 Dart SDK >=3.12.0 且 <4.0.0。
- `dependencies:` — 应用运行时需要的包。
- `dev_dependencies:` — 仅在开发期间需要的包（测试、代码检查、代码生成）。
- `flutter:` 部分 — `uses-material-design: true` 启用 Material 图标。资源和字体在此声明。

---

## 第四部分：从默认结构过渡到本项目的架构

### 超越基本结构

`flutter create` 默认只生成 `lib/main.dart`。对于任何实际项目，你需要将代码组织成逻辑模块。本项目遵循 `AGENTS.md` 中定义的架构。

### 本项目的 `lib/` 结构

```
lib/
├── main.dart              ← 应用入口（仍然在此，但更精简）
├── app/                   ← Widget：主题、导航、应用外壳
├── screens/               ← 14 个界面，与 mono 流程对应
├── services/              ← 业务逻辑：钱包、apdu、ble
├── models/                ← 数据类型、存储接口
├── ble/                   ← BLE 外设（GATT 服务器）
└── ffi/                   ← Rust 绑定层（dart:ffi）
```

与默认结构相比：不是将所有代码堆在 `lib/` 或单个文件中，每个关注点都有独立的目录。这反映了 `iron-vault-mono` 中的关注点分离。

### 层级映射（从 iron-vault-mono 到 Flutter）

下表显示了 mono 仓库中的 TypeScript 模块映射到本项目中的哪个 Dart 文件：

| TypeScript（mono） | Dart/Flutter 对应物 |
|---|---|
| `@iron-vault/crypto` | **Rust crate**（`rust/src/`），通过 `lib/ffi/crypto_bridge.dart` 调用 |
| `@iron-vault/wallet` | `lib/services/wallet_service.dart` |
| `@iron-vault/apdu` | `lib/services/apdu_handler.dart` |
| `@iron-vault/theme` | `lib/app/theme.dart` — `ColorTokens` + `R` 常量 |
| `@iron-vault/i18n` | Flutter 内置国际化，通过 `.arb` 文件实现 |
| `apps/mobile/src/screens/` | `lib/screens/` — 14 个界面 widget |
| `apps/mobile/src/ble/` | `lib/ble/` — BLE 外设服务 |
| `apps/mobile/src/store/AppContext.tsx` | `lib/app/app_state.dart` — 应用状态 + 导航逻辑 |

### 具体示例

**主题移植。** 在 mono 仓库中，`packages/theme/src/index.ts` 导出 `ColorTokens` 对象和 `R` 圆角常量。在本项目中，Dart 对应物位于 `lib/app/theme.dart`：

```dart
// lib/app/theme.dart（概念代码 — 尚未实现）
class ColorTokens {
  final Color primary, bg, surface, text, error;
  static const dark = ColorTokens(
    primary: Color(0xFF8FC322),
    bg: Color(0xFF0F0F0F),
    surface: Color(0xFF1A1A1A),
    // ...
  );
}
const R = (sm: 6.0, lg: 12.0, xl: 18.0);
```

**APDU 处理器移植。** `packages/apdu/src/handler.ts` 中的 APDU 分发逻辑迁移到 `lib/services/apdu_handler.dart`。不再是使用 TypeScript 的 `switch` 语句对 `CLA` 字节进行分发，Dart 版本使用类似的模式，但将请求分发到 Dart 类中的异步方法。

**钱包服务移植。** `packages/wallet/src/service.ts` 定义了完整的钱包生命周期（hasWallet、setupWallet、unlockWallet、verifyPin）。这被移植到 `lib/services/wallet_service.dart`。函数签名直接从 TypeScript 翻译到 Dart，但底层的存储调用从 `AsyncStorage` 变更为 `Storage` 接口（在设备上由 `flutter_secure_storage` 支持，在测试中使用内存中的 `Map`）。

---

## 第五部分：核心概念快速参考

### Widget 树

在 Flutter 中，一切都是 Widget。按钮、文字、间距、对齐方式，甚至应用本身——都是 Widget。你通过将 widget 互相嵌套来构建 UI，形成一棵树。

```dart
// 一个 widget 树：MaterialApp → Scaffold → Column → Text
MaterialApp(
  home: Scaffold(
    body: Column(
      children: [Text('Hello')],
    ),
  ),
);
```

这在概念上类似于 React 中的 JSX——嵌套元素描述了视觉层级结构。但与 React 中 JSX 编译为 `React.createElement()` 调用不同，Flutter widget 是通过构造函数实例化的普通 Dart 对象。

每个 widget 的 `build()` 方法返回它在 widget 树中的那一部分。然后 Flutter 框架会遍历这棵树，将新树与旧树进行比较，以确定哪些部分需要重新渲染（类似于 React 的虚拟 DOM diff，但 Flutter 称之为 "element tree"）。

### `StatelessWidget` 与 `StatefulWidget`

**`StatelessWidget`** —— 永远不会变化的 widget。其所有配置在构造时提供，之后不可变。它只有一个 `build()` 方法。

```dart
// 一个只显示标题的静态界面。
// 在本项目中用于 Welcome 等界面。
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iron Vault')),
      body: Center(
        child: Column(
          children: [
            const Text('Welcome to Iron Vault'),
            ElevatedButton(
              onPressed: () {
                // 导航到创建钱包
              },
              child: const Text('Create Wallet'),
            ),
          ],
        ),
      ),
    );
  }
}
```

当 widget 的 UI 仅取决于其构造参数且没有其他内容随时间变化时，使用 `StatelessWidget`。

**`StatefulWidget`** —— 可以变化的 widget。它包含两个类：widget 本身（不可变配置）和一个 `State` 对象（在重建过程中持久存在的可变状态）。调用 `setState()` 来触发重建。

```dart
// 熵值采集界面需要跟踪用户点击的触摸点。
// 这需要可变状态。
class EntropyScreen extends StatefulWidget {
  const EntropyScreen({super.key});

  @override
  State<EntropyScreen> createState() => _EntropyScreenState();
}

class _EntropyScreenState extends State<EntropyScreen> {
  final List<Offset> _touchPoints = [];

  void _onTap(TapUpDetails details) {
    setState(() {
      _touchPoints.add(details.localPosition);
      if (_touchPoints.length >= 200) {
        // 已收集到足够的熵值，继续下一步
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapUp: _onTap,
      child: CustomPaint(
        painter: EntropyPainter(_touchPoints),
        size: Size.infinite,
      ),
    );
  }
}
```

当你的 widget 有随时间变化的状态（用户输入、异步数据加载、定时器）时，使用 `StatefulWidget`。

### `build()` 方法

每个 widget 都有一个 `build()` 方法。当 widget 需要渲染时（首次构建、`setState()` 之后，或祖先 widget 重建时），Flutter 框架会调用此方法。

规则：
- `build()` 必须是**纯函数**——无副作用、无网络调用、无文件 I/O。
- 它应返回一个单一的 Widget（如果什么都不显示则返回 `SizedBox.shrink()`）。
- 它会被频繁调用，所以保持其高效。避免在 `build()` 内部进行大量计算。

可以把 `build()` 想象成 React 的 `render()`——根据当前的状态和配置，返回当前时刻的 UI。

### `main.dart` 入口

每个 Flutter 应用都从这里开始：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}
```

`main()` 是 Dart 的入口点（类似于 Java/C 中的 `void main()`，或 Python 脚本中的顶层入口）。`runApp()` 将给定的 widget 挂载为 widget 树的根。此方法恰好调用一次。

### 热重载与热重启

**热重载（Hot reload）** —— 将更新的 Dart 源代码注入到正在运行的 Dart VM 中。应用状态被保留（计数器保持当前值，表单输入保留已输入的文字）。耗时不到一秒。通过保存文件（在 IDE 中）或在终端中按 `r` 键触发。并非所有更改都可以热重载（全局变量初始化器、`main()` 本身、某些枚举变更）。

**热重启（Hot restart）** —— 重新启动整个 Dart VM，并从零开始重新运行 `main()`。所有状态都会丢失。耗时数秒。当热重载无法正确应用更改时使用。

在本项目中，大多数 widget 和 UI 的更改都可以正常热重载。对 Rust SDK 的更改需要完全重新构建（重新运行 `flutter run`，或先运行 `cargo build`）。

### `pubspec.yaml` 依赖项

依赖项在 `pubspec.yaml` 的两个部分中声明：

```yaml
dependencies:
  flutter:
    sdk: flutter              # Flutter 框架本身
  cupertino_icons: ^1.0.8     # iOS 风格图标

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0       # Lint 规则
```

- `^1.0.8` 表示 ">=1.0.8 且 <2.0.0"（语义化版本兼容）。这是指定版本的标准方式。
- `flutter pub get` 读取 `pubspec.yaml`，解析所有依赖项的版本并下载它们。这会更新 `pubspec.lock`（锁定文件，类似于 `Cargo.lock` 或 `package-lock.json`）。
- `flutter pub add <package>` 一步完成添加包和运行 `pub get`。
- 依赖项来自 `pub.dev`（通过 `pub.flutter-io.cn` 镜像）。

### `runApp()`

```dart
runApp(const MyApp());
```

这是应用中最重要的单行代码。它：
1. 创建一个 `WidgetsBinding`（widget 层和引擎之间的接口）。
2. 将根 widget 附加到引擎的渲染表面。
3. 启动事件循环。

它恰好调用一次。之后，框架会自动处理重建。你不再需要调用 `runApp()`。

---

## 第六部分：开发工作流

### 常用命令

| 命令 | 作用 |
|---|---|
| `flutter run` | 在已连接的设备或模拟器上构建并启动应用。监视文件变化。按 `r` 触发热重载，按 `R` 触发热重启。 |
| `flutter run -d <device-id>` | 在特定设备上启动。使用 `flutter devices` 获取设备 ID。 |
| `flutter build apk` | 在 `build/app/outputs/flutter-apk/` 目录下生成 release 版 Android APK。 |
| `flutter build ios` | 生成 release 版 iOS 构建（需要 macOS + Xcode）。 |
| `flutter test` | 运行 `test/` 目录下的所有测试。 |
| `flutter test test/widget_test.dart` | 运行特定的测试文件。 |
| `flutter doctor` | 环境诊断（验证环境配置，检测问题）。 |
| `flutter pub get` | 下载并解析 `pubspec.yaml` 中列出的依赖项。 |
| `flutter pub add <package>` | 添加依赖项并运行 `pub get`。 |
| `flutter pub upgrade` | 将所有依赖项升级到最新的允许版本。 |
| `flutter analyze` | 对项目运行 Dart 静态分析（代码检查）。报告错误、警告和代码风格违规。 |
| `flutter format` | 按照官方风格格式化 Dart 源代码（类似于 `prettier`，但专为 Dart 设计）。 |
| `flutter clean` | 删除 `build/` 和 `.dart_tool/` 目录。构建卡住时有用。 |

### 构建模式

| 模式 | 标志 | 用途 | 编译方式 |
|---|---|---|---|
| Debug | `flutter run`（默认） | 开发。快速迭代、热重载、启用调试断言。 | JIT（解释执行） |
| Profile | `flutter run --profile` | 性能分析。禁用调试功能但保留部分追踪。 | AOT + JIT |
| Release | `flutter build apk --release` | 生产环境。最大优化，无调试工具，无热重载。 | AOT（原生） |

### 典型开发周期

1. 在 `lib/` 中编写或编辑 Dart 代码。
2. 保存文件。
3. 热重载自动触发（或在终端中按 `r` 键）。
4. 在运行中的应用中立即看到更改，不丢失状态。
5. 如果更改涉及 Rust SDK，则在 `rust/` 中运行 `cargo build --release`，然后热重启。

### 运行测试

```bash
# 运行所有 Dart 测试
flutter test

# 也运行 Rust 测试
cd rust && cargo test
```

加密 SDK 还有 Rust 测试（通过 `cargo test` 单独运行）。如果你对任何一方进行了更改，务必同时运行两种测试。

---

## 第七部分：在 Linux 上构建 Android

### 约束条件

在 Linux 上，你可以构建 Android APK，但不能构建 iOS 应用（iOS 需要 macOS 和 Xcode）。这没有问题——大多数开发和测试都在 Android 上进行。

### Android 构建的先决条件

| 先决条件 | 本机状态 | 如何修复（如果缺失） |
|---|---|---|
| Android SDK（`~/Android/Sdk`） | 已安装 | 通过 Android Studio 的 SDK Manager 下载。 |
| `cmdline-tools` | 缺失 | 通过 Android Studio 的 SDK Manager（SDK Tools 选项卡 → "Android SDK Command-line Tools (latest)"）安装。 |
| OpenJDK 17 | 未安装 | `sudo apt install openjdk-17-jdk` |
| Android 许可证已接受 | 未完成 | `flutter doctor --android-licenses`，然后逐个输入 `y`。 |

### 构建 APK

```bash
# Debug 构建（快速，用于测试）
flutter build apk --debug

# Release 构建（优化，体积更小，无调试工具）
flutter build apk --release

# 按架构拆分 APK（单个 APK 体积更小）
flutter build apk --split-per-abi
```

Release 版 APK 将位于 `build/app/outputs/flutter-apk/app-release.apk`。

### 在真机上运行

1. 在 Android 手机上启用开发者选项：进入设置 → 关于手机 → 连续点击 "版本号" 7 次。
2. 在开发者选项中启用 USB 调试。
3. 通过 USB 连接手机。
4. 运行 `flutter devices` 确认手机已显示。
5. 运行 `flutter run -d <device-id>`。

### 在模拟器上运行

1. 打开 Android Studio → AVD Manager → Create Virtual Device。
2. 或者使用命令行：
   ```bash
   avdmanager create avd -n pixel_6 -k "system-images;android-34;google_apis;x86_64"
   emulator -avd pixel_6
   ```
3. 运行 `flutter run`——它会自动检测正在运行的模拟器。

---

## 第八部分：常见陷阱与项目特定注意事项

这些内容来自 `AGENTS.md` 以及移植 mono 项目过程中的经验。在开始实现之前请仔细阅读。

### 1. Rust FFI 字符串

所有跨越 Rust ↔ Dart FFI 边界的字符串数据必须是空终止的 C 字符串（`*const c_char`）。Dart 的 `String` 是 UTF-16 内部表示，与 C 字符串不直接兼容。

**正确做法：**

```dart
// Dart 端：编码为 UTF-8 并以 Pointer<Utf8> 传递
import 'dart:ffi';
import 'package:ffi/ffi.dart';

final cString = mnemonic.toNativeUtf8();
rustFunction(cString);
calloc.free(cString);
```

```rust
// Rust 端：使用 CStr 进行转换
use std::ffi::CStr;
use std::os::raw::c_char;

pub unsafe extern "C" fn rust_function(input: *const c_char) {
    let s = CStr::from_ptr(input).to_str().unwrap();
    // 将 s 作为 &str 使用
}
```

绝不能将 Dart 的 `String` 未经编码直接通过 FFI 传递。这将产生垃圾数据。

### 2. Android 上的 BLE 外设

模拟 BLE 外设（广播为 Ledger Nano X）需要特定的 Android 权限。不同 Android 版本有不同要求：

| Android 版本 | 所需权限 |
|---|---|
| Android 9（API 28）及以下 | `BLUETOOTH`、`BLUETOOTH_ADMIN`、`ACCESS_FINE_LOCATION` |
| Android 10-11（API 29-30） | 同上 + `ACCESS_BACKGROUND_LOCATION` |
| Android 12+（API 31+） | `BLUETOOTH_ADVERTISE`、`BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`（无需位置权限）。还必须在清单中声明 `android:permission="BLUETOOTH_PERIPHERAL"`，并且应用必须拥有 `FOREGROUND_SERVICE` 权限。 |

BLE 外设需要一个前台服务来保证可靠的广播（否则操作系统可能会杀死后台 BLE 广播）。

本项目的 GATT 服务 UUID：`13d63400-2c97-0004-0000-4c6564676572`（与 Ledger Nano X 一致）。

### 3. PIN 存储

PIN 绝不会以明文形式存储。方案如下：

1. 生成随机盐值（16 字节以上）。
2. 在 Rust SDK 中使用 PBKDF2（10,000 次迭代）派生密钥。
3. 以 `salt_hex:hash_hex` 格式存储，键名为 `wallet.pinKdf`，保存在安全存储中。

还有一种旧的 `sha256(pin)` 格式，在读取时必须进行迁移（如果存储的值是不带 `salt_hex:` 前缀的单个十六进制字符串，则视为旧版 SHA-256 并进行升级）。

```dart
// 存储格式（概念代码）
const pinStorageKey = 'wallet.pinKdf';
// 存储的值："a1b2c3d4e5f6...:9f8e7d6c5b4a..."
```

PBKDF2 在 Rust 中执行（通过 FFI 调用），绝不要在 Dart 中执行。实际的存储使用 `flutter_secure_storage`（底层基于 Android Keystore / iOS Keychain）。

### 4. SetPin 的双重用途

`SetPin` 界面处理两种场景：

- **创建 PIN**：在钱包设置过程中（在 `GenerateMnemonic` 或 `ImportMnemonic` 之后）。
- **修改现有 PIN**：从设置界面进入。

通过检查 `generatedWords.isEmpty` 来判断当前处于哪种模式：

```dart
// SetPin 中的概念逻辑
final isChangingPin = widget.generatedWords.isEmpty;
```

如果 `generatedWords` 为空，则表示用户在修改现有 PIN。如果包含词组，则表示用户正在创建新钱包，需要先确认种子。

### 5. 认证后的导航

成功认证后（解锁钱包、首次设置 PIN），必须清空导航栈。绝不要让认证界面留在历史记录中。使用 `pushAndRemoveUntil`：

```dart
// 正确：清空栈
Navigator.of(context).pushAndRemoveUntil(
  MaterialPageRoute(builder: (_) => const VaultScreen()),
  (_) => false, // 移除所有之前的路由
);

// 错误：用户可以通过返回键回到认证界面
Navigator.of(context).push(
  MaterialPageRoute(builder: (_) => const VaultScreen()),
);
```

同样规则适用于重置钱包——使用 `pushAndRemoveUntil` 导航到 `WelcomeScreen`。

### 6. 启动闪屏预防

应用启动时，绝不能短暂闪现错误的界面。在构建任何 widget 之前，先检查钱包是否已存在：

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final hasWallet = await WalletService.hasWallet(storage);
  runApp(IronVaultApp(hasWallet: hasWallet));
}
```

在等待 `hasWallet()` 结果时，返回一个占位符：

```dart
class IronVaultApp extends StatelessWidget {
  // ...
  @override
  Widget build(BuildContext context) {
    // 如果还不知道 hasWallet 的状态，什么都不显示
    if (hasWallet == null) return const SizedBox.shrink();
    return MaterialApp(
      home: hasWallet! ? const UnlockScreen() : const WelcomeScreen(),
    );
  }
}
```

原则是：在知道状态之前什么都不渲染（或显示启动屏），然后渲染正确的界面。绝不要先渲染错误的界面再替换它。

### 7. 时序安全的 PIN 比较

PIN 比较必须是常量时间操作，以防止时序攻击。Dart 的 `==` 运算符在第一个不匹配的字符处就会短路返回。不要在 Dart 中进行 PIN 比较。

改用 Rust SDK 实现常量时间比较：

```rust
// Rust：常量时间比较
pub unsafe extern "C" fn timing_safe_eq(a: *const c_char, b: *const c_char) -> bool {
    let a_bytes = CStr::from_ptr(a).to_bytes();
    let b_bytes = CStr::from_ptr(b).to_bytes();
    if a_bytes.len() != b_bytes.len() {
        return false;
    }
    // 对每个字节进行 XOR，累积结果。不提前返回。
    let mut result = 0u8;
    for (x, y) in a_bytes.iter().zip(b_bytes.iter()) {
        result |= x ^ y;
    }
    result == 0
}
```

在 Dart 中调用此函数，而不是直接比较字符串。

### 8. 种子缓存失效

种子（通过 PBKDF2 将 BIP-39 助记词转换成的二进制种子）为了性能会在内存中缓存。在以下情况下清除缓存：

- 密码短语发生变化（即使是空密码短语与非空密码短语也会产生不同的种子）。
- 助记词提供者发生变化（重新导入或生成新钱包）。

未能使缓存失效意味着操作可能使用错误的种子，从而产生错误的地址并使用错误的密钥进行签名。

### 9. Dart UTF-8

mono 仓库曾有一个针对 Hermes（React Native 的 JS 引擎）的变通方案，因为该引擎缺少 `TextDecoder`。Dart 没有这种限制——直接使用 `dart:convert` 中的 `utf8`：

```dart
import 'dart:convert';

final decoded = utf8.decode(byteData);
```

无需变通方案。这适用于任何需要将字节解码为 UTF-8 字符串的场景。

### 关键要点

这些陷阱不是理论上的。每一个都在 mono 项目的开发过程中真实出现过。Flutter 移植版在设计上避免了它们，但前提是你必须在编写代码之前了解它们。如果你遇到一个看似无法解释的 bug，请重新阅读本部分——答案很可能就在这里。
