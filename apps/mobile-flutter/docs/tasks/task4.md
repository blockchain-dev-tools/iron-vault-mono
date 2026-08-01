帮我设计一系列进阶练习让我对flutter更深的了解

---

## Refined Task Description

### Goal

设计一套面向已完成 [basics.md](../learning/flutter/basics.md) 和 [roadmap.md](../learning/roadmap.md) 第三阶段的进阶练习，覆盖 Flutter 中高级概念。练习以 **iron-vault-flutter 项目为实验场**，每个练习产出可运行的代码，最终进阶者能独立完成项目全部 14 个界面的高质量实现。

### Background

- 学习者已掌握：Dart 语法、Widget 树、StatelessWidget/StatefulWidget、基础布局、`pubspec.yaml`、热重载
- 项目特点：BLE 外设、Rust FFI 加密、14 屏幕导航、APDU 协议、安全存储
- 进阶目标：从"能写页面"到"理解 Flutter 运行机制，能写出高性能、可测试、可维护的代码"

### Breakdown

#### 第一层：Flutter 核心机制深入（6 个练习）

- [ ] **Exercise 1: BuildContext 与 InheritedWidget**
  - 理解 `BuildContext` 是什么、Widget/Element/RenderObject 三层树的关系
  - 手动实现一个 `InheritedWidget`（不用 Provider）实现主题透传
  - 产出：`lib/app/minimal_theme.dart` — 不依赖 `ThemeData` 的轻量主题系统

- [ ] **Exercise 2: Key 的作用与 widget 复用**
  - 对比 `ValueKey`、`ObjectKey`、`UniqueKey`、`GlobalKey` 的行为差异
  - 复现"无 key 时状态错乱"的经典场景（列表项重排导致 State 残留）
  - 产出：`test/exercises/key_behavior_test.dart` — 通过 widget test 验证每种 key 的行为

- [ ] **Exercise 3: RenderObject 与 CustomSingleChildLayout**
  - 理解 `RenderBox` 的布局协议（`performLayout` / `computeMinIntrinsicWidth`）
  - 实现一个自定义 `RenderObject`：`ShakeWidget` — 子 widget 在触发时产生抖动动画（不依赖 `AnimationController` + `Transform`，直接操作 paint 偏移）
  - 产出：`lib/exercises/shake_widget.dart`

- [ ] **Exercise 4: ScrollPhysics 与自定义滚动行为**
  - 理解 `ScrollPhysics` 的 `applyPhysicsToUserOffset` / `simulation` 
  - 实现一个 `MagneticScrollPhysics` — 在 ListView 滚动停止时自动吸附到最近的 item
  - 产出：`lib/exercises/magnetic_scroll.dart` + 演示页面

- [ ] **Exercise 5: Slivers 与 CustomScrollView**
  - 理解 Sliver 协议：`SliverGeometry`、`performLayout` 的 constraints → geometry 传递
  - 实现一个 `SliverParallaxHeader` — 可折叠的视差头部（类似 iOS 系统设置页顶部效果）
  - 产出：`lib/exercises/sliver_parallax.dart`

- [ ] **Exercise 6: 自定义 Painter 与 Canvas 进阶**
  - 使用 `CustomPainter` 画一个 Ledger 风格 Logo（六边形 + 芯片图形）
  - 使用 `Canvas` API：`drawPath`、`drawArc`、`shader`、`clipPath`
  - 产出：`lib/app/widgets/ledger_logo.dart` — 可复用到 Welcome 和 Unlock 界面

#### 第二层：状态管理与架构模式（5 个练习）

- [ ] **Exercise 7: Provider 源码阅读 + 最小实现**
  - 读 `provider` 包源码，理解 `ChangeNotifierProvider`/`MultiProvider` 的实现原理
  - 手写一个 50 行内的最小 Provider（基于 `InheritedWidget` + `Listenable`）
  - 产出：`lib/exercises/minimal_provider.dart` + 注释说明与官方 provider 的差异

