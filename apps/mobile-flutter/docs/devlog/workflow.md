# 开发工作流规范

> AI（Sisyphus）与人类协作的标准流程。

---

## 核心理念：文档驱动开发

```
写任务描述 (tasks/)
    ↓
讨论方案 (discusses/) ←→ 用户确认
    ↓
开始编码
    ↓
写开发日志 (devlog/)
    ↓
记录决策 (adr/)  ← 遇到重要选择时
    ↓
学习新东西 → 记笔记 (learning/)
```

---

## 一、任务生命周期

### 1. 提出任务（人类）

在 `docs/tasks/` 下新建一个 markdown 文件，用自然语言描述想做什么。可以使用任务模板：

```bash
cp docs/tasks/templates/task-template.md docs/tasks/taskN.md
```

不需要规范格式，随便写。

### 2. 精炼任务（AI）

Agent 读取原始描述后：

1. 理解意图 → 补充背景
2. 拆解为具体工作项（checkbox）
3. 明确涉及的文件/模块
4. 列出需要用户确认的问题

结果追加到任务文件末尾（`---` 分隔），保留原文。

### 3. 确认方案（人类）

用户审阅精炼后的任务，回答问题，调整方向。

### 4. 执行（AI）

- 创建 todo 追踪进度
- 每完成一个独立工作项，标记完成
- 遇到重要技术选择时，在 `discusses/` 下记录讨论
- 每天/每次会话结束时，写开发日志

### 5. Review（AI）

执行完成后自动调用 `/review-work`，检查：

- 目标是否达成
- 代码质量和安全性
- 是否遵循项目约定

### 6. 归档（AI）

- 更新任务文件，标记所有 checkbox
- 更新 `AGENTS.md`（追加新发现的模式）

---

## 二、协作规则

### AI 主动推进

- Agent 在完成当前任务后，会主动提出下一步建议
- 建议写在任务文件末尾的"下一步"区块
- 用户可以批准、调整或拒绝

### 讨论机制

- 当有 2 个以上可行方案时，先讨论再编码
- 讨论记录放在 `docs/discusses/` 下
- 讨论结束后更新结论，并归档

### 代码变更规范

| 原则 | 说明 |
|---|---|
| 不动无关代码 | 只修改任务涉及的文件 |
| 匹配现有模式 | 代码风格与 AGENTS.md 定义的架构一致 |
| 不加新依赖 | 除非必要且经过讨论 |
| 不压制类型 | 禁止 `as any`、`@ts-ignore` 等 |
| bugfix 最小化 | 只修 bug，不重构 |

### Review 标准

通过 review 需要满足：

- [ ] LSP diagnostics 无错误
- [ ] 代码符合 AGENTS.md 定义的模式
- [ ] 无安全隐患
- [ ] 无 AI 生成的冗余代码（使用 `/remove-ai-slops`）

---

## 三、文件命名规范

| 文档类型 | 命名规则 | 示例 |
|---|---|---|
| 任务描述 | `taskN.md`（N 为数字） | `task1.md`、`task2.md` |
| 讨论记录 | `kebab-case.md` | `ble-peripheral-arch.md` |
| 决策记录 | `NNN-title.md` | `001-state-management.md` |
| 学习笔记 | `kebab-case.md` | `dart-async-basics.md` |
| 开发日志 | `YYYY-MM-DD.md` | `2026-05-23.md` |

---

## 四、用户承诺

为了让协作高效，用户只需要做三件事：

1. **写任务想法** — 在 `tasks/` 下随便写，越随意越好
2. **回答问题** — Agent 精炼任务后会列出需要确认的问题
3. **审阅重要决策** — 涉及架构选择时，Agent 会提方案让你选

其余所有事情（代码实现、文档记录、学习笔记、进度追踪）由 Agent 自动完成。

---

## 五、开发循环：热更工作流

> 日常** Dart 层**改动不需要重新 build APK 和 adb install，使用 Flutter 自带热更新。

### 基本流程

```bash
# 1. 首次启动（USB/WiFi 连接设备）
flutter run

# 完成后，应用已跑在设备上，终端进入交互模式
# 后续改代码只需在终端操作：
```

| 按键 | 命令 | 速度 | 行为 |
|---|---|---|---|
| `r` | Hot Reload | ~1s | 重编译变更的 Dart 源码，注入运行的 isolate，**保留状态** |
| `R` | Hot Restart | ~3-5s | 重建整个应用，**重置状态**到初始 |
| `q` | 退出 | — | 断开设备连接 |

### 选择策略

| 改了什么东西 | 用哪个 |
|---|---|
| Widget 树、布局、颜色、文本 | `r`（hot reload，保留页面状态） |
| `initState`、全局状态、Provider | `R`（hot restart，强制走一遍初始化） |
| 新增 package (`flutter pub add`) | `R`（hot restart 就够了） |
| Rust FFI (`rust/src/` 下的代码) | **必须**重新 build：`./scripts/build_and_install.sh` |
| Android 原生 (`android/`) 或 Swift/Kotlin 代码 | **必须** `flutter run --hot` 或重新 build |
| iOS 原生 (`ios/`) 代码 | **必须**重新 build |

### VS Code 快捷键

- `Ctrl+F5` → 启动/附加到设备
- `Ctrl+S` → 保存文件后自动触发 hot reload（VS Code 默认行为）
- 闪电⚡按钮（Flutter 工具栏）→ hot reload

### 本项目典型循环

```
flutter run                    ← 一次启动，后面一直用
    ↓
改 Dart 代码 (lib/ 下任意 .dart)
    ↓
按 r                          ← hot reload，~1秒看到效果
    ↓
重复改 & r 直到满意
    ↓
需要测 Rust 或原生改动时 → ./scripts/build_and_install.sh
```

### ⚠️ 什么时候还是要 build APK

| 改了哪里 | 为什么 |
|---|---|
| `rust/src/` 下任何代码 | FFI 层需要交叉编译 `.so`，打包进 APK |
| `android/app/src/main/jniLibs/` | 原生库更新 |
| Android manifest / Gradle 配置 | 原生项目配置变更 |
| iOS `Info.plist` / Podfile | iOS 配置变更 |
| 新增/删除 Flutter plugin（需要原生层注册的） | 需重新编译原生代码 |

> **经验法则**：`lib/` 下纯 Dart 改动 → `r` 或 `R`。除此之外 → build APK。
