---
title: "完善 do-task 命令 — 融入 Karpathy Guidelines"
status: done
created: 2026-05-23
---

# 完善 do-task 命令

参考 karpathy-guidelines skill，将四条行为准则融入 `/do-task` 命令的执行流程。

---

## Refined Task Description

### Goal

以 Karpathy Guidelines（Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution）为蓝本，完善 `.opencode/commands/do-task.md` 文件，使 `do-task` 命令在执行时遵循这些行为准则。

### Background

- Karpathy Guidelines 包含四条准则：Think Before Coding（声明假设 / 呈现替代 / 识别模糊）、Simplicity First（最小代码 / 不超范围）、Surgical Changes（只动必须 / 不改善相邻）、Goal-Driven Execution（可验证标准 / 循环验证）
- `/do-task` 命令定义在 `.opencode/commands/do-task.md`，是项目自定义的 Auto Slash Command
- 当前命令已包含 Read → Parse → AGENTS.md → Assess → Execute → Handle → Update → Summary 的完整流程，但缺少行为约束

### Breakdown

- [x] Add Step 2.5 "Think Before Coding" — 要求在执行前声明假设、呈现替代方案、识别模糊点、推回过度复杂化
- [x] Add Simplicity First behavioral rules to Step 5 — 不做超范围功能、不做单次抽象、不做未要求的灵活性，Senior Engineer 检验
- [x] Add Surgical Changes behavioral rules to Step 5 — 只动必须改的、不改善相邻代码注释格式、不重构未损坏的、匹配现有风格、清理自己的孤儿
- [x] Add Goal-Driven Execution behavioral rules to Step 5 — 每个步骤定义可验证的成功标准，格式化为 "[Step] → verify: [check]"
- [x] Add Karpathy tradeoff note to Notes section — 偏向谨慎而非速度，trivial 任务可跳过

### Files / Modules Involved

- `.opencode/commands/do-task.md` (modified — 融入 Karpathy Guidelines)

### Notes

- 原有 karpathy-guidelines skill 内容保留在 task3.md 下方作为参考
- 所有改进保持与原有 do-task.md 风格一致
- Behavioral Rules 作为 Step 5 的子章节，不破坏原有执行流程

### Open Questions

- (无)

---

## 原始任务描述

参考下面这个skill，完善do-task的命令

---
name: karpathy-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.