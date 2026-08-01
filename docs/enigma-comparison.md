# 谜语模式 vs blockchain-dev-tools 助记词生成器：算法对比

> 对比 `iron-vault-mono` 的 Enigma（谜语/Enigma）模式与 `blockchain-dev-tools.github.io/wallet/mnemonic-generator` 的助记词生成算法。
>
> 二者都实现了"用 BIP-39 词表中的文字生成确定性钱包"，但**每个关键步骤的算法选择都不同**，导致相同输入产生完全不同的输出。

---

## 概览

| 维度 | iron-vault Enigma | mnemonic-generator (web) |
|------|-------------------|--------------------------|
| 源码位置 | [`apps/mobile/src/screens/EnigmaScreen/index.tsx`](../apps/mobile/src/screens/EnigmaScreen/index.tsx) | 无本地源码，部署于 <https://blockchain-dev-tools.github.io/wallet/mnemonic-generator> |
| 描述 | 谜语文本 + 密钥 → 确定性 24 词助记词 | 汉字 + 可选盐值 → 确定性以太坊钱包 |
| 哈希算法 | **SHA-256** | **keccak256** (以太坊风格) |
| 词表 | 全部 10 种 BIP-39 语言 | 仅简体中文 (`chinese_simplified`) |
| 输出 | 24 词 BIP-39 助记词 + ETH/SOL/BTC/TRON/SUI 地址 | 24 词 BIP-39 助记词 + ETH 地址 |

---

## 逐步骤算法对比

### 步骤 1：文本切分

| | iron-vault Enigma | mnemonic-generator |
|---|---|---|
| 方式 | CJK 语言逐字切分；其他语言按空格切分 | 逐字切分 |
| 代码 | `text.split('').filter(c => c.trim() !== '')` (CJK) | `e.split("").filter(e => "" !== e.trim())` |

两者对中文的切分方式一致：按字符拆分，过滤空白。

### 步骤 2：查词表索引

| | iron-vault Enigma | mnemonic-generator |
|---|---|---|
| 词表 | `BIP39_WORDLISTS[lang]` — 支持全部 10 种语言 | `h.wordlists.chinese_simplified` — 仅简体中文 |
| 查找方式 | 预构建 `Map<string, number>` (O(1)) | `Array.indexOf()` (O(n)) |
| 不匹配处理 | 跳过（不贡献熵） | 跳过 |

### 步骤 3：索引编码为 hex **<— 关键差异**

| | iron-vault Enigma | mnemonic-generator |
|---|---|---|
| 编码 | `index.toString(16).padStart(4, '0')` | `index.toString(16)` |
| 示例 | 索引 1 → `"0001"` | 索引 1 → `"1"` |
| 索引 2047 → | `"07ff"` | `"7ff"` |
| 效果 | **每个词固定 4 hex 字符**，天然对齐 16 词 × 4 字符 = 64 hex | **长度可变**（1–4 字符），16 词可以远少于 64 hex |

> **这是第一个根本性差异。** iron-vault 的 padStart 保证了每个词对 hex 字符串的贡献是固定宽度的（4 hex = 16 bits），而 mnemonic-generator 用原生 `toString(16)` 导致低索引（如 `的` = 索引 1 → `"1"`）和高索引（如 `明` = 索引可能 1500+ → `"5dc"`）的编码长度不同。

### 步骤 4：截断

| | iron-vault Enigma | mnemonic-generator |
|---|---|---|
| 上限 | 64 hex 字符（= 16 个词 × 4 字符） | `n.slice(0, 64)` — 同样 64 hex |
| 填充 | 不足时 `padEnd(64, '0')` | 不显式填充（但 slice 保证上限） |

实际效果类似：都用最多 16 个词，截断到 64 hex 字符。

### 步骤 5：熵的哈希处理 **<— 核心差异**

iron-vault Enigma:
```
① entropyBytes = hexToBytes(entropyHex)    // hex 字符串 → 字节数组 (32 字节)
② entropyHash = sha256(entropyBytes)        // SHA-256 对字节数组哈希
```

mnemonic-generator:
```
① n = keccak256(`0x${entropyHex}`)         // keccak256 对 hex 字符串字面量直接哈希!
② n = n.replace(/^0x/, "")                 // 取掉 0x 前缀
```

> **这是第二个根本性差异。** iron-vault 先将 hex 字符串**解码为字节数组**再哈希（例如 `"0001"` → `[0x00, 0x01]`），而 mnemonic-generator 将 hex 字符串作为**文本字面量**直接做 keccak256（例如 `"1"` 作为字符串 `"1"` 哈希，不是字节 `0x01`）。

### 步骤 6：盐值处理

