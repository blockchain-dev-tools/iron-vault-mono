生成一个skill和command， 把上下文里有价值的内容和可以总结成经验的地方更新到文档里/

---

## Refined Task Description

### Goal
创建一个 **Skill**（`knowledge-crystallizer`）和一个 **Command**（`/crystallize-knowledge`），使 Agent 能够从任务执行上下文中自动提取有价值的知识（API 变更、陷阱、环境配置、模式发现），并按照 AGENTS.md 既有的 Self-Evolution 机制更新文档（`AGENTS.md` 和 `docs/progress/README.md`）。

### Background
项目已有一套 Self-Evolution（L1 — Living File）机制，定义在 `AGENTS.md` 中：

- **`已实现清单`** — 按任务记录完成内容（日期 + 内容 + 任务名称）
- **`模式 & 发现记录`** — 记录设计模式、规范约定等
- **`知识迁移记录`** — 记录代码模式、Flutter 陷阱、API 变更、环境配置等（含类别分类）

现有命令 `do-task.md` 的 Step 7 已要求 Agent 在任务完成后手动更新这些记录。但存在两个问题：
1. **Agent 经常遗忘** — 没有自动化触发机制
2. **格式不一致** — 手动更新时可能遗漏字段、类别名不统一

本任务的目标是创建专用的 skill 和 command，将知识提取和文档更新**标准化、可调用、可检查**。

### Breakdown

- [ ] **Step 1: 创建 Skill 文件 `knowledge-crystallizer`**
  - 文件位置：项目级 skill（`.opencode/` 下或通过 `skill` 工具注册）
  - Skill 应定义：
    - **知识分类体系**：环境配置 / API 变更 / 库版本陷阱 / Flutter 陷阱 / Dart FFI / Rust 交叉编译 / Android 打包 / 测试技巧 / 路由 / Sliver / 设计模式 / 其他
    - **提取规则**：从上下文（对话历史、错误日志、修复记录）中识别出新知识的标准（例如：首次遇到的 API 变更、修复 bug 时发现的底层原因、与文档不一致的行为）
    - **去重规则**：检查是否已存在于 AGENTS.md 的知识迁移记录中，避免重复
    - **更新目标**：AGENTS.md（三项表格）+ `docs/progress/README.md`（模块完成状态）
    - **格式规范**：日期（YYYY-MM-DD）+ 类别 + 内容（简洁可复现的描述，含代码片段和命令）

- [ ] **Step 2: 创建 Command 文件 `crystallize-knowledge.md`**
  - 文件位置：`.opencode/commands/crystallize-knowledge.md`
  - 遵循现有 command 格式（参照 `do-task.md` 和 `refine-task.md`）：
    - YAML front matter（`description`）
    - 分步执行流程（Step 1 → Step N）
    - 中文输出说明
  - Command 流程应包含：
    1. **阅读现有记录**：读取 AGENTS.md 的知识迁移记录表，构建已有知识索引
    2. **扫描上下文**：读取最近的任务/对话历史，提取潜在的新知识条目
    3. **分类 + 去重**：按 skill 定义的分类体系归类，过滤已有条目
    4. **生成提议**：以表格形式展示建议新增的条目，标注类别和来源
    5. **用户确认（MUST）**：展示建议更新，等待用户确认后再写入（知识沉淀不应静默修改文档）
    6. **执行更新**：用户确认后，更新 AGENTS.md 对应表格 + `docs/progress/README.md`（如涉及）

- [ ] **Step 3: 与 `do-task.md` 集成**
  - 修改 `do-task.md` Step 7（Update Self-Evolution records）：
    - 将手动更新指令替换为：运行 `skill(name="knowledge-crystallizer")` 加载 skill，然后检查是否有新知识需要记录
    - 或直接调用 `/crystallize-knowledge` 命令
  - 确保 do-task 完成后 Agent 不会遗漏文档更新

- [ ] **Step 4: 验证**
  - 在 AGENTS.md 的知识迁移记录表中新增一条测试条目（类别："文档规范"），验证 skill + command 能正确读写
  - 确保新增条目后表格格式正确（Markdown 表格对齐）

### Files / Modules Involved

| 文件 | 操作 | 说明 |
|---|---|---|
| `.opencode/commands/crystallize-knowledge.md` | **创建** | 新 command 文件 |
| `.opencode/skills/knowledge-crystallizer.md`（或通过 skill 工具注册） | **创建** | 新 skill 定义 |
| `AGENTS.md` | **修改** | `do-task.md` Step 7 引用新 command；验证知识表格格式 |
| `.opencode/commands/do-task.md` | **修改** | Step 7 集成新 skill/command |
| `docs/tasks/task7.md` | **修改** | 本文件（本次 refine 操作） |

### Notes

- **Skill vs Command 的职责边界**：
  - **Skill** = 知识（分类体系、提取规则、去重逻辑、格式规范）— 告诉 Agent **怎么识别有价值的内容**
  - **Command** = 流程（读取 → 扫描 → 去重 → 提议 → 确认 → 写入）— 告诉 Agent **按什么步骤执行**
- **用户确认是必需的**：知识沉淀到文档应该是经过人工审核的，不能静默写入
- **现有类别体系**：已从 AGENTS.md 当前条目中提取了 12 个类别，skill 应将其作为基础分类，同时允许扩展
- **AGENTS.md 的 Common Pitfalls (#11-14)** 也是知识迁移记录的来源——当某条知识被多次触发或影响重大时，应考虑升级为 Common Pitfalls
- 参考 opencode 的 skill 系统：skill 需要通过 `.opencode/` 配置或 `skill` 工具注册

### Open Questions

1. **Skill 定义方式**：项目使用 `@opencode-ai/plugin` 1.15.10，skill 应该在 `.opencode/skills/` 下创建 `.md` 文件，还是通过 `.opencode/opencode.json` 配置？需要确认 opencode plugin 对 project-level skill 的支持方式。
2. **Command 触发时机**：除了手动调用 `/crystallize-knowledge` 和 do-task 完成时自动调用，是否还应该在 Agent 发现 bug 根因后立即记录？（当前 bug1 的 Flutter 陷阱和 Android 打包条目就是事后补的）