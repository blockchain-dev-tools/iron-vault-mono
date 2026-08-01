创建一个fix-bug的command吧，当我输入/fix-bug bug2的时候，它会自动到docs/bugfixes目录下搜索相应的bug来修复。修复前会先确定存疑的问题

---

## Refined Task Description

### Goal
创建 `/fix-bug` OpenCode 命令：读取 `docs/bugfixes/<name>.md` bug 报告，修复前先定位存疑问题，再执行修复流程。

### Background
项目已有 `docs/bugfixes/bug1.md`（已修复）、`bug2.md`（已修复）、`bug3.md`（空占位）。需要一条命令来自动化 bug 修复流程，整合 Karpathy Think Before Coding 原则。

### Breakdown
- [x] 创建 `.opencode/commands/fix-bug.md`
- [x] AGENTS.md 已实现清单更新

### Files / Modules Involved
- `.opencode/commands/fix-bug.md` — 新建命令文件

### Notes
- 命令遵循既有 `.opencode/commands/` 格式：YAML front matter + step-based 结构 + `$ARGUMENTS` 变量
- 修复前必须强制确定存疑问题（用户明确要求）
- 整合 Karpathy Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution 行为准则

### Open Questions
- 无

---

## 完成结果

### 完成内容
- **创建 `.opencode/commands/fix-bug.md`** — 137 行命令定义文件

### 命令工作流
```
`/fix-bug bug2`
  → 读取 docs/bugfixes/bug2.md
  → 解析症状/诊断/修复/涉及文件
  → 确定存疑问题（Karpathy Think Before Coding）
  → 读取 AGENTS.md 项目上下文
  → 评估文件状态 + 诊断基线
  → 逐条执行修复（delegate 或 direct edit）
  → lsp_diagnostics 验证
  → 更新 bug 报告状态（待修复→已修复）
  → 知识结晶 → AGENTS.md 更新
```

### 关键设计决策
1. **存疑问题前置**（用户明确要求）— Step 2 强制在修改前分析模糊点，不清晰的 STOP 提问
2. **已修复检测** — 状态为 `已修复` 时先询问用户是否重新应用修复
3. **空文件保护** — bug3.md 为空时直接 STOP，不尝试修复
4. **Karpathy 三原则** — Simplicity First / Surgical Changes / Goal-Driven Execution 融入 Step 5

### 文件变更
- `.opencode/commands/fix-bug.md` — **新建**
- `AGENTS.md` — **已实现清单**新增 task8 条目