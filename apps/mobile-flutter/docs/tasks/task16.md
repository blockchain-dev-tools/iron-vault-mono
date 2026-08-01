# task16: Rust SDK 架构重组 — 单体 → 三层 Workspace

参考 KeystoneHQ/keystone3-firmware 的 Rust SDK 架构模式，重构当前 `iron-vault-flutter` 的 Rust SDK。

---

## 目标架构

```
rust/                            ← workspace root
├── Cargo.toml                   ← [workspace] + workspace.dependencies
│
├── iron-vault-crypto/           ← L1: 加密原语层（纯数学/编码/算法）
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── secp256k1.rs         ← k256: ECDSA 签名 + 公钥推导（ETH/BTC/TRX 共用）
│       ├── ed25519.rs           ← ed25519-dalek: Ed25519 签名（SOL/SUI 共用）
│       ├── keccak256.rs         ← sha3: 纯哈希函数（ETH 地址、Tron 地址）
│       ├── blake2b.rs           ← blake2: 纯哈希函数（Sui 地址）
│       ├── hash160.rs           ← SHA-256 + RIPEMD-160（BTC P2WPKH）
│       ├── sha256d.rs           ← double SHA-256（BTC/Tron checksum）
│       ├── bech32.rs            ← bech32 编码（BTC SegWit）
│       ├── base58.rs            ← bs58 编码（SOL 地址、Tron 地址）
│       ├── rlp.rs               ← rlp crate 封装 + bytes_to_decimal（ETH 原语）
│       ├── pbkdf2_chacha20.rs   ← PBKDF2 + ChaCha20（PIN auth，链无关）
│       └── bip39.rs             ← BIP-39 mnemonic parse + seed derivation（链无关）
│
├── iron-vault-biz/              ← L2: 业务逻辑层（流程编排/语义解释）
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── hdkey.rs             ← BIP-32 secp256k1 + SLIP-10 Ed25519（seed→privkey）
│       ├── eth.rs               ← ETH: EIP-155 v、EIP-55 校验和、交易解析→展示 JSON
│       ├── solana.rs            ← SOL: message 签名、base58 地址
│       ├── btc.rs               ← BTC: compressed_pubkey→P2WPKH 地址
│       ├── tron.rs              ← TRX: uncompressed_pubkey→base58check 地址
│       ├── sui.rs               ← SUI: ed25519 pubkey→0x hex 地址
│       ├── enigma.rs            ← Enigma: riddle+secret→确定性助记词（链无关）
│       └── errors.rs            ← 统一 ChainError 枚举（thiserror）
│
└── iron-vault-ffi/              ← L3: FFI 边界层（C ABI 桥接，零业务逻辑）
    ├── Cargo.toml
    └── src/
        ├── lib.rs               ← 所有 #[no_mangle] extern "C" 导出
        ├── eth.rs               ← eth_parse / eth_sign_tx 等 FFI 薄包装
        ├── solana.rs
        ├── btc.rs
        ├── tron.rs
        ├── sui.rs
        ├── types.rs             ← FfiResult<T>, PtrString, #[repr(C)] 通用结构体
        ├── error.rs             ← 各链 Error → FfiError 映射
        └── memory.rs            ← 显式析构（替代通用 free_string）
```

---

## 背景

### 当前现状（单体）

```
rust/src/
├── lib.rs          ~600 行: FFI 辅助 + 25 个 extern "C" 导出
├── mnemonic.rs     BIP-39 生成/验证
├── enigma.rs       Enigma 确定性助记词
├── hdkey.rs        BIP-32 + SLIP-10 推导
├── signer.rs       ETH + Solana 签名（混在一个文件）
├── address.rs      5 链地址推导编排
├── btc.rs          P2WPKH/Tron/Sui 地址编解码（名字有误导）
├── crypto.rs       PBKDF2 + ChaCha20
└── parser.rs       RLP 交易解析
```

**痛点：**
1. `lib.rs` 过于臃肿 — FFI 辅助 + 全部 FFI 导出堆在一个文件
2. FFI 边界粗糙 — 所有错误返回 null，Dart 侧无法区分错误类型
3. 链逻辑耦合 — `signer.rs` 混着 ETH 和 Solana 的签名、`btc.rs` 混着 BTC/Tron/Sui 的编址
4. 加密原语和业务逻辑混放 — 不知道哪些是纯算法、哪些是流程编排
5. 无统一 Error 类型 — 各模块用 `Result<Vec<u8>, String>`
6. 敏感数据无零化 — seed/private key 未使用 `zeroize`

### 设计原则

**加密原语 vs 业务逻辑的划分标准：**

