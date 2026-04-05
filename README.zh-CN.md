# Iron Vault

将一台闲置的 Android 或 iOS 设备变成自托管冷钱包 —— 通过蓝牙与 OKX Wallet、MetaMask、Ledger Live 完全兼容。

Iron Vault 模拟一台 Ledger Nano X：设备暴露与真实硬件完全相同的 BLE GATT profile，并对 APDU 指令返回由密钥派生出的签名。从宿主 App 的视角来看，它与真实硬件设备毫无区别。

> **状态：** 积极开发中。核心钱包逻辑、加密原语、APDU 处理器和移动端 UI 已实现。BLE 外设集成正在进行中。

[English](./README.md) · **中文**

---

## 为什么选择 Iron Vault？

| | Iron Vault | AirGap Vault | Ledger 硬件 |
|--|-----------|--------------|------------|
| 兼容的钱包 | 所有 Ledger 兼容钱包 | 仅 AirGap | 所有 Ledger 兼容钱包 |
| Solana 支持 | ✅ | ❌ | ✅（$79+） |
| 成本 | 免费（用闲置手机） | 免费 | $79–$149 |
| 连接方式 | 蓝牙（无需线缆） | 二维码 | USB / 蓝牙 |
| 开源 | ✅ | ✅ | ❌ |

## 支持的钱包

兼容所有支持 Ledger 硬件钱包的 App：

**MetaMask** · **OKX Wallet** · **Phantom** · **Rabby** · **Backpack** · **Ledger Live** · 以及其他所有 Ledger 兼容钱包

## 快速安装

从 [GitHub Releases](../../releases) 下载最新 APK，直接安装到 Android 设备（无需编译）。

