# Flutter 学习路线

> 针对 **有 JS/Python 基础**、**了解 Rust**、**熟悉 iron-vault-mono 项目** 的学习者。
> 原则：**边做边学**，任务驱动，不花大块时间纯理论学习。

---

## 第一阶段：Dart 语言基础（预计 2-3 天）

> **目标**：能读懂 Dart 代码，知道它和 JS/TS/Python 的关键区别。

### 必学

| 主题 | 与 JS/Python 的对应 | 建议时间 |
|---|---|---|
| 变量 & 类型系统 | `var` / `final` / `const` ←→ `const` / `let`；Dart 是强类型 | 1-2h |
| 函数 | 命名参数 `{}`、可选参数 `[]`、箭头函数 `=>` | 1h |
| 类 & 构造函数 | 构造语法糖 `this.x`、命名构造函数、工厂构造函数 | 1-2h |
| 异步 | `Future` ←→ `Promise`、`async`/`await` 概念相同 | 1h |
| 集合 | `List` ←→ Array、`Map` ←→ Object/Dict、`Set` | 0.5h |
| Null safety | `?` `!` `late` 是 Dart 特有的，重点理解 | 1h |

### 推荐资源

- [Dart 官方语言导览](https://dart.dev/language) — 花 2-3 小时通读一遍即可
- [Dart codelab](https://dart.dev/codelabs) — 交互式练习

### 不需要深究

- Dart 的反射 / `mirrors` — Flutter 中极少用
-  isolates / 并发模型 — 用到再学

---

## 第二阶段：Flutter Widget 基础（预计 3-5 天）

> **目标**：理解"一切皆 Widget"，能搭出一个简单的页面。

### 核心概念

| 概念 | 说明 |
|---|---|
| Widget 树 | Flutter 的 UI 是嵌套 Widget 组成的树，类似 React 的 JSX 树 |
| `StatelessWidget` vs `StatefulWidget` | 类似 React 函数组件 vs 类组件 |
| `build()` 方法 | 相当于 React 的 `render()` |
| `setState()` | 触发重新 build，类似 React 的 `setState` |
| `const` Widget | 不变 Widget 的优化手段，类似 React.memo |

### 必备 Widget 清单

按学习顺序：

1. **`Container`** — 最常用的布局容器（相当于 `div` + 样式）
2. **`Row` / `Column`** — 水平/垂直布局（Flexbox）
3. **`Text`** — 文本显示
4. **`Image`** — 图片
5. **`Icon`** — 图标
6. **`ElevatedButton` / `TextButton`** — 按钮
7. **`TextField`** — 输入框
8. **`ListView`** — 滚动列表（相当于 FlatList）
9. **`Stack`** — 层叠布局（相当于 absolute positioning）
10. **`Scaffold` / `AppBar`** — 页面骨架

### 推荐学习方式

> 打开 [Flutter Widget of the Week](https://www.youtube.com/playlist?list=PLjxrf2q8roU3ahJVrSgAnPjzkpGmL9Czl) 播放列表，每天看 2-3 个，边看边在 `dartpad.dev` 上试。

---

## 第三阶段：项目骨架搭建（边做边学，预计 1 周）

> **目标**：完成 Flutter 项目初始化，跑起来一个能看的主界面。

### 实操任务顺序

1. **初始化项目** - `flutter create` + 目录结构调整
2. **配置主题系统** - 移植 `ColorTokens` + `R` 常量
3. **搭建路由框架** - 实现 14 个屏幕的占位路由
4. **实现 Welcome 页面** - 最简单的静态页面
5. **配置依赖** - `flutter_blue_plus`、`flutter_secure_storage` 等

### 需要同时学习的 Flutter 概念

| 任务 | 涉及的新概念 |
|---|---|
| 主题系统 | `ThemeData`、`Color`、`MediaQuery` |
| 路由 | `Navigator`、`routes`、`pushAndRemoveUntil` |
| 页面布局 | `Padding`、`EdgeInsets`、`SizedBox`、`Center` |
| 依赖管理 | `pubspec.yaml`、`flutter pub get` |

---

## 第四阶段：核心功能开发（持续迭代）

> **目标**：逐步完成 14 个屏幕 + BLE + 加密 SDK。

### 学习优先级（按开发顺序）

| 阶段 | 主题 | 学习资源 |
|---|---|---|
| 4a | 状态管理（Provider / Riverpod） | 官方文档 + 项目实践 |
| 4b | 导航与路由深入（go_router） | 官方文档 |
| 4c | BLE 蓝牙外设模式 | `flutter_blue_plus` 文档 |
| 4d | Rust FFI (`dart:ffi`) | Flutter FFI 文档 |
| 4e | 安全存储 | `flutter_secure_storage` 文档 |
| 4f | 动画 & 手势 | 用到再学 |

---

## 学习资源汇总

| 资源 | 用途 | 优先级 |
|---|---|---|
| [Dart 官方导览](https://dart.dev/language) | Dart 语言参考 | ⭐⭐⭐ |
| [Flutter 官方文档](https://docs.flutter.dev/) | 全面参考 | ⭐⭐⭐ |
| [Flutter Widget of the Week](https://www.youtube.com/playlist?list=PLjxrf2q8roU3ahJVrSgAnPjzkpGmL9Czl) | Widget 速览 | ⭐⭐⭐ |
| [Dartpad](https://dartpad.dev/) | 在线实验场 | ⭐⭐⭐ |
| [Flutter 实战（电子书）](https://book.flutterchina.club/) | 中文系统教程 | ⭐⭐ |
| [Awesome Flutter](https://github.com/Solido/awesome-flutter) | 资源合集 | ⭐ |

---

## 与 JS/Python 的快速对照

| 概念 | JavaScript/Python | Dart/Flutter |
|---|---|---|
| 类型系统 | 动态 / 渐进类型 | 静态强类型，类型推断 |
| UI 构建 | JSX / template | Widget 树（代码即 UI） |
| 样式 | CSS | Widget 属性 + `Theme` |
| 状态管理 | Redux / Vuex 等 | Provider / Riverpod / Bloc |
| 异步 | Promise / async-await | Future / async-await |
| 包管理 | npm / pip | pub |
| 构建工具 | webpack / vite | flutter build (内置) |
| 热重载 | HMR | Hot Reload（更强大） |
