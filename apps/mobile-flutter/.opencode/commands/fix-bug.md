---
description: Read bug report from docs/bugfixes/<name>.md, surface open questions, then execute the fix
---

# Fix Bug

User invoked `/fix-bug $ARGUMENTS`. Fix the bug described in `docs/bugfixes/$ARGUMENTS.md`.

## Steps

### 1. Read bug report

Read `docs/bugfixes/$ARGUMENTS.md` from project root.

- If file does NOT exist → notify user and list all `.md` files found in `docs/bugfixes/`:
  ```
  Bug report "$ARGUMENTS" not found. Available: bug1, bug2, bug3
  ```
  Then STOP.
- If file is empty (0 lines) → notify user: "Bug report $ARGUMENTS is empty. Nothing to fix."
  Then STOP.

### 2. Parse and surface assumptions (Think Before Coding)

Analyze the bug report. Extract:

| Field | From section |
|---|---|
| **Symptoms** | `## 症状` |
| **Root Cause** | `## 诊断` |
| **Fix Plan** | `## 修复` (list of changes) |
| **Files Involved** | `## 涉及文件` |
| **Status** | `状态：` line in header |

**Before implementing, identify questionable / ambiguous points:**

- Does the fix plan have clear, concrete steps? Or are some steps vague?
- Are all file paths in "涉及文件" accurate and existing in the project?
- Has the bug already been fixed? (status line says `已修复`) → If so, ask user:
  ```
  This bug is marked as "已修复". Re-apply the fix? (yes/no)
  ```
- Does the fix plan reference code that may have changed since the bug doc was written?

**Verbalize understanding:**
```
[BUG] $ARGUMENTS: [1-sentence symptom summary]
[ROOT CAUSE] [1-sentence root cause]
[FIX PLAN] [N changes across N files]
```

If anything is unclear — STOP and ask the user. Do not silently guess.

### 3. Read project context

Read `AGENTS.md` to understand:
- Project architecture (directory layout, layer map)
- Theme system (ColorTokens, R constants)
- Navigation rules
- Common pitfalls (CRITICAL — especially FFI GestureDetector trap, PIN storage, navigation stack)
- Existing patterns and conventions

### 4. Assess current state

Before making changes:

1. **Check Flutter SDK**: `which flutter`
2. **Check all involved files** from the bug report's "涉及文件" section — do they exist?
   - For each file that doesn't exist → notify user and STOP.
   - Read current source content for each existing file.
3. **Check diagnostics baseline**: Run `lsp_diagnostics` on each involved file to know pre-existing issues.
4. **If any file's current code contradicts the bug report's assumptions** → STOP and ask user.

### 5. Execute fix steps

For each fix described in the `## 修复` section:

1. **Create a todo item** using `todowrite` — mark it `in_progress` before starting, mark `completed` when done.
2. **For each fix, determine execution approach:**
   - Simple single-edit fix → use direct `edit` tool
   - Multi-line / complex fix → delegate to `task(category="deep", load_skills=[], prompt="...")`
   - Cross-file fix → spawn parallel agents
3. **Follow the project's patterns** — match existing code style, naming conventions, architecture from AGENTS.md.
4. **Follow Karpathy guidelines:**
   - **Simplicity First**: No features beyond the fix. No speculative abstractions.
   - **Surgical Changes**: Touch only the files listed in "涉及文件". Don't refactor adjacent code.
   - **Goal-Driven**: For each fix step, success criterion = the symptom described in the bug report is resolved.

### 6. Verify

After all edits:

1. **Run `lsp_diagnostics`** on all changed files — must be clean (or only pre-existing issues noted).
2. **If build command exists** (`flutter analyze`, `flutter test`), run it.
3. If verification fails:
   - First attempt: fix the issue directly.
   - Second attempt: consult Oracle (`task(subagent_type="oracle", ...)`) with full failure context.
   - If still failing → STOP and report to user.

### 7. Update bug report status

After successful fix, update the bug report file:
- Change `状态：待修复` → `状态：已修复` (or add the line if missing)
- Add a verification note at the bottom:
  ```markdown
  ## 验证
  - `lsp_diagnostics`: 所有文件零新错误
  - [其他验证步骤]
  ```

### 8. Update Self-Evolution records

After completing the fix, crystallize learnings:

1. Load the `knowledge-crystallizer` skill: `skill(name="knowledge-crystallizer")`
2. Review the session for new learnings (bug root cause, framework quirks, build/toolchain issues)
3. Follow the skill's classification system, dedup rules, and format specification
4. If new learnings are found, invoke `/crystallize-knowledge` to propose updates to the user and write to `AGENTS.md`
5. At minimum, update the **已实现清单** in AGENTS.md with the bug fix entry

### 9. Summary

Output a brief summary in Chinese:
- Which bug was fixed
- What files were modified
- What was the root cause
- What changes were made
- Any issues encountered

## Notes

- The bug report is the single source of truth. If the report is ambiguous → ask user before proceeding.
- "确定存疑的问题" (Step 2) is NOT optional — always surface ambiguous points before editing.
- Follow AGENTS.md "Common Pitfalls" strictly — especially FFI exception handling, navigation stack, PIN storage, and layout overflow prevention.
- This command is designed for **both** new bugs (status: 待修复) and re-applying fixes for already-fixed bugs (status: 已修复). For already-fixed bugs, always confirm with user first.
- If `bug3.md` is empty, treat it as "no bug defined" — do NOT attempt to fix.
- Files in `docs/bugfixes/` follow the format: `bug<N>.md` where N is a positive integer.
