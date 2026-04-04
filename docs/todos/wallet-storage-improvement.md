# TODO: 钱包状态存储改进

## 背景

当前 `packages/wallet` 的存储方案存在安全和性能两个问题，需要在后续迭代中改进。

## 现状

### 存储 key

| Key | 内容 |
|---|---|
| `wallet.mnemonic` | 助记词**明文** |
| `wallet.pinHash` | PIN 的 SHA-256 哈希 |

### 运行时

- `unlockWallet` 每次都执行 `mnemonicToSeed`（PBKDF2，耗时）+ 路径推导
- 无内存缓存，每次页面跳转涉及账户数据时都重新推导

### 派生账户数量

- ETH：1 个（`m/44'/60'/0'/0/0`）
- SOL：1 个（`m/44'/501'/0'/0'`）

---

## 问题 1：助记词明文存储（安全）

PIN hash 仅用于登录验证，**不保护助记词本身**。如果 Keychain/Keystore 被绕过或备份泄漏，攻击者无需 PIN 即可直接获取助记词。

### 改进方案：用 PIN 派生密钥加密助记词

```
salt               = crypto.getRandomValues(16 bytes)
key                = PBKDF2(PIN, salt, iterations=100000, hash=SHA-256)
encryptedMnemonic  = AES-GCM(key, mnemonic)

存储：wallet.salt + wallet.encryptedMnemonic
```

- 不再需要 `wallet.pinHash`，解密失败即代表 PIN 错误（隐式验证）
- 加密使用 Web Crypto API（SubtleCrypto），浏览器和 React Native 均支持，无需额外依赖

---

## 问题 2：每次解锁重新推导（性能）

每次 `unlockWallet` 都需要：
1. `mnemonicToSeed`（PBKDF2，~100ms+）
2. BIP-32/SLIP-10 路径推导 × N 条路径

### 改进方案：解锁后缓存到内存

```ts
// 模块级单例
let _accounts: WalletAccounts | null = null;

export function getUnlockedAccounts(): WalletAccounts | null { return _accounts; }
export function lockWallet(): void { _accounts = null; }
```

- 解锁成功后将 `WalletAccounts` 缓存，后续直接读内存
- App 进入后台时调用 `lockWallet()` 清除缓存

---

## 改动计划

### `packages/wallet/src/service.ts`（主要）

- `setupWallet` — 生成 salt，加密助记词，存 `wallet.salt` + `wallet.encryptedMnemonic`
- `unlockWallet` — 读 salt，PBKDF2 + AES-GCM 解密，成功则设内存缓存
- `verifyPin` — 改为尝试解密（废弃 hash 比对）
- `hasWallet` — 检查 `wallet.encryptedMnemonic`
- 新增 `lockWallet()` — 清除内存缓存
- 新增 `getUnlockedAccounts()` — 读缓存

### `apps/mobile`（小改动）

```ts
AppState.addEventListener('change', state => {
  if (state === 'background') lockWallet();
});
```

### `apps/prototype`（小改动）

```ts
document.addEventListener('visibilitychange', () => {
  if (document.hidden) lockWallet();
});
```

### 迁移兼容

`unlockWallet` 检测旧 key（`wallet.mnemonic`）：若存在则走旧逻辑解锁，成功后自动迁移到新格式并删除旧 key。

---

## 优先级

| 项 | 优先级 | 原因 |
|---|---|---|
| 助记词加密存储 | **高** | 核心安全问题 |
| 内存缓存 | 中 | 性能优化，改动小 |
| App 后台自动锁定 | 中 | 配合缓存方案 |
