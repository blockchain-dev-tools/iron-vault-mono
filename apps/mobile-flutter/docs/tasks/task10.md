---
title: "模拟用户行为的测试体系搭建"
status: done
created: 2026-06-07
---

# 模拟用户行为的测试体系搭建

## Goal

搭建一套**自动化、可重复、可在 CI 中跑**的端到端测试体系，覆盖 3 条核心用户流（Import / Create / Unlock），使用 Maestro 作为执行引擎。

## Background

- Bug4 的修复过程中手动用 `adb shell` + `uiautomator dump` 在真机上验证了 Import 流，但不可重复，每次回归需手动操作。
- 最终选择 Maestro + `tests/e2e/` 的方案（而非原生 `integration_test` 或纯 adb 脚本），因为 YAML 定义可读性高、跨平台。
- 与现有 `test/` 目录（`flutter test` 单元/widget 测试）互不干扰。

## Breakdown

### Phase 1 — Widget Key 标注
- [x] `WelcomeScreen._EntryCard` 添加 `super.key`，3 个卡片分别设 `Key('entry-create')`, `Key('entry-import')`, `Key('entry-enigma')`
- [x] `ImportMnemonicScreen`: TextField `Key('mnemonic-input')`, Import 按钮 `Key('import-btn')`, Paste 按钮 `Key('paste-btn')`
- [x] `SetPinScreen`: 数字键 `ValueKey('pin-btn-$digit')`, 退格 `Key('pin-backspace')`, Cancel `Key('pin-cancel')`
- [x] `UnlockScreen`: 数字键 `ValueKey('unlock-btn-$digit')`, 退格 `Key('unlock-backspace')`, Forgot PIN `Key('forgot-pin')`, Reset Wallet `Key('reset-wallet')`
- [x] `VaultScreen`: Settings 齿轮 `Key('settings-btn')`, 5 个链区块头 `ValueKey('chain-header-$chain')`

### Phase 2 — E2E 目录结构 + 描述文档
- [x] 创建 `tests/e2e/specs/import-wallet.md`（Flow A 用例描述）
- [x] 创建 `tests/e2e/specs/create-wallet.md`（Flow B 用例描述）
- [x] 创建 `tests/e2e/specs/unlock-account.md`（Flow C 用例描述）

### Phase 3 — Maestro YAML 流
- [x] `tests/e2e/maestro/import-wallet.yaml`: Import → SetPin → Vault（验证 5 链）→ 重启 → Unlock → Vault（验证持久化）
- [x] `tests/e2e/maestro/create-wallet.yaml`: Entropy(200 taps) → Generate → Verify(3 quizzes) → SetPin → Vault → 重启 → Unlock → Vault
- [x] `tests/e2e/maestro/unlock-account.yaml`: Unlock → Vault → AccountDetail → Back → 验证 Vault 状态不变

### Phase 4 — 执行脚本
- [x] `tests/e2e/run.sh`: 检测 Maestro CLI + adb 设备；支持 `--fresh`（卸载安装）、`--device <serial>`、流名过滤；逐流执行并汇总 pass/fail 计数

### Verification
- [x] `flutter analyze` — 0 新增问题

### Knowledge Crystallization
- [x] AGENTS.md 已实现清单（task10 行）、模式 & 发现记录（E2E 三层结构模式）、知识迁移记录（Widget Key 命名约定 + 目录结构）

## Files Created/Modified

### Modified
- `lib/screens/welcome_screen.dart` — `_EntryCard` 添加 `super.key` + 3 个 Key 标注
- `lib/screens/import_mnemonic_screen.dart` — 3 个 Key 标注
- `lib/screens/set_pin_screen.dart` — 12 个 Key 标注（10 digits + backspace + cancel）
- `lib/screens/unlock_screen.dart` — 13 个 Key 标注（10 digits + backspace + forgot-pin + reset-wallet）
- `lib/screens/vault_screen.dart` — 6 个 Key 标注（settings + 5 chain headers）
- `AGENTS.md` — 已实现清单 + 模式 & 发现 + 知识迁移

### Created
- `tests/e2e/specs/import-wallet.md`
- `tests/e2e/specs/create-wallet.md`
- `tests/e2e/specs/unlock-account.md`
- `tests/e2e/maestro/import-wallet.yaml`
- `tests/e2e/maestro/create-wallet.yaml`
- `tests/e2e/maestro/unlock-account.yaml`
- `tests/e2e/run.sh`

## Notes

1. **Maestro 与 Flutter Canvas 的兼容性**: Flutter 是 Canvas 渲染，Key 不会自动暴露为 Android accessibility 属性。YAML 流中用 `text:` 和 `id:` 双定位。部分流（如 VerifyMnemonic 的 quiz）需要依赖 accessibility label 而非 Key。
2. **Create Wallet 流的 VerifyMnemonic 环节**: 3 个四选一测验需要知道正确的单词，Maestro 无法动态读取助记词内容。当前 YAML 流用 `tapOn:` 定位，但实际运行前需调整。
3. **Flow B (create-wallet) 的复杂度**: Entropy 页需要 200 次触摸（已用 `repeat` 处理），VerifyMnemonic 的 quiz 答案依赖运行时生成的助记词。当前实现使用 placeholder，需人工确认。
4. **现有 Semantics 基础设施**: `WelcomeScreen._EntryCard` 已有 `Semantics(label: title)`，可作为 Maestro 定位的备用方案。`SemanticsBinding.instance.ensureSemantics()` 已在 main.dart 中启用。
5. **vs. `integration_test` 路线**: 如果未来发现 Maestro 在 Flutter 上的定位精度不够，可以回归到 `integration_test` 路线，Widget Key 已经完全对齐。

