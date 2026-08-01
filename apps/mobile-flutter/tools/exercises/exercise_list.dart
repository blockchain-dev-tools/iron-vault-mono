// exercise_list.dart — Metadata for all 25 exercises across 6 layers.
//
// Used by exercises_main.dart to render the exercise index.
//
// A new exercise is "implemented" when its output file(s) exist and
// can be run / tested.  Add a demo page in exercises_main.dart and
// flip implemented → true.

class ExerciseItem {
  final int number;
  final String title;
  final String brief;
  final String layer;
  final bool implemented;

  const ExerciseItem({
    required this.number,
    required this.title,
    required this.brief,
    required this.layer,
    this.implemented = false,
  });
}

const List<ExerciseItem> exercises = [
  // ── Layer 1: 核心机制深入 ──────────────────────────────────
  ExerciseItem(
    number: 1,
    title: 'BuildContext 与 InheritedWidget',
    brief: '手动实现 InheritedWidget 主题透传',
    layer: '一',
    implemented: true,
  ),
  ExerciseItem(
    number: 2,
    title: 'Key 的作用与 Widget 复用',
    brief: 'ValueKey / ObjectKey / UniqueKey / GlobalKey 对比测试',
    layer: '一',
    implemented: true,
  ),
  ExerciseItem(
    number: 3,
    title: 'RenderObject 与 CustomSingleChildLayout',
    brief: '自定义 RenderObject 实现 ShakeWidget',
    layer: '一',
    implemented: true,
  ),
  ExerciseItem(
    number: 4,
    title: 'ScrollPhysics 与自定义滚动行为',
    brief: 'MagneticScrollPhysics 自动吸附',
    layer: '一',
    implemented: true,
  ),
  ExerciseItem(
    number: 5,
    title: 'Slivers 与 CustomScrollView',
    brief: 'SliverParallaxHeader 可折叠视差头部',
    layer: '一',
    implemented: true,
  ),
  ExerciseItem(
    number: 6,
    title: '自定义 Painter 与 Canvas 进阶',
    brief: 'Ledger 风格 Logo CustomPainter',
    layer: '一',
    implemented: true,
  ),

  // ── Layer 2: 状态管理与架构模式 ─────────────────────────────
  ExerciseItem(
    number: 7,
    title: 'Provider 源码阅读 + 最小实现',
    brief: '50 行最小 Provider（InheritedWidget + Listenable）',
    layer: '二',
  ),
  ExerciseItem(
    number: 8,
    title: 'Riverpod 核心概念',
    brief: 'Riverpod 导航状态 + Provider 对比 ProviderRef',
    layer: '二',
  ),
  ExerciseItem(
    number: 9,
    title: 'BLoC 模式实战',
    brief: 'flutter_bloc 实现 BLE 状态机',
    layer: '二',
  ),
  ExerciseItem(
    number: 10,
    title: '命令/查询分离（CQS）+ 不可变状态',
    brief: 'WalletService 纯函数式重构',
    layer: '二',
  ),
  ExerciseItem(
    number: 11,
    title: '依赖注入（DI）容器设计',
    brief: '手写 DI 容器（lazy / 工厂注册）',
    layer: '二',
  ),

  // ── Layer 3: 性能与调试 ─────────────────────────────────────
  ExerciseItem(
    number: 12,
    title: 'Widget 重建追踪与优化',
    brief: 'RepaintBoundary / shouldRepaint / const 优化',
    layer: '三',
  ),
  ExerciseItem(
    number: 13,
    title: '内存泄漏诊断',
    brief: '制造并修复内存泄漏 + DevTools 分析',
    layer: '三',
  ),
  ExerciseItem(
    number: 14,
    title: 'Isolate 与计算密集型任务',
    brief: 'Isolate 执行 PBKDF2 派生',
    layer: '三',
  ),
  ExerciseItem(
    number: 15,
    title: '延迟加载与代码拆分',
    brief: 'deferred as 懒加载 BLE 界面',
    layer: '三',
  ),

  // ── Layer 4: 平台通道与原生交互 ────────────────────────────
  ExerciseItem(
    number: 16,
    title: 'MethodChannel 基础',
    brief: 'Android 设备序列号 + EventChannel 流式通信',
    layer: '四',
  ),
  ExerciseItem(
    number: 17,
    title: 'FFI 深入 — 内存管理',
    brief: 'Pointer / Allocator 生命周期 + 安全包装器',
    layer: '四',
  ),
  ExerciseItem(
    number: 18,
    title: 'PlatformView 与原生组件嵌入',
    brief: 'Android SurfaceView 嵌入（扫码预览占位）',
    layer: '四',
  ),

  // ── Layer 5: 测试策略全覆盖 ─────────────────────────────────
  ExerciseItem(
    number: 19,
    title: '单元测试 — 纯逻辑',
    brief: 'CryptoBridge FFI 包装器测试（mock FFI）',
    layer: '五',
  ),
  ExerciseItem(
    number: 20,
    title: 'Widget 测试 — 交互验证',
    brief: 'EntropyScreen / SetPin / VerifyMnemonic 测试',
    layer: '五',
  ),
  ExerciseItem(
    number: 21,
    title: '集成测试 — 全流程',
    brief: 'integration_test 完整钱包创建流程',
    layer: '五',
  ),
  ExerciseItem(
    number: 22,
    title: 'Golden 测试（快照测试）',
    brief: 'AccountDetailScreen golden test',
    layer: '五',
  ),

  // ── Layer 6: 项目融合 ───────────────────────────────────────
  ExerciseItem(
    number: 23,
    title: '自定义 Navigator 2.0 路由系统',
    brief: 'Router + RouteInformationParser + RouterDelegate',
    layer: '六',
  ),
  ExerciseItem(
    number: 24,
    title: 'BLE 外设状态的完整 UI 渲染管线',
    brief: 'StreamBuilder + BLE 状态条（类 Ledger Live）',
    layer: '六',
  ),
  ExerciseItem(
    number: 25,
    title: '完整国际化多语言方案',
    brief: '.arb EN/ZH 双语 + 语言切换',
    layer: '六',
  ),
];