- [ ] **Exercise 8: Riverpod 核心概念**
  - 理解 `Provider` vs `ProviderRef`、`family`、`autoDispose`、`StateNotifierProvider`
  - 将 iron-vault 的导航状态从 `AppState` 类迁移到一个 Riverpod `StateProvider`
  - 对比两种方式的测试难度差异
  - 产出：`lib/exercises/riverpod_nav_demo.dart` + 对比文档 `docs/learning/flutter/state_compare.md`

- [ ] **Exercise 9: BLoC 模式实战**
  - 用 `flutter_bloc` 实现 BLE 状态机（idle → broadcasting → connected → error）
  - 理解 `Bloc` > `Event` > `State` 的完整链路
  - 产出：`lib/ble/ble_bloc.dart` + `lib/ble/ble_bloc_test.dart`

- [ ] **Exercise 10: 命令/查询分离（CQS）+ 不可变状态**
  - 将 `WalletService` 重构为纯函数式：每个方法返回新状态而非修改内部字段
  - 理解为什么不可变状态在 Flutter 中更安全（`setState` 的比较机制）
  - 产出：`lib/services/wallet_service_immutable.dart` — 对比版实现

- [ ] **Exercise 11: 依赖注入（DI）容器设计**
  - 不用 `get_it` / `Provider`，手写一个 DI 容器（支持 lazy 注册和工厂注册）
  - 理解服务定位器模式 vs 依赖注入的取舍
  - 产出：`lib/exercises/di_container.dart`

#### 第三层：Flutter 性能与调试（4 个练习）

- [ ] **Exercise 12: Widget 重建追踪与优化**
  - 使用 `RepaintBoundary`、`shouldRepaint`、`const` 构造函数来减少不必要的重建
  - 学会使用 Flutter DevTools 的 Rebuild Counts 和 Repaint Rainbow
  - 给 VaultScreen 添加性能埋点，记录不必要的重建次数
  - 产出：`lib/exercises/rebuild_tracker.dart` + 优化后的 VaultScreen 性能报告

- [ ] **Exercise 13: 内存泄漏诊断**
  - 故意制造一个内存泄漏（定时器未取消、Stream 未关闭、全局回调引用）
  - 使用 DevTools 的 Memory 页面定位泄漏
  - 修复并对比 leak 前后的 GC 行为
  - 产出：`docs/learning/flutter/memory_leak_patterns.md`

- [ ] **Exercise 14: Isolate 与计算密集型任务**
  - 理解 `Isolate`、`compute()`、其与主 Isolate 的内存隔离
  - 将助记词派生（PBKDF2 的一部分）通过 `Isolate` 执行（模拟 Rust SDK 还没写完时的场景）
  - 对比有/无 Isolate 时的 UI 帧率（用 `PerformanceOverlay`）
  - 产出：`lib/exercises/isolate_mnemonic_derive.dart`

- [ ] **Exercise 15: 延迟加载（Deferred Loading）与代码拆分**
  - 用 `deferred as` 懒加载 BLE 相关界面
  - 验证 APK 大小变化和首次加载时间
  - 产出：修改 `lib/screens/` 中 BLE 相关 screen 的导入方式

#### 第四层：平台通道与原生交互（3 个练习）

- [ ] **Exercise 16: MethodChannel 基础**
  - 在 Android (Kotlin) 端暴露一个获取设备序列号的方法
  - 在 Dart 端通过 `MethodChannel` 调用
  - 理解 `EventChannel` 的流式通信模式（用于 BLE 状态回调）
  - 产出：`lib/exercises/device_info_channel.dart` + `android/app/src/main/kotlin/.../DeviceInfoPlugin.kt`

- [ ] **Exercise 17: FFI 深入 — 内存管理**
  - 超越 `CString`：理解 `Pointer`、`Allocator`、`Pointer<Utf8>` 的内存生命周期
  - 实现一个 Dart 侧的内存安全包装器，确保 Rust 分配的内存被正确释放
  - 产出：`lib/exercises/ffi_safe_wrapper.dart` + Rust 侧 `memory_test_helper` 函数

