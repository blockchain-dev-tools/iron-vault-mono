参考 home/lbh/iron-vault-mono/docs/enigma-comparison.md 文档
我更想要 blockchain-dev-tools.github.io mnemonic-generator的实现

参考
home/lbh/workspace/blockchain-dev-tools.github.io
的实现，帮我改下现在rust sdk的逻辑

---

## Refined Task Description

### Goal

将 Rust SDK 中的 Enigma 确定性助记词推导算法从「iron-vault-mono 兼容的 SHA-256 + padStart 方案」改为 **匹配 blockchain-dev-tools.github.io mnemonic-generator 的 keccak256 + toString(16) 无补零方案**。使得相同的中文谜语输入在两个工具中产生**相同的 24 词 BIP-39 助记词**。

### Background

当前 Rust `rust/src/enigma.rs` 实现了 iron-vault-mono 的算法：
- 词索引编码为 `{:04x}`（固定 4 hex，补零）
- 哈希使用 **SHA-256**
- Hex 字符串经 `hex::decode` 转字节数组后再哈希
- 盐值必填（空盐值报错）
- 熵 + 盐的组合方式：**字节数组拼接** → SHA-256

blockchain-dev-tools.github.io mnemonic-generator 的算法（根据 enigma-comparison.md 的 JS 逆向分析）：
- 词索引编码为 `index.toString(16)`（**不定长，不补零**）
- 哈希使用 **keccak256**
- Hex 字符串**直接作为文本字面量**哈希（`keccak256("0x" + hexStr)`），不经 hex decode
- 盐值可选（空盐值跳过）
- 熵 + 盐的组合方式：**hex 字符串拼接** → keccak256

详见 `enigma-comparison.md`「如果想要兼容」→「要匹配 mnemonic-generator」章节。

### 算法链（目标实现）

```
1. 输入文本按字符拆分（仅简体中文 BIP-39 词表查索引）
2. index.toString(16) — 不补零，不定长
3. 所有索引 hex 拼接到 entropyHex，截断到 64 字符
4. 若盐值非空: saltHash = keccak256(salt).replace("0x", "")
   若盐值为空: saltHash = ""
5. entropyHash = keccak256("0x" + entropyHex).replace("0x", "")
6. finalEntropy = keccak256("0x" + entropyHash + saltHash).replace("0x", "")
7. entropyToMnemonic(finalEntropy) → 24 词 BIP-39 助记词
```

### 涉及模块

| 模块 | 文件 | 改动量 |
|------|------|--------|
| Rust Enigma | `rust/src/enigma.rs` | **大改**：`derive_entropy()` 全部重写，新增 keccak256 依赖 |
| Rust FFI 导出 | `rust/src/lib.rs` | 无需改动（FFI 接口签名不变） |
| Rust 测试 | `rust/src/enigma.rs` 内嵌测试 | **必须重写**：旧测试向量的期望值全部变化 |
| Rust Cargo | `rust/Cargo.toml` | 无需改动（`sha3` 已在依赖中） |
| Dart 桥接 | `lib/utils/enigma.dart` | 无需改动（仅调 FFI） |
| Dart Enigma 测试 | `test/utils/enigma_test.dart` | **必须更新**：期望值随算法变化 |

### Breakdown

- [ ] **Step 1: 确认 Open Questions** — 先确认下面列出的开放问题，再开始编码
- [ ] **Step 2: 重写 `rust/src/enigma.rs` 的 `derive_entropy()`**：
  - 修改 `tokenize()`：仅逐字切分（参照 mnemonic-generator 的逐字方式）
  - 修改索引编码：去掉 `{:04x}`，改用 `{:x}`（不定长不补零）
  - 将哈希从 `sha2::Sha256` 替换为 `sha3::Keccak256`
  - 改成 hex 字符串处理流程（不经过 `hex::decode` 转字节）
  - 盐值改为可选（空字符串 → 无盐分支）
- [ ] **Step 3: 新增 `keccak256_hex()` 工具函数** — 接受 hex 字符串（补或不补 `"0x"`），返回 keccak256 的 hex 摘要（去 `0x`）
- [ ] **Step 4: 重写所有内嵌测试** — 所有旧期望值不再有效，需根据已知输入计算新的期望值（可通过实际运行 blockchain-dev-tools.github.io 页面获取）
- [ ] **Step 5: 更新 Dart 测试 `test/utils/enigma_test.dart`** — 更新期望值匹配新算法
- [ ] **Step 6: 验证** — `cargo test` 全部通过、`flutter test` 通过

### Notes

- FFI 接口（`enigma_derive_mnemonic`）输入输出类型不变，仅内部算法变化
- 当前 `enigma.rs` 含 20 个测试，需逐个评估哪些保留（仅逻辑变化导致期望值变，测试结构可复用）
- 需要手动运行一次 blockchain-dev-tools.github.io 页面获取一个已知测试向量，作为回归依据
- Rust 的 `sha3` crate 已在 `Cargo.toml` 中，无需新增依赖
- 改动后 Rust SDK 将与 iron-vault-mono 的 Enigma **不兼容**（相同输入产生不同输出）。这是预期行为。

### Open Questions

1. **语言/词表范围**：blockchain-dev-tools.github.io 的 mnemonic-generator 只用了简体中文（`chinese_simplified`）词表。我们的 Rust SDK 当前支持全部 10 种 BIP-39 语言。需要：
   - (B) 保持多语言支持，但非中文词表的 hex 编码也改用 `toString(16)` 不补零？

   **推荐 (B)**，因为 Flutter UI 已有多语言选择器，且不补零的逻辑与语言无关。

2. **盐值是否保持必填**：当前 Enigma 页面盐值是必填项（空盐值报错），但 mnemonic-generator 的盐值是可选的（空盐值跳过）。需要决定：
   - (A) 保留必填（保持 UX 一致，但算法上如果传空字符串也不报错，直接走无盐分支）
   
   **推荐 (A)**：算法层支持空盐值（走无盐分支），UI 层保持必填。

3. **已知测试向量来源**：需要从 `https://blockchain-dev-tools.github.io/wallet/mnemonic-generator` 获取一个已知输入/输出的测试向量作为回归基准。能否提供一组你已验证过的 (riddle, secret, expected_mnemonic)？

  谜语文本: 床前明月光，疑是地上霜。举头望明月，低头思故乡。
  密钥     : 1234
  Passphrase: (空)

   ── English (24 词) ──
     vibrant cabin unfair lion success ladder expect barrel tip across stick honey young emerge card camera like achieve paddle party bunker wild repeat student
   Final entropy (hex)
     f363fbb4411d84f8d41096e2804b56b69ff49148a10581a03a7b5041e7f62dae
   注意：输出助记词为英文，与区块链开发工具网站的行为一致。
   中文版助记词与此不同，因为两者使用不同的词表（英文词表 vs 简体中文词表）

4. **关于`0x`前缀处理的细节确认**：从 enigma-comparison.md 的 JS 逆向来看，keccak256 调用时传的是 `"0x" + hexStr`（带 0x 前缀的字符串），然后 remove `0x`。而 Rust 的 `sha3::Keccak256` 处理的是字节数组，需要确认字符串编码方式——是直接哈希 `"0x" + hexStr` 的 UTF-8 字节，还是哈希 hex 解码后的字节？从 JS 源码 `keccak256('0x' + entropyHex)` 来看，它是对**文本字符串**做哈希（不是字节）。需要在 Rust 端对应为 `Keccak256::digest(format!("0x{}", entropyStr).as_bytes())`。
是的