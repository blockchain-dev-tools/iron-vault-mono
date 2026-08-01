状态：已修复

## 症状

谜语模式（Enigma）每次生成的地址不一样 — 相同 riddle + secret 产生不同的钱包地址，导致 Enigma 钱包无法通过重新输入相同的谜语和密钥来恢复。

## 诊断

Enigma 钱包地址非确定性有**历史根因**（已在 Task11 修复）和**当前防护缺失**两个层面：

### 历史根因（已修复 — Task11 / commit `0b5e865`）

`WalletService._mnemonicToSeedHex` 的旧实现将**随机 PIN salt** 纳入了 seed derivation 输入（`mnemonic|passphrase|salt`）。每次 `setupWallet()` 调用生成新的随机 salt，导致相同助记词产生不同 seed → 不同地址。

旧代码：
```dart
static String _mnemonicToSeedHex(String mnemonic, String passphrase, String salt) {
  final input = utf8.encode('$mnemonic|$passphrase|$salt');
  // custom Murmur-style hash → non-standard seed
}
```

新代码（Task11 后）：
```dart
static String _mnemonicToSeedHex(String mnemonic, String passphrase) {
  final result = CryptoBridge.mnemonicToSeed(mnemonic, passphrase: passphrase);
  // Standard BIP-39 PBKDF2-HMAC-SHA512 — deterministic for same (mnemonic, passphrase)
}
```

### 当前防护缺失

虽然 seed derivation 本身已是确定性的，但**缺乏单元测试**来证明和守卫这一确定性。主要风险点：
- 如果有人意外修改 FNV-1a 哈希或 Rust PBKDF2 逻辑，没有测试会捕获
- Enigma mnemonic generation 逻辑内嵌在 UI 组件 (`EnigmaScreen._generateDeterministicMnemonic`) 中，无法独立测试

## 修复

### 1. 提取 Enigma mnemonic generation 为独立工具函数

**新建** `lib/utils/enigma.dart` — 将 FNV-1a → 24 word 的逻辑提取为公共函数 `generateEnigmaMnemonic(riddle, secret, {language})`。从 `EnigmaScreen` 移除内嵌的方法，改为调用此工具函数。

### 2. 添加 Dart 单元测试（11 个测试）

**新建** `test/utils/enigma_test.dart` — 全面覆盖确定性保证：

| 测试 | 验证点 |
|---|---|
| same riddle+secret+language | 相同输入 → 相同 24 词 |
| different riddle | 不同 riddle → 不同助记词 |
| different secret | 不同 secret → 不同助记词 |
| 10 calls determinism | 连续 10 次调用全部一致 |
| produces exactly 24 words | 输出长度 = 24 |
| BIP-39 wordlist membership | 每个词均在 BIP-39 词表中 |
| empty inputs | 空字符边界情况处理 |
| special characters | 特殊字符输入确定性 |
| Unicode (Chinese) | 中文输入 + 中文词表确定性 |
| different languages | English vs 简体中文产生不同词 |
| regression guard | 已知输入快照测试 |

### 3. 添加 Rust 单元测试（8 个测试）

**修改** `rust/src/mnemonic.rs` — 新增 seed derivation 确定性和边界情况测试：

| 测试 | 验证点 |
|---|---|
| same mnemonic + same passphrase | 相同输入 → 相同 seed |
| with passphrase | 带 passphrase 确定性 |
| seed not zero | seed 非全零 |
| Enigma style (no checksum) | 无 checksum Enigma 助记词 → 确定 seed |
| 10 calls determinism | 连续调用一致性 |
| 24-word Enigma | 24 词 Enigma 助记词产生 seed |
| different passphrases → different seeds | passphrase 影响 seed |
| whitespace normalization | 多余空格不影响 seed |

## 涉及文件

| 文件 | 变更 |
|---|---|
| `lib/utils/enigma.dart` | **新建** — Enigma mnemonic generation 公共工具函数 |
| `lib/screens/enigma_screen.dart` | **修改** — 移除内嵌方法，改用 `generateEnigmaMnemonic` |
| `test/utils/enigma_test.dart` | **新建** — 11 个确定性相关单元测试 |
| `rust/src/mnemonic.rs` | **修改** — 新增 8 个 seed derivation 确定性测试 |

## 验证

- `cargo test`: **62/62 通过**（含 8 个新增测试）
- `flutter test test/utils/enigma_test.dart`: **11/11 通过**
- `flutter analyze`: 零新增问题
- Enigma 流程回归测试：相同 riddle + secret → 相同助记词（通过单元测试保证）
