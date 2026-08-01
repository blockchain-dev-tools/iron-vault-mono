# Bug #2: Enigma Mnemonic 页网格溢出

> 报告日期：2026-06-02 | 状态：已修复

---

## 症状

Enigma Mnemonic 页面展示助记词的地方出现很多 overflowed 错误：
- "overflowed by 23 pixel"（垂直方向）
- "overflowed by 168 pixel"（水平方向）

## 诊断

**表面现象**: 4 列网格中的单元格显示 RenderFlex overflow 错误。每个单元格内使用了 `Column` 布局（序号 + 间距 + 助记词），在窄格子中垂直和水平方向均溢出。

**根因**：三个因素叠加导致：

1. **垂直溢出**：`childAspectRatio: 2.8` 使每个单元格极高宽比（宽是高的 2.8 倍）。在 4 列布局中单元格高度极小（约 26dp），而 `padding: vertical: 8` 占据 16dp，内容 `Column`（序号 fontSize 9 ≈ 11dp + SizedBox 2dp + 单词 fontSize 11 ≈ 14dp）需要约 27dp → 垂直溢出 ~17-23dp

2. **水平溢出**：4 列布局中每个单元格宽度约 72dp（360dp 屏幕），减掉 `padding: horizontal: 6` × 2 = 12dp + `border` = 2dp，可用宽度仅约 58dp。BIP-39 最长的单词（如 "consider"、"shoulder"）在 fontSize 11 下约需 60-65dp → 水平溢出 ~10-168dp（取决于单词长度）

3. **布局浪费**：`Column` 嵌套两个 `Text` widget + `SizedBox`，白白消耗垂直空间

## 修复

### 1. 简化单元格布局

将 `Column` + 两个 `Text` 改为单个 `Text('$index. $word')`，消除垂直空间浪费：

```dart
// Before: Column with two Text widgets + SizedBox
child: Column(
  mainAxisAlignment: MainAxisAlignment.center,
  children: [
    Text('${index + 1}', ...),     // 序号
    const SizedBox(height: 2),
    Text(words[index], ...),       // 单词
  ],
),

// After: single Text with FittedBox
child: FittedBox(
  fit: BoxFit.scaleDown,
  child: Text('${index + 1}. ${words[index]}', ...),
),
```

### 2. 调整网格参数

| 参数 | Before | After | 说明 |
|---|---|---|---|
| `childAspectRatio` | 2.8 | 2.0 | 给予更多垂直空间 |
| `crossAxisSpacing` | 8 | 6 | 增加列间距，减少单列宽度压力 |
| `mainAxisSpacing` | 8 | 6 | 行间距也减到匹配 |
| `padding: horizontal` | 6 | 4 | 释放更多水平空间给文字 |
| `padding: vertical` | 8 | 5 | 释放更多垂直空间 |
| `fontSize` | 11 | 12 | 现在是单行文本，可略微提升字号 |
| `FittedBox` | 无 → `BoxFit.scaleDown` | 自适应缩放，极端情况不会溢出 |

### 3. Continue 按钮 try-catch

按钮的 `GestureDetector.onTap` 回调添加 try-catch，防止 `context.go()` 抛出异常被静默吞掉（参照 bug1 的 FFI 异常处理模式）。

---

## 涉及文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `lib/screens/enigma_mnemonic_screen.dart` | 修改 | 网格布局优化 + try-catch 保护 |
| `docs/bugfixes/bug2.md` | 修改 | bug 报告文档 |

---

## 对比：GenerateMnemonic vs EnigmaMnemonic

GenerateMnemonic（3 列 × 4 行）不受影响，因为它只有 3 列（`crossAxisCount: 3`）、单元格更宽、使用单行 `Text`，且 `Padding: horizontal: 10` 下仍有余量。EnigmaMnemonic 的特殊性在于 4 列 × 6 行——网格密度翻倍，每列宽度骤减约 33%。

