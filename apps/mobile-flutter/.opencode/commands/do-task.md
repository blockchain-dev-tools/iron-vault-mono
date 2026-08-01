---
description: Read task spec from docs/tasks/<name>.md and execute it step by step using the project's agent framework
---

# Do Task

User invoked `/do-task $ARGUMENTS`. Execute the task described in `docs/tasks/$ARGUMENTS.md`.

## Steps

### 1. Read task file

Read `docs/tasks/$ARGUMENTS.md` from project root. If not found, notify user and list available task files in `docs/tasks/`.

### 2. Parse task spec

Analyze the task file. Locate the **Refined Task Description** section (after the first `---` separator). Extract:

- **Goal** — what needs to be accomplished
- **Background** — relevant context and constraints
- **Breakdown** — the step-by-step checklist (the primary execution plan)
- **Files / Modules Involved** — all files that will be read, modified, or created
- **Notes** — important constraints and design decisions
- **Open Questions** — items that may require user clarification before starting

If there is no "Refined Task Description" section, use the raw content above the first `---` as the task spec.

### 2.5. Think Before Coding (Karpathy #1 — Surface Assumptions)

Before proceeding, verbalize understanding and surface ambiguity:

- **State assumptions explicitly** — what are you assuming about the codebase, libraries, or user intent? If uncertain, ask.
- **Present alternatives** — if multiple interpretations exist (similar effort), note your choice and why. If 2x+ effort difference, **must ask**.
- **If unclear, STOP** — name what's confusing. Ask the user. Do not silently guess.
- **Push back on overcomplication** — if a simpler approach exists, say so before implementing.
- **Briefly restate plan** — "I detect [research/implementation/investigation] intent. My approach: [plan]." This lets the user correct course early.

### 3. Read AGENTS.md

Read `AGENTS.md` to understand:
- Project architecture (directory layout, layer map)
- Screen flow and navigation rules
- Theme system (ColorTokens, R constants)
- File naming conventions and code style
- Common pitfalls (important!)
- Self-Evolution mechanisms (must update after completion)

### 4. Assess current project state

Before starting execution, check the current state of the project:
- Does the project have Flutter SDK installed? (`which flutter`)
- Does the project already have code? (check `lib/`, `pubspec.yaml`, etc.)
- Which files from "Files / Modules Involved" already exist? Which need to be created?
- Are there any pre-existing issues or blockers?

### 5. Execute breakdown steps

For each step in the **Breakdown** list (the `- [ ]` items under the "Breakdown" heading):

1. **Create a todo item** using `todowrite` — mark it `in_progress` before starting, mark `completed` when done.
2. **For each step, determine execution approach:**
   - If it involves code changes — decompose into sub-steps and delegate to appropriate sub-agents (`task(category=..., load_skills=[...], ...)`)
   - If it's checking/verification — use direct tools (bash, lsp_diagnostics, etc.)
   - If it's research/documentation — spawn `explore`/`librarian`/`writing` agents
3. **Follow the project's patterns** — match existing code style, naming conventions, and architecture from AGENTS.md.
4. **After each step**, run `lsp_diagnostics` on changed files to verify no errors introduced.

#### Behavioral Rules (Karpathy Guidelines)

Apply these throughout every implementation step:

**Simplicity First (#2):**
- No features beyond what was asked. No abstractions for single-use code.
- No speculative "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Surgical Changes (#3):**
- Touch only what you must. Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Clean up only your own orphans: remove imports/variables/functions that YOUR changes made unused.
- **The test:** every changed line should trace directly to the task's request.

**Goal-Driven Execution (#4):**
- For each breakdown step, define success criteria upfront: what does "done" look like?
- Format: `[Step] → verify: [check]`
- Strong criteria → loop independently. Weak criteria ("make it work") → STOP and clarify.
- Loop until criteria passes. Do not declare success without verification.

### 6. Handle user interaction

- If any **Open Questions** remain unanswered and block progress → ask the user for clarification (one question at a time, max 2 per message).
- If a step fails → retry once with a different approach, then report to user.
- If a step is already done (e.g., file already exists) → skip and note it.

### 7. Update Self-Evolution records

After completing all steps, crystallize learnings into documentation:

1. Load the `knowledge-crystallizer` skill: `skill(name="knowledge-crystallizer")`
2. Review the session context for new learnings (API discoveries, bug root causes, config surprises, patterns established)
3. Follow the skill's classification system, dedup rules, and format specification to identify what's worth recording
4. If new learnings are found, invoke `/crystallize-knowledge` to propose updates to the user and write to `AGENTS.md`:
   - **已实现清单** — add a new row with today's date, what was completed, and the task name
   - **模式 & 发现记录** — if any new patterns or conventions were discovered, add a row
   - **知识迁移记录** — if any code patterns, Flutter pitfalls, or review corrections were encountered, record them
5. If no new learnings, at minimum update the **已实现清单** with the completed task

### 8. Summary

When all steps are complete, output a brief summary in Chinese:

- What was done (bullet points)
- What files were created/modified
- Any issues encountered and how they were resolved
- Suggested next steps (referencing the original task file's "下一步建议" if present)

## Notes

- This command is meant to be the primary entry point for executing documented tasks. It treats the task file as the single source of truth.
- Tasks are expected to be in `docs/tasks/` and follow the refined format (Goal / Background / Breakdown / Files / Notes / Open Questions).
- Always parallelize independent work using background agents.
- Never skip steps from the Breakdown. If a step seems unnecessary, note why and ask the user before skipping.
- Follow AGENTS.md "Common Pitfalls" — especially PIN storage, navigation stack, startup flash prevention, and timing-safe PIN comparison.
- Step 7 invokes `/crystallize-knowledge` for knowledge extraction. The `knowledge-crystallizer` skill must be loaded first to understand the classification system and format rules.
- **Karpathy tradeoff:** These guidelines bias toward caution over speed. For trivial tasks (single file typo, obvious config change), use judgment and skip the heavyweight process.