| 属于 crypto | 属于 biz |
|---|---|
| 输入 bytes 输出 bytes/hash/编码 | 涉及链的语义（"这是 ERC-20 transfer"） |
| 纯数学/编码转换（keccak256、bech32、base58） | 组合多个原语完成业务流程 |
| 不知道链的存在 | 知道自己在处理哪条链 |
| RLP 字段读取 | "chainId 在 EIP-1559 里是 field 0" |

### 当前代码 → 目标归属

| 当前文件 | crypto 部分 | biz 部分 |
|---|---|---|
| `crypto.rs` | `pbkdf2_derive()`、`chacha20_encrypt/decrypt` | — |
| `mnemonic.rs` | `mnemonic_to_seed()`（PBKDF2-HMAC-SHA512） | `Bip39Language`、`generate()`、`validate()`、`reencode()` |
| `enigma.rs` | — | 全部 |
| `hdkey.rs` | — | 全部（seed→privkey 是流程） |
| `signer.rs` | `keccak256()` 纯函数、`k256::sign_prehash_recoverable` | `sign_*` 系列、`eth_address_from_private_key()`、`eip55_checksum()` |
| `address.rs` | — | 全部（5 链编排） |
| `btc.rs` | `hash160()`、`sha256d()`、`sha2_single()` | `p2wpkh_address()`、`tron_address_from_pubkey()`、`sui_address()` |
| `parser.rs` | rlp crate 封装、`bytes_to_decimal()` | RLP 字段 → 展示 JSON |

### Keystone 的参考价值

| 我们参考了什么 | 为什么不照搬 |
|---|---|
| 三层分离（crypto → apps → ffi） | 我们不按链拆 crate，按技术层次拆 |
| `#[repr(C)]` 结构体 + Free trait 内存管理 | ✓ 直接采纳 |
| `thiserror` 错误枚举 + From 转换链 | ✓ 直接采纳 |
| `zeroize` 敏感数据清除 | ✓ 直接采纳 |
| feature flag 条件编译 | ✓ 采纳（每链一个 feature） |
| `no_std` 兼容 | ✗ 我们是 Android 标准环境，不需要 |
| UR + Protobuf 编码 | ✗ 我们走 BLE APDU，不用 QR |

---

## 任务拆解

### Phase 1: Workspace 搭建 + 纯代码移动（保持功能不变）

- [ ] 创建 `Cargo.toml` workspace root，定义 `[workspace]` + `workspace.dependencies`
- [ ] 创建 `iron-vault-crypto` crate，从当前代码抽取：
  - `crypto.rs` → `pbkdf2_chacha20.rs`
  - `mnemonic.rs` 的 seed 派生部分 → `bip39.rs`
  - `signer.rs` 的 `keccak256()` 纯函数 → `keccak256.rs`
  - `btc.rs` 的 `hash160()`、`sha256d()`、`sha2_single()` → `hash160.rs`、`sha256d.rs`
  - `btc.rs` 的 bech32/bs58 相关 → `bech32.rs`、`base58.rs`
  - `parser.rs` 的 `bytes_to_decimal()` → `rlp.rs`
  - 新增 `secp256k1.rs`、`ed25519.rs`、`blake2b.rs` 拆分当前 `signer.rs` 的签名逻辑
- [ ] 创建 `iron-vault-biz` crate，从当前代码抽取：
  - `mnemonic.rs` 的 Bip39Language/generate/validate/reencode
  - `enigma.rs` 全部
  - `hdkey.rs` 全部
  - `signer.rs` 的 sign_* 系列 + eth_address_from_private_key + eip55_checksum
  - `address.rs` 全部
  - `btc.rs` 的 p2wpkh_address/tron_address_from_pubkey/sui_address
  - `parser.rs` 的 parse_sign_data 系列
- [ ] 创建 `iron-vault-ffi` crate：
  - `lib.rs` 的 FFI 辅助函数
  - 所有 25+ 个 `extern "C"` 导出
  - 各链按文件分（eth.rs / solana.rs / btc.rs / tron.rs / sui.rs）
  - `types.rs` + `error.rs` + `memory.rs`
- [ ] 各 crate 移植现有测试，`cargo test` 保持 93/93 通过
- [ ] `cargo build --release` 零错误（host + arm64-v8a）

### Phase 2: FFI 边界现代化

- [ ] 定义 `FfiResult<T>` / `FfiError`（不再用 null 表示错误）
- [ ] 为复杂返回值定义 `#[repr(C)]` 结构体
- [ ] 实现 `Free` trait + 类型安全释放函数
- [ ] `zeroize` 在 FFI 返回前清除栈上的敏感数据
- [ ] Dart 侧 `crypto_bridge.dart` 适配新的错误返回值格式

### Phase 3: 错误处理系统