> iOS 需要从源码构建，详见下方[移动端应用](#移动端应用appsmobile)章节。

---

## 工作原理

```
┌─────────────────────────────────────────────┐
│              宿主端（电脑或手机）             │
│   OKX Wallet · MetaMask · Ledger Live        │
└──────────────────────┬──────────────────────┘
                       │ BLE (GATT)
                       │ UUID: 13d63400-2c97-0004-0000-4c6564676572
┌──────────────────────▼──────────────────────┐
│           Android / iOS（Iron Vault）          │
│  ┌─────────────────────────────────────────┐ │
│  │  React Native App  (apps/mobile)        │ │
│  │  ┌──────────┐  ┌────────┐  ┌─────────┐ │ │
│  │  │  BLE     │  │  APDU  │  │ Wallet  │ │ │
│  │  │ GATT     │→ │ 处理器 │→ │ 服务    │ │ │
│  │  │ 服务端   │  │        │  │         │ │ │
│  │  └──────────┘  └────────┘  └────┬────┘ │ │
│  └───────────────────────────────── │ ─────┘ │
│                                     ▼         │
│            加密后端  (packages/crypto)         │
│            BIP-32 · SLIP-10 · secp256k1       │
│            Ed25519 · BIP-39 助记词            │
└─────────────────────────────────────────────┘
```

私钥始终在设备本地运算，**永不通过 BLE 传输**。宿主端只收到签名结果。

---

## 仓库结构

```
iron-vault-mono/
├── apps/
│   ├── mobile/          # React Native 生产应用
│   ├── prototype/       # Next.js 设计画布 & 逻辑测试台（端口 3002）
│   ├── debugger/        # Next.js BLE APDU 调试器（端口 3001）
│   └── devtools/        # 开发者工具 UI
└── packages/
    ├── wallet/          # 业务逻辑：PIN 鉴权、助记词生命周期、存储接口
    ├── crypto/          # 纯加密：HD 派生、签名、BIP-39（无平台依赖）
    ├── apdu/            # Ledger APDU 封帧、命令分发
    ├── simulator/       # Ledger 设备模拟器（用于测试）
    └── theme/           # 共享设计令牌（颜色、圆角）
```

### 包依赖关系

```
@iron-vault/theme        ← 无依赖

@iron-vault/crypto       ← @noble/curves, @noble/hashes, @scure/bip32, @scure/bip39

@iron-vault/apdu         ← @iron-vault/crypto

@iron-vault/wallet       ← @iron-vault/crypto, @noble/hashes

apps/prototype           ← @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme
apps/mobile              ← @iron-vault/wallet, @iron-vault/apdu, @iron-vault/theme
```

---

## 开发环境搭建

### 环境要求

- Node.js ≥ 18，pnpm ≥ 9
- `apps/mobile` 需要：Android（SDK + Java 17）或 iOS（Xcode 15+，实体设备）

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 同时启动所有应用
pnpm dev

# 单独启动某个应用
pnpm --filter prototype dev     # → http://localhost:3002
pnpm --filter debugger dev      # → http://localhost:3001
```

### 类型检查

```bash
# 必须在 monorepo 根目录执行
pnpm exec tsc --noEmit -p apps/prototype/tsconfig.json
```

---

## 移动端应用（apps/mobile）

**技术栈：** React Native 0.84 · TypeScript · React 19

### Android — 构建并安装 APK

```bash
cd apps/mobile/android
./gradlew assembleDebug  # 确保 JAVA_HOME 指向 JDK 17
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### iOS — 构建并运行

```bash
cd apps/mobile
npx react-native run-ios --device
```

或用 Xcode 打开 `apps/mobile/ios/IronVault.xcworkspace`，连接设备后直接运行。

### 启动 Metro 打包器

```bash
cd apps/mobile
npx react-native start --reset-cache
```

### ADB 常用命令

```bash
# 端口转发（每次 adb daemon 重启后需重新执行）
adb reverse tcp:8081 tcp:8081

# 启动 / 停止应用
adb shell am start -n com.ironvault/.MainActivity
adb shell am force-stop com.ironvault
```

---

## 包说明

### `@iron-vault/wallet`

平台无关的业务逻辑层，通过 `WalletStorage` 接口同时支持浏览器和 React Native。

```typescript
import { hasWallet, setupWallet, unlockWallet, clearWallet } from '@iron-vault/wallet';

await hasWallet(storage);                        // → boolean
await setupWallet(storage, mnemonic, pin);       // → WalletAccounts
await unlockWallet(storage, pin);                // → WalletAccounts | null（null 表示 PIN 错误）
await clearWallet(storage);                      // 清除钱包数据
```

PIN **永不以明文存储** —— 仅持久化 `sha256(pin)`。

### `@iron-vault/crypto`

无状态、纯函数式加密原语。

```typescript
import { generateMnemonic, deriveWalletAccounts } from '@iron-vault/crypto';

const mnemonic = generateMnemonic();             // 12 个 BIP-39 助记词
const accounts = await deriveWalletAccounts(mnemonic);
// accounts.eth[0].full  → "0xABCD..."
// accounts.sol[0].full  → base58 公钥
```

支持：BIP-32（以太坊/secp256k1）、SLIP-10（Solana/Ed25519）。

### `@iron-vault/apdu`

Ledger APDU 命令处理器。

```typescript
import { handleApdu, setCurrentApp, setSignRequestHandler } from '@iron-vault/apdu';

setCurrentApp('Ethereum');
setSignRequestHandler(async (req) => req.sign());

const responseHex = await handleApdu(incomingHex);
```

支持的命令：`GET_VERSION`、`GET_APP_AND_VERSION`、`GET_ETH_ADDRESS`、`SIGN_ETH_TX`、`GET_PUBKEY`（Solana）、`SIGN_MESSAGE`（Solana）。

### `@iron-vault/theme`

React Native 设计令牌。

```typescript
import { DARK, LIGHT } from '@iron-vault/theme';
// DARK.primary  → '#8FC322'  （深色模式主色）
// LIGHT.primary → '#5f8a0e' （浅色模式主色）
// DARK.bg → '#0F0F0F'
// R.md → 12  （C 和 R 是向后兼容别名，仍可使用）
```

---

## Web 调试器（apps/debugger）

基于浏览器的 APDU 通信调试工具，通过 Web Bluetooth API 连接设备（需要 Chrome/Edge）。

- 发送预设 APDU 命令，查看原始十六进制帧
- 模拟完整的 OKX Wallet 连接流程
- 实时解码响应数据

需要开启：`chrome://flags/#enable-experimental-web-platform-features`

---

## 安全说明

- 私钥在设备本地派生，**永不通过 BLE 传输**
- PIN 以 `sha256(pin)` 形式存储，**永不明文保存**
- 助记词通过 `react-native-keychain` 存储（Android Keystore / iOS Secure Enclave）—— 注意：助记词目前以明文形式存储在安全容器内，基于 PIN 的静态加密是[已知待改进项](./docs/todos/wallet-storage-improvement.md)
- 本项目是个人安全工具，用于理解冷钱包内部原理。在用真实资产前请自行审计代码

---

## 文档

| 文档 | 说明 |
|------|------|
| [docs/architecture.md](./docs/architecture.md) | 系统架构、数据流、技术栈 |
| [docs/packages.md](./docs/packages.md) | 共享包 API 参考 |
| [docs/ble-protocol.md](./docs/ble-protocol.md) | BLE 传输层与 APDU 封帧规范 |
| [docs/app-screens.md](./docs/app-screens.md) | 移动端页面流转 |
| [docs/dev-guide.md](./docs/dev-guide.md) | 开发环境搭建与工作流 |
| [docs/architecture/mobile.md](./docs/architecture/mobile.md) | React Native 应用架构深度解析 |

---

## 参与贡献

欢迎各种形式的贡献！

- **Bug 报告 & 功能建议** — 提交 [GitHub Issue](../../issues)
- **问题 & 讨论** — 使用 [GitHub Discussions](../../discussions)
- **Pull Request** — 建议先开 Issue 讨论，PR 请聚焦单一问题
- **安全漏洞** — 请勿公开提 Issue，直接联系维护者

### 开发流程

1. Fork 仓库并创建 feature 分支
2. `pnpm install` 安装依赖
3. 修改代码；运行 `pnpm type-check` 验证类型
4. 提交 PR，说明改动内容和原因

---

## 许可证

MIT
