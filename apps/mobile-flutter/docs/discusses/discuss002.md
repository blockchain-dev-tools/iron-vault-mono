# Discuss 002: UI 层公共组件抽象

> 日期: 2026-06-21
> 状态: ✅ 已实施

## 问题

之前我们按水平分层重构了整个 app（ADR-001: core/data/services/infrastructure/ui），但 UI 层 `lib/ui/screens/` 下 14 个 screen 各自为政，大量重复代码分布在多个文件中。是否可以把重复的模式抽成公共组件？

## 分析

遍历全部 14 个 screen 文件后，识别出以下重复模式：

### ① PIN 数字键盘（3 处 copy-paste）

- SetPinScreen (L397-465): 72px, spacing 12, key `pin-btn-*`
- UnlockScreen (L266-335): 72px, spacing 12, key `unlock-btn-*`
- BackupSeedScreen (L399-462): 68px, spacing 10, 无 key 前缀

→ 抽象为 `PinNumberPad`（统一参数化）

### ② PIN 圆点指示器（3 处逐字相同）

`_buildPinDots` 在三个 screen 中一字不差：Row of 6 circles (16×16, margin 6)。

→ 抽象为 `PinDotIndicator`

### ③ 抖动动画（3 处完全相同）

`TweenAnimationBuilder` + `Transform.translate` 配置一模一样（Tween 8→0, 300ms, elasticOut）。

→ 抽象为 `PinShakeWrapper`

### ④ 安全警告横幅（4 处高度相似）

GenerateMnemonic / EnigmaMnemonic / BackupSeed 都有 `error.withAlpha(18)` bg + warning icon + 文案的红色警告条。

→ 抽象为 `WarningBanner`

### ⑤ 助记词网格（3 处高度相似）

3×4（12 词）和 4×6（24 词）的 GridView.builder，cell 样式完全相同。

→ 抽象为 `MnemonicWordGrid`

### ⑥ 底部主按钮样式不统一（6 处）

6 个 screen 各自实现：ElevatedButton、GestureDetector+Container，尺寸/颜色逻辑不一致。

→ 抽象为 `PrimaryButton`（统一 enabled/disabled/loading/outline 状态）

### ⑦ 复制按钮（3 处）

Copy+SnackBar 逻辑分散在 VaultScreen / AccountDetailScreen / BackupSeedScreen。

→ 抽象为 `CopyButton`

### ⑧ 分组标题（1 处，可作为公共组件）

SettingsScreen 的 `_sectionHeader` 是 private method，可复用。

→ 抽象为 `SectionHeader`

## 决策：组件提取优先级

| 优先级 | 组件 | 理由 |
|---|---|---|
| **P0** | PinNumberPad, PinDotIndicator, PinShakeWrapper | 3 处完全 copy-paste |
| **P1** | WarningBanner, MnemonicWordGrid, PrimaryButton, SectionHeader, CopyButton | 2-4 处高度相似，差异可参数化 |
| **P2 (暂不抽)** | PassphraseInput, InfoCard, ProgressDots | 使用场景少且差异较大 |

### 明确不抽的

- `_EntryCard`（WelcomeScreen）: 单屏私有，无复用
- `_settingsTile`（SettingsScreen）: 已很好封装
- `_buildChainSection`（VaultScreen）: 业务特定
- Lockout view: 各屏逻辑差异大

## 实施

### 目录结构

```
lib/ui/widgets/
├── pin/
│   ├── pin_number_pad.dart       (148 行)
│   ├── pin_dot_indicator.dart    (65 行)
│   └── pin_shake_wrapper.dart    (46 行)
├── mnemonic/
│   ├── warning_banner.dart       (76 行)
│   └── mnemonic_word_grid.dart   (84 行)
└── common/
    ├── primary_button.dart       (114 行)
    ├── section_header.dart       (51 行)
    └── copy_button.dart          (78 行)
```

### 重构的 Screen

| Screen | 使用的新组件 |
|---|---|
| SetPinScreen | PinNumberPad + PinDotIndicator + PinShakeWrapper |
| UnlockScreen | PinNumberPad + PinDotIndicator + PinShakeWrapper |
| BackupSeedScreen | PinNumberPad + PinDotIndicator + PinShakeWrapper + WarningBanner + MnemonicWordGrid |
| GenerateMnemonicScreen | WarningBanner + MnemonicWordGrid + PrimaryButton |
| EnigmaMnemonicScreen | WarningBanner + MnemonicWordGrid + PrimaryButton |
| ImportMnemonicScreen | PrimaryButton |
| EnigmaScreen | PrimaryButton |
| AccountDetailScreen | CopyButton + PrimaryButton |
| TransactionScreen | PrimaryButton (outline 模式用于 Reject) |
| SettingsScreen | SectionHeader |

### 验证

| 指标 | 结果 |
|---|---|
| `flutter analyze lib/ui/` | 1 info（pre-existing），零新问题 |
| `flutter test` | 205/207（与重构前相同基线） |
| 净删除重复代码 | ~500 行 |

## 进化信号

| 日期 | 类别 | 内容 |
|---|---|---|
| 2026-06-21 | UI 组件 | 14 个 screen 中抽出 8 个公共 widget，分层 `pin/`（PIN 交互）、`mnemonic/`（助记词展示）、`common/`（通用 UI）。屏幕重构原则：仅替换 copy-paste 级别的重复，每屏差异化逻辑保留在原屏。 |
| 2026-06-21 | 按钮统一 | 原 6 个 screen 各自实现底部按钮（ElevatedButton / GestureDetector+Container），现统一为 `PrimaryButton` 支持 4 种状态：enabled、disabled、loading（spinner）、outline（次要/破坏性操作）。 |