- [ ] `iron-vault-biz` 定义 `ChainError` 枚举（thiserror）
- [ ] 实现各链 `From` 转换链
- [ ] `iron-vault-ffi` 将 `ChainError` 映射为 Dart 可识别的错误码

### Phase 4: Feature flag 条件编译

- [ ] 为 ETH/SOL/BTC/TRX/SUI 各加一个 feature
- [ ] `iron-vault-ffi` 中 `#[cfg(feature = "ethereum")]` 条件导出
- [ ] 保持 `multi-coins` / `btc-only` / `all` 编译配置

### Phase 5: 验证

- [ ] `cargo test` 全部通过（不低于当前 93/93）
- [ ] Android arm64-v8a 交叉编译 + APK 打包
- [ ] `flutter analyze` 零新错误
- [ ] `flutter test` 全部通过
- [ ] 真机部署验证（import wallet → unlock → 显示地址）

---

## 涉及文件

### 新增

```
rust/
├── Cargo.toml
├── iron-vault-crypto/Cargo.toml
├── iron-vault-crypto/src/lib.rs
├── iron-vault-crypto/src/secp256k1.rs
├── iron-vault-crypto/src/ed25519.rs
├── iron-vault-crypto/src/keccak256.rs
├── iron-vault-crypto/src/blake2b.rs
├── iron-vault-crypto/src/hash160.rs
├── iron-vault-crypto/src/sha256d.rs
├── iron-vault-crypto/src/bech32.rs
├── iron-vault-crypto/src/base58.rs
├── iron-vault-crypto/src/rlp.rs
├── iron-vault-crypto/src/pbkdf2_chacha20.rs
├── iron-vault-crypto/src/bip39.rs
├── iron-vault-biz/Cargo.toml
├── iron-vault-biz/src/lib.rs
├── iron-vault-biz/src/hdkey.rs
├── iron-vault-biz/src/eth.rs
├── iron-vault-biz/src/solana.rs
├── iron-vault-biz/src/btc.rs
├── iron-vault-biz/src/tron.rs
├── iron-vault-biz/src/sui.rs
├── iron-vault-biz/src/enigma.rs
├── iron-vault-biz/src/errors.rs
├── iron-vault-ffi/Cargo.toml
├── iron-vault-ffi/src/lib.rs
├── iron-vault-ffi/src/eth.rs
├── iron-vault-ffi/src/solana.rs
├── iron-vault-ffi/src/btc.rs
├── iron-vault-ffi/src/tron.rs
├── iron-vault-ffi/src/sui.rs
├── iron-vault-ffi/src/types.rs
├── iron-vault-ffi/src/error.rs
└── iron-vault-ffi/src/memory.rs
```

### 删除

- `rust/src/lib.rs` → 拆入 `iron-vault-ffi/`
- `rust/src/crypto.rs` → `crypto/pbkdf2_chacha20.rs`
- `rust/src/mnemonic.rs` → `crypto/bip39.rs` + `biz/lib.rs`（generate/validate）
- `rust/src/enigma.rs` → `biz/enigma.rs`
- `rust/src/hdkey.rs` → `biz/hdkey.rs`
- `rust/src/signer.rs` → `crypto/secp256k1.rs` + `crypto/ed25519.rs` + `crypto/keccak256.rs` + `biz/eth.rs` + `biz/solana.rs`
- `rust/src/address.rs` → `biz/eth.rs` + `biz/solana.rs` + `biz/btc.rs` + `biz/tron.rs` + `biz/sui.rs`
- `rust/src/btc.rs` → `crypto/hash160.rs` + `crypto/sha256d.rs` + `crypto/bech32.rs` + `crypto/base58.rs` + `biz/btc.rs` + `biz/tron.rs` + `biz/sui.rs`
- `rust/src/parser.rs` → `crypto/rlp.rs` + `biz/eth.rs`

### Dart 侧联动

- `lib/infrastructure/ffi/crypto_bridge.dart` — FFI 函数签名若变需同步
- `lib/app/app_state.dart` — 错误处理方式若变需适配

---

## 注意事项

- **后向兼容优先** — Phase 1 只移动代码不改函数签名，Dart 侧无需改动。Phase 2 的错误返回值改造可以独立评估
- **测试跟随代码** — 每个模块移动后立即跑 `cargo test`，不累积债
- **`.cargo/config.toml` 保留** — NDK cross-compile linker 配置必须保留并验证
- **`zeroize` 拦截点** — 在 `extern "C"` 返回、seed/privkey 出作用域前调用
- **不新增外部依赖** — 纯重构，不引入新的 crate 依赖
- **`bitcoin` crate 不引入** — 当前用 `k256` + 手写 hash160/bech32，保持现状。后续如需更好的 xpub 支持可单独讨论 fork 方案