| | iron-vault Enigma | mnemonic-generator |
|---|---|---|
| 编码 | `TextEncoder.encode(salt)` → UTF-8 字节 | `TextEncoder.encode(salt)` → UTF-8 字节 |
| 哈希 | `sha256(utf8Bytes)` | `keccak256(utf8Bytes)` |
| 盐值类型 | **必填**（空盐值报错） | **可选**（空盐值跳过） |

### 步骤 7：熵 + 盐的组合哈希 **<— 核心差异**

iron-vault Enigma:
```
combined = entropyHash (32 字节) ‖ saltHash (32 字节)   // 字节数组拼接 (64 字节)
finalEntropy = sha256(combined)                          // SHA-256
```

mnemonic-generator:
```
combined = entropyHash (hex) + saltHash (hex)           // hex 字符串拼接
finalEntropy = keccak256(`0x${combined}`)               // keccak256
```

> **这是第三个根本性差异：组合方式。** 一个是**字节数组拼接**，一个是**十六进制字符串拼接**；同时哈希算法也不同。

### 步骤 8：生成助记词

iron-vault Enigma:
```typescript
const mnemonic = entropyToMnemonic(finalEntropy, 'en');  // @scure/bip39
```

mnemonic-generator:
```javascript
let d = h.entropyToMnemonic(c);                         // @scure/bip39
let x = n5.fromPhrase(d);                               // ethers Wallet
```

二者最终都调用 `@scure/bip39` 的 `entropyToMnemonic` 来生成 BIP-39 助记词。mnemonic-generator 额外用 ethers 提取了以太坊地址。

---

## 关键差异总结

将相同的中文文本输入两个工具，**必然产生不同的结果**，原因如下表：

| # | 差异点 | iron-vault Enigma | mnemonic-generator | 影响 |
|---|--------|-------------------|---------------------|------|
| 1 | 索引编码 | `.padStart(4, '0')` (固定 4 hex) | `toString(16)` (不定长) | hex 字符串完全不同 |
| 2 | 哈希函数 | **SHA-256** | **keccak256** | 即使同一输入也产生不同 hash |
| 3 | 熵的编码方式 | `hexToBytes` → 解码为字节再哈希 | `\`0x${hex}\`` → 直接哈希 hex 字符串 | 同 hex 字符串，不同 hash 输入 |
| 4 | 组合方式 | 字节数组 `‖` (concat) | hex 字符串 `+` | 拼接结果完全不同 |
| 5 | 盐值参与 | `sha256(salt)` → 字节 | `keccak256(salt)` → hex 字符串 | 盐值处理方式不同 |

---

## 如果想要兼容

如果希望两个工具对同一输入产生相同输出，需要统一以下一条完整的算法链（任选一侧作为标准）：

**要匹配 mnemonic-generator：**
```
1. 每个汉字查简体中文 BIP-39 词表索引
2. index.toString(16) — 不补零
3. 截断到 64 字符
4. finalEntropy = keccak256(keccak256("0x"+entropyHex) + keccak256(salt))  // 去掉 0x
5. entropyToMnemonic(finalEntropy)  // @scure/bip39
```

**要匹配 iron-vault Enigma：**
```
1. 按语言切分文本，查对应 BIP-39 词表索引
2. index.toString(16).padStart(4, '0') — 固定 4 位
3. 最多 16 个词 × 4 字符 = 64 hex，不足补 '0'
4. finalEntropy = sha256(sha256(hexToBytes(entropyHex)) ‖ sha256(salt))
5. entropyToMnemonic(finalEntropy, 'en')
```

---

## 附录：源码定位

### iron-vault-mono

| 文件 | 说明 |
|------|------|
| `apps/mobile/src/screens/EnigmaScreen/index.tsx` | Enigma 主屏幕，含 `deriveEntropy()` 核心算法 |
| `apps/mobile/src/screens/EnigmaMnemonicScreen/index.tsx` | 显示生成的助记词 |
| `apps/mobile/src/screens/WelcomeScreen/index.tsx` | 入口（"谜语钱包"按钮） |
| `packages/crypto/src/mnemonic.ts` | BIP-39 核心函数 |
| `packages/crypto/src/tests/riddle.test.ts` | 谜语模式测试套件 |

### blockchain-dev-tools.github.io

该站点基于 Next.js App Router 构建，无本地源码（页面在构建产物 `out/` 目录中，源码未检出）。算法存在于以下 JS chunk：

| 资源 | 说明 |
|------|------|
| `/_next/static/chunks/87947ecc3a46fe85.js` | 页面组件 + `@scure/bip39` + ethers |
| `/_next/static/chunks/6e1e908390cf5694.js` | 简体中文 BIP-39 wordlist (2048 字) |
| `/_next/static/chunks/4c2f3915503e40db.js` | keccak256 等密码学函数 |

---

*文档生成日期：2026-06-24*
*数据来源：iron-vault-mono 源码阅读 + blockchain-dev-tools.github.io 网页 JS 逆向分析*