- [ ] **Exercise 18: PlatformView 与原生组件嵌入**
  - 在 Flutter 中嵌入一个 Android `SurfaceView`（用于未来可能的扫码功能）
  - 理解 `AndroidView` / `UiKitView` 的绘制模式和性能约束
  - 产出：`lib/exercises/native_camera_preview.dart`（扫码预览占位）

#### 第五层：测试策略全覆盖（4 个练习）

- [ ] **Exercise 19: 单元测试 — 纯逻辑**
  - 给 `CryptoBridge` 的 Rust FFI 包装器寫测试（mock FFI 函数返回值）
  - 理解 `Mockito` / `mocktail` 的用法
  - 产出：`test/services/crypto_bridge_test.dart`

- [ ] **Exercise 20: Widget 测试 — 交互验证**
  - 测试 `EntropyScreen`：模拟 200 次点击 → 验证跳转到 `GenerateMnemonic`
  - 测试 `SetPin`：验证两次输入一致/不一致的状态
  - 测试 `VerifyMnemonic`：验证选错/选对时的 UI 变化
  - 产出：`test/screens/` 下对应文件

- [ ] **Exercise 21: 集成测试 — 全流程**
  - 用 `integration_test` 包跑完整钱包创建流程
  - 理解 Flutter 集成测试的原理（在真机/模拟器上运行，驱动真实 UI）
  - 产出：`integration_test/wallet_flow_test.dart`

- [ ] **Exercise 22: Golden 测试（快照测试）**
  - 给 `AccountDetailScreen` 做 golden test：验证渲染输出与 golden 文件一致
  - 理解 golden 测试的原理和 CI 集成注意事项
  - 产出：`test/screens/account_detail_golden_test.dart` + golden 文件

#### 第六层：项目融合（3 个综合实践）

- [ ] **Exercise 23: 自定义 Navigator 2.0 路由系统**
  - 不用 `go_router` / `auto_route`，直接使用 `Router` + `RouteInformationParser` + `RouterDelegate`
  - 理解声明式导航 vs 命令式导航
  - 实现 deep link 支持（从通知点击直接进 AccountDetail）
  - 产出：`lib/app/router_delegate.dart` + `lib/app/route_state.dart`

- [ ] **Exercise 24: BLE 外设状态的完整 UI 渲染管线**
  - 用 StreamBuilder 监听 BLE 状态流
  - 实现连接状态 → UI 的完整链路：广播中 → 已连接 → 收发 APDU → 断开 → 重连
  - 在 VaultScreen 顶部添加一个 BLE 状态条（类似 Ledger Live 的效果）
  - 产出：`lib/app/widgets/ble_status_bar.dart`

- [ ] **Exercise 25: 完整国际化多语言方案**
  - 使用 Flutter 内置的 `.arb` 文件实现 EN/ZH 双语
  - 实现语言切换（不重启应用）
  - 理解 `LocalizationsDelegate` 和 `Intl` 包的配合
  - 产出：`lib/l10n/` 下完整 arbit 文件 + 语言切换界面

### Files / Modules Involved

- `lib/exercises/` — 新建目录，存放练习产物（与项目主代码隔离）
- `test/exercises/` — 练习对应的测试
- `docs/learning/flutter/` — 练习输出的文档
- `lib/app/`、`lib/screens/`、`lib/services/`、`lib/ble/` — 项目已有模块，部分练习会直接修改

### Notes

- 所有练习产物先放在 `lib/exercises/` 下，不直接修改项目主代码（除非练习明确要求修改）
- 每个练习应产出可运行的 Dart 代码 + 至少一个测试
- 练习难度从第一层到第六层递增，前两层是后续练习的前提
- 建议每周完成 2-3 个练习
- `docs/exercises/` 目录自动归纳入门到进阶的所有课程代码

### Open Questions

- 练习是否应该产出可运行的 Flutter 页面（有 UI）还是纯逻辑代码也可（如 DI 容器）？
- 是否需要一个独立的 Flutter app（`lib/exercises_main.dart`）作为练习的运行入口，还是在现有项目内直接运行？
- 第六层有三个综合练习，是否太多或太少？是否需要额外增加 Rust ↔ Dart FFI 的进阶练习？
- 是否需要对每个练习预估完成时间（如"预计 2-3 小时"）？