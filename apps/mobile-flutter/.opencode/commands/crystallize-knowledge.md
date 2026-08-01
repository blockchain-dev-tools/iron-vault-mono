---
description: Extract valuable learnings from session context and update AGENTS.md Self-Evolution records
---

# Crystallize Knowledge

User invoked `/crystallize-knowledge`. Review the current session context (task execution, bug fixes, discoveries) and update AGENTS.md Self-Evolution records with any new learnings.

## Steps

### 1. Load skill

Load the `knowledge-crystallizer` skill to understand the classification system, extraction rules, dedup logic, and format specifications:

```
skill(name="knowledge-crystallizer")
```

All subsequent steps must follow the rules defined in that skill.

### 2. Read existing knowledge base

Read `AGENTS.md` from project root. Extract:

- All rows from **知识迁移记录** table (lines ~276-302) — build an in-memory index of existing entries by category + content summary
- All rows from **模式 & 发现记录** table (lines ~263-275)
- All rows from **已实现清单** table (lines ~249-262)
- All **Common Pitfalls** (#1-14, lines ~192-220) — these are already promoted items

This index is your dedup reference. **Do not record anything already present.**

### 3. Scan session context

Review the current session's conversation history for learnings:

- **Bug fixes**: What was the root cause? Was it a framework/library quirk?
- **API discoveries**: Did any library behave differently than expected or documented?
- **Build/environment issues**: Any toolchain, mirror, or config surprises?
- **Patterns established**: Any new conventions or file structures created?
- **Test failures**: Any non-obvious test behavior or workarounds?

For each potential finding, note:
- The category (from the skill's classification system)
- A draft of the content (Chinese prose + English code, concise but reproducible)
- The source (which task/conversation/fix triggered it)

### 4. Classify and deduplicate

For each candidate finding:

1. Assign the most specific category from the classification system
2. Check against the index from Step 2 — is it already recorded?
3. If exact match → discard
4. If superset/update of existing → flag as "replacement candidate"
5. If new → add to proposal list
6. If this is the 2nd+ time a similar finding appears → flag as "promotion candidate" for Common Pitfalls

### 5. Propose updates to user

Present a structured proposal in Chinese. Format:

```
## 建议新增的知识条目

### 知识迁移记录
| 日期 | 类别 | 内容 |
|---|---|---|
| YYYY-MM-DD | 类别A | 描述... |
| YYYY-MM-DD | 类别B | 描述... |

### 模式 & 发现记录（如有）
| 日期 | 类别 | 内容 |
|---|---|---|

### 候选升级为 Common Pitfalls（如有）
- 条目X：已在知识迁移记录中出现 N 次，建议升级

---
是否将这些条目写入 AGENTS.md？(yes/no/modify)
```

**MUST wait for user confirmation before proceeding to Step 6.** Do not write anything until the user explicitly approves.

### 6. Execute updates

After user confirms, update `AGENTS.md`:

- **知识迁移记录**: Append new rows to the table
- **模式 & 发现记录**: Append new rows if any
- **已实现清单**: Add a row if a task/module was completed in this session
- **Common Pitfalls**: If user approved promotion, add a new numbered item

Keep the existing table format exactly — align columns, preserve the Markdown structure.

### 7. Update progress dashboard (if applicable)

If any module's completion status changed (new tests passing, new module built, build status changed), update `docs/progress/README.md`:

- Update the "最后更新" timestamp
- Update module rows in the progress tables
- Update test counts if changed
- Update "总体健康" indicators

If no module status changed, skip this step.

## Notes

- This command is for **knowledge extraction after task completion**. It should be invoked at the end of `/do-task` or when the user explicitly wants to capture learnings.
- User confirmation is **mandatory** before writing — knowledge records are permanent and should be human-reviewed.
- The `knowledge-crystallizer` skill provides the detailed rules — always load it first.
- Follow AGENTS.md 文档语言约定: Chinese prose for descriptions, English for code/paths/commands.
