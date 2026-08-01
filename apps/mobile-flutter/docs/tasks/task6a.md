# Task 6a — Rust 加密核心

## Refined Task Description

### Goal
实现 Rust 加密 SDK 中剩余的 4 个模块（hdkey、signer、address、btc），激活所有计划依赖（bip32、ed25519-dalek、k256、sha2、ripemd、bech32、bs58），扩展 FFI 导出，编写并通过全部单元测试。

### Background

当前 `rust/src/` 状态：
- **mnemonic.rs**：✅ BIP-39 生成/验证/重编码完成（9/9 测试通过）
- **hdkey.rs**：❌ `unimplemented!()` — 缺少 BIP-32 + SLIP-10 派生
- **signer.rs**：❌ `unimplemented!()` — 缺少 secp256k1 + Ed25519 签名
- **address.rs**：❌ `unimplemented!()` — 缺少 5 链地址派生
- **btc.rs**：❌ `unimplemented!()` — 缺少 P2WPKH/Tron/Sui 地址
- **Cargo.toml**：仅激活 `bip39` + `rand`，其余依赖均注释

> 对标的 mono 源：`packages/crypto/src/hdkey.ts`、`signer.ts`、`address.ts`、`btc.ts`

### Breakdown

- [ ] **1.1** 激活 Cargo.toml 中被注释的依赖：`bip32`、`ed25519-dalek`、`k256`（ecdsa）、`sha2`、`ripemd`、`bech32`、`bs58`
- [ ] **1.2** 实现 hdkey.rs：BIP-32 secp256k1 派生（xprv → child）+ SLIP-10 Ed25519 派生（seed → master → child），支持标准路径解析（如 `m/44'/60'/0'/0/0`）
- [ ] **1.3** 实现 signer.rs：ETH 交易签名（ECDSA secp256k1）、ETH personal message（EIP-191）、EIP-712 typed data、Solana 消息签名（Ed25519）
- [ ] **1.4** 实现 address.rs：ETH（keccak256 pubkey → 0x 地址）、Solana（Ed25519 pubkey → base58）、BTC（P2WPKH bech32）、Tron（base58check 0x41 前缀）、Sui（blake2b + scheme flag）
- [ ] **1.5** 实现 btc.rs：P2WPKH bech32 bc1q、Tron base58check（0x41 prefix）、Sui Ed25519 32-byte address（0x00 scheme flag）
- [ ] **1.6** 扩展 lib.rs FFI 导出：为所有新函数添加 `#[no_mangle] extern "C"` 导出 + `free_string` 内存管理
- [ ] **1.7** 编写 Rust 单元测试（`cargo test` 全部通过，覆盖正常情况 + 边界条件）

### Files / Modules Involved

- `rust/Cargo.toml` — 激活被注释的依赖
- `rust/src/hdkey.rs` — BIP-32 + SLIP-10 派生实现
- `rust/src/signer.rs` — secp256k1/Ed25519 签名
- `rust/src/address.rs` — 五链地址派生
- `rust/src/btc.rs` — BTC/Tron/Sui 专用地址
- `rust/src/lib.rs` — 扩展 FFI 导出
- `rust/src/mnemonic.rs` — 参考实现模式（不修改）

### Notes

- 参考 `rust/src/mnemonic.rs` 的代码风格和文档注释格式
- BIP-32 硬化派生索引：`index | 0x80000000`，路径中用 `'` 标识
- EIP-191 签名 preamble：`"\x19Ethereum Signed Message:\n" + len(message)`
- EIP-712：需要在 Rust 侧实现 typed data hashing（依赖 keccak256）
- 所有 FFI 函数返回 Rust 分配的内存，调用方必须用 `free_string` 释放
- `cargo test` 必须以零失败通过

### Verification

- [ ] `cargo build --release` 成功
- [ ] `cargo test` 零失败，新增测试 >= 15 个
- [ ] 所有函数无 `unimplemented!()` 残留

---

> 父任务：Task 6 — iron-vault-mono 剩余功能实现
> 下一个：Task 6b — Dart FFI Bridge + Wallet Service
