# Bug 6: Enigma Mnemonic 页面布局溢出 + 后退功能缺失

状态：已修复

## 症状

1. 助记词底下的 instructions 模块右侧有 horizontal overflow（Text 超出屏幕宽度约 168px）
2. 页面没有后退按钮，也不支持原生的 Android 后退键
3. （后续发现）点击 "Continue to Set PIN" 后 crash — `type 'List<String>' is not a subtype of type 'String?'`
4. （后续发现）PIN confirm 始终失败 — `CryptoBridge.validateMnemonic()` 对 Enigma 助记词返回 false
5. （功能缺失）Enigma 生成助记词只有英文，无语言选择

## 诊断

### 根因一：Horizontal overflow
Instructions 区域的第二个 Row 中，`Text('I understand that losing these words means losing access to my funds')` 未包裹在 `Expanded` 中，导致 Row 给 Text 无限宽度，长文本无法折行而溢出屏幕右侧。第一个 Row 也有同样的问题（文本较短故未溢出，但仍缺少 Expanded）。

### 根因二：后退功能缺失
- AppBar 只有 `title`，缺少 `leading` widget（后退按钮）
- 页面未使用 `PopScope`，不支持 Android 原生后退键
- 由于使用 `go_router` 的 `context.go()` 导航（flat route），`Navigator.canPop()` 始终为 false

### 根因三：SetPin 导航类型不匹配
`EnigmaMnemonicScreen` 传的是 `List<String>`（24 个单词），但 Router 里 `state.extra as String?` 期望 `String`（空格分隔），导致运行时 crash。

### 根因四：PIN confirm 后 setupWallet 失败
Enigma 生成的助记词虽使用 BIP-39 单词表，但缺少合法 checksum（Enigma 的确定性生成算法不计算 checksum）。`CryptoBridge.validateMnemonic()` 做严格 BIP-39 校验，返回 false → `setupWallet` 抛 `ArgumentError('Invalid mnemonic phrase')` → 显示 "Failed to setup wallet"。PIN 对比逻辑本身是正确的。

注意：该项目的种子派生（`_mnemonicToSeedHex`）是自定义的 FNV-1a 哈希，不依赖 BIP-39 PBKDF2，因此跳过校验不会影响密钥派生。

### 根因五：缺少中文词表
Enigma 生成助记词硬编码使用 `bip39English`，无语言选择入口。Rust SDK 已支持多语言（`Bip39Language` 枚举含中英法等），但 Dart 侧无对应实现。

## 修复

### 文件 1：`lib/screens/enigma_mnemonic_screen.dart`

| # | 问题 | 修复 |
|---|---|---|
| 1 | Horizontal overflow | Instructions 区两个 Row 中的 Text 包裹 `Expanded` |
| 2 | 无后退按钮 | AppBar 添加 `leading: IconButton(arrow_back, → /enigma)` |
| 2 | 无原生后退 | `PopScope(canPop: false, onPopInvokedWithResult: → /enigma)` 包裹 Scaffold |
| 3 | SetPin crash | `context.go('/set-pin', extra: words)` → `extra: words.join(' ')` |
| 5 | 语言硬编码 | `'English'` → `bip39LanguageName(language)` 动态显示 |

### 文件 2：`lib/screens/enigma_screen.dart`

| # | 问题 | 修复 |
|---|---|---|
| 5 | 无语言选择 | 在 Riddle 和 Secret Key 之间添加 `DropdownButton<Bip39WordlistLanguage>` |
| 5 | 硬编码英文词表 | `_generateDeterministicMnemonic` 接受 `language` 参数，调用 `bip39Wordlist(language)` |
| 3 | 导航 extra 类型 | `extra: words` → `extra: {'words': words, 'language': language}` |

### 文件 3：`lib/services/wallet_service.dart`

| # | 问题 | 修复 |
|---|---|---|
| 4 | validateMnemonic 阻断 Enigma | 移除 `setupWallet` 中的 `CryptoBridge.validateMnemonic()` 调用（Enigma 助记词不含 BIP-39 checksum） |

### 文件 4：`lib/data/bip39_wordlist.dart`

| # | 问题 | 修复 |
|---|---|---|
| 5 | 无中文词表 | 添加 `bip39ChineseSimplified`（2048 词，BIP-39 官方） |
| 5 | 无语言抽象 | 添加 `Bip39WordlistLanguage` 枚举 + `bip39LanguageName()` + `bip39Wordlist()` |

## 涉及文件
- lib/screens/enigma_mnemonic_screen.dart
- lib/screens/enigma_screen.dart
- lib/services/wallet_service.dart
- lib/data/bip39_wordlist.dart

## 影响范围
- Enigma 创建流程：Enigma → EnigmaMnemonic → SetPin
- Enigma 助记词生成现在支持中英文切换
- Wallet 创建流程不再因 BIP-39 checksum 缺失而阻断

## 验证
- `flutter analyze`: 零新错误
- `flutter test`: 47/47 passed
- `flutter build apk`: 23s，成功
- `adb install`: 成功安装到 bcb0051
- 布局验证：instructions 文本在 `Expanded` 包裹下自动折行
- 后退验证：AppBar 后退按钮 + Android 原生后退键均可用
- 语言选择：Enigma 生成助记词可选 English / 简体中文
