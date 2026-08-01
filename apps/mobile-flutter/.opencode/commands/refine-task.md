---
description: Read task draft from docs/tasks/<name>.md, reorganize structure and supplement content
---

# Refine Task

User invoked `/refine-task $ARGUMENTS`. Refine the task draft in `docs/tasks/$ARGUMENTS.md`.

## Steps

### 1. Read file

Read `docs/tasks/$ARGUMENTS.md` from project root. If not found, notify user and list available task files in `docs/tasks/`.

### 2. Understand intent

Analyze the raw draft:
- What does the user want to do?
- Which modules/layers of the project are involved?
- What's vague or undefined?

### 3. Reference project context

Read `AGENTS.md` to understand project architecture, patterns, and conventions. Ensure refined content aligns with project direction.

### 4. Restructure

Append below the original content, separated by `---`. Output a structured version:

```markdown
---

## Refined Task Description

### Goal
[Clear task objective]

### Background
[Relevant context]

### Breakdown
- [ ] Step 1: ...
- [ ] Step 2: ...
- [ ] Step 3: ...

### Files / Modules Involved
- `path/to/file1.dart`
- `path/to/file2.dart`

### Notes
- [Important notes]

### Open Questions
- [Questions for the user]
```

### 5. Supplement

- Fill in missing details based on project context where confident
- When uncertain, list in "Open Questions" — don't assume
- Keep original content intact, append refined version below
- Output in Chinese

### 6. Confirm

Briefly summarize what was supplemented and adjusted.
