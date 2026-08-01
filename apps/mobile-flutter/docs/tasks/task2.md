接下来我可能需要你帮我起一个简单的 flutter 项目，然后还有就是在learning底下建一个 flutter 的学习目录，然后先帮我介绍一下 flutter 一些基本知识，比如说怎么安装怎么使用，比如说比较常见的目录结构，然后有什么需要注意的要点。

---

## Refined Task Description

### Goal

完成 Flutter 开发环境搭建 + 项目初始化，并在 `docs/learning/flutter/` 下建立 Flutter 基础知识文档，帮助非 Flutter 开发者快速上手。

### Background

- 项目已完成 `docs/` 目录结构和模板设计（task1）
- 用户画像：有 JS/Python 基础、了解 Rust、熟悉 iron-vault-mono、Linux 环境、目标 Android + iOS、希望 Agent 主动推进并做详细解释
- task1 的「下一步建议」中，项目初始化为首要任务
- 当前工作目录已是 `iron-vault-flutter`，但尚未执行 `flutter create`

### Breakdown

- [ ] **1. 环境检查与安装引导** — 检查系统是否已安装 Flutter SDK / Dart SDK，如未安装则给出 Linux 环境下的安装指导（推荐 `fvm` 或官方 tarball 方式）
- [ ] **2. 初始化 Flutter 项目** — 在当前目录或合适位置执行 `flutter create`。注意：
  - 项目名称建议 `iron_vault_flutter`
  - 平台选择至少包含 `android,ios`
  - 初始化后根据需要调整目录结构，对接到 AGENTS.md 中规划的架构（`lib/app/`、`lib/screens/`、`lib/services/` 等）
- [ ] **3. 配置项目元信息** — 更新 `pubspec.yaml`：设置正确的项目描述、版本号、SDK 约束，后续在需要时添加 AGENTS.md 中列出的关键依赖（`flutter_blue_plus`、`flutter_secure_storage`、`provider`/`riverpod`、`go_router`/custom navigator、`qr_flutter`/`qr`）
- [ ] **4. 创建 Flutter 学习目录** — 在 `docs/learning/flutter/` 下建立学习资料入口，规划后续文档结构
- [ ] **5. 撰写 Flutter 基础入门文档** — 创建 `docs/learning/flutter/basics.md`（或拆分多篇），覆盖：
  - **Flutter / Dart 是什么**（一句话定位）
  - **安装与环境配置**（Linux 上安装 Flutter SDK、配置 `flutter` 命令、`flutter doctor` 验证）
  - **`flutter create` 生成的默认目录结构解读**（每个目录/文件的用途）
  - **Flutter 项目与本项目架构的关系**（从默认结构过渡到 AGENTS.md 规划的 `lib/app/`、`lib/screens/` 等子目录）
  - **核心概念速览**（Widget 树、StatefulWidget vs StatelessWidget、`build()` 方法、`main.dart` 入口、路由）
  - **开发流程**（`flutter run`、热重载、`flutter build`、`flutter test`）
  - **Android 构建要点**（Linux 上只能构建 Android APK，需要 Android Studio / Android SDK，可本地连接真机或使用模拟器）
  - **常见陷阱与本项目注意事项**（参考 AGENTS.md「Common Pitfalls」章节中的前几条：FFI 字符串、BLE 权限、PIN 存储、导航栈、启动闪屏预防等）

### Files / Modules Involved

| 文件 / 模块 | 说明 |
|---|---|
| 项目根目录 | `flutter create` 执行地 |
| `pubspec.yaml` | 项目配置和依赖管理 |
| `lib/` | 初始化后调整为 AGENTS.md 架构 |
| `docs/learning/flutter/basics.md` | Flutter 基础入门文档（待创建） |
| `docs/learning/flutter/` | 学习目录入口 |
| `AGENTS.md` | 架构参考（Common Pitfalls、目录规划） |

### Notes

- **先检查，后安装，再创建** — 不要假定 Flutter 已安装，先 `which flutter` / `flutter --version` 检查
- **详细解释原则** — 所有安装步骤、目录结构解释、概念说明都要写清楚"为什么"，不只是"怎么做"
- **目录结构调整策略** — `flutter create` 生成的默认 `lib/` 只有 `main.dart`，建议：
  1. 保留 `main.dart`
  2. 按 AGENTS.md 创建子目录（`app/`、`screens/`、`services/`、`models/`、`ble/`、`ffi/`）
  3. 在每个目录下放一个 `.gitkeep` 或简短说明文件
- **依赖先声明不安装** — `pubspec.yaml` 中可先注释掉关键依赖（如 `flutter_blue_plus`、`flutter_secure_storage`），等到对应功能实现时再实际添加和 `pub get`
- **学习文档应与项目紧密关联** — 不要写泛泛的 Flutter 教程，每个概念都关联到本项目具体场景（例如讲 Widget 时提到本项目预期的 widget 组织结构）

### Open Questions

1. **Flutter SDK 版本偏好** — 是否有偏好的 Flutter 版本？（stable/beta/master？特定版本号如 3.x？）还是跟随最新 stable？
2. **包管理策略** — `provider` vs `riverpod` 作为状态管理方案，有偏好吗？还是由 Agent 推荐？
3. **路由方案偏好** — `go_router` vs 自定义 Navigator 2.0 封装？还是由 Agent 推荐？
4. **学习文档详细度** — Flutter 基础文档希望覆盖到什么详细程度？是"快速上手够用就行"，还是"尽量全面的参考"？
5. **Android 构建环境** — 当前 Linux 上是否已安装 Android Studio / Android SDK？需要辅助配置吗？