# apps/mobile — Architecture Design

**Version:** 0.1
**Date:** 2026-03-28
**Status:** Draft

---

## 1. 背景与目标

### 现状

| 模块 | 状态 | 说明 |
|------|------|------|
| `apps/mobile/src/screens/HomeScreen.tsx` | 可用 | 功能完整但 UI 粗糙，无设计系统 |
| `apps/mobile/android/BleModule.java` | 完成 | GATT Server + BLE 广播，已联调 OKX ✅ |
| `apps/prototype/` | 完成 | 完整 10 屏设计稿，含组件库和导航流 |
| `packages/apdu` | 完成 | APDU 路由/解析，支持 ETH + Solana |
| `packages/crypto` | 完成 | HD 派生、ETH/Solana 签名 |
| `packages/theme` | 过期 | 主色仍为蓝色 `#1A73E8`，需改为 lime green |
| iOS BleModule.swift | 未实现 | M4 里程碑 |

### 目标

将 `apps/mobile` 从单屏原型演进为完整的 MVP 应用，严格对齐 `apps/prototype` 的交互设计和视觉语言，同时保留已验证的 BLE + APDU 底层实现。

---

## 2. 整体层次结构

```
┌─────────────────────────────────────────────────────────┐
│               Screen Layer  (src/screens/)               │
│  WelcomeScreen / WalletManager / AccountDetail ...       │
└──────────────────────┬──────────────────────────────────┘
                       │ useApp()
┌──────────────────────▼──────────────────────────────────┐
│           State Layer  (src/store/AppContext.tsx)         │
│  navigation stack | mnemonicReady | bleState             │
│  accounts | currentChain/acctIdx | pendingTx | pin       │
└──────────────────────┬──────────────────────────────────┘
                       │ DeviceEventEmitter / NativeModules
┌──────────────────────▼──────────────────────────────────┐
│         BLE Layer  (NativeModules.BleModule)             │
│  startAdvertising / stopAdvertising                      │
│  sendApduResponse  ←  onApduReceived events              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│          APDU Layer  (@iron-vault/apdu)                   │
│  handleApdu() — routes to ETH / Solana / version cmd     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│         Crypto Layer  (@iron-vault/crypto)                │
│  HD 派生 | ETH 签名 | Solana 签名 | address 工具         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│       Secure Storage  (react-native-keychain)            │
│  iOS: Keychain + Secure Enclave                          │
│  Android: Keystore TEE / StrongBox                       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

```
apps/mobile/
├── android/                        # 已完成（BleModule.java + LedgerBleConstants）
├── ios/                            # M4: Swift CBPeripheralManager
│   └── BleWalletRN/
│       ├── BleModule.swift
│       ├── BleModuleBridge.m
│       └── LedgerBleConstants.swift
├── src/
│   ├── components/
│   │   └── ui/                     # 所有可复用 UI 组件
│   │       ├── TopBar.tsx
│   │       ├── BottomNav.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── SectionLabel.tsx
│   │       ├── BleStatus.tsx
│   │       ├── PinDots.tsx
│   │       └── PinPad.tsx
│   ├── navigation/
│   │   └── Navigator.tsx           # 自定义 stack 渲染器
│   ├── screens/
│   │   ├── WelcomeScreen.tsx       # P01
│   │   ├── GenerateMnemonicScreen.tsx  # P02
│   │   ├── VerifyMnemonicScreen.tsx    # P03
│   │   ├── SetPinScreen.tsx            # P04
│   │   ├── ImportMnemonicScreen.tsx    # P05
│   │   ├── WalletManagerScreen.tsx     # P06
│   │   ├── SettingsScreen.tsx          # P08
│   │   ├── PinUnlockScreen.tsx         # P09
│   │   ├── AccountDetailScreen.tsx     # P10
│   │   └── TransactionScreen.tsx       # P11
│   ├── store/
│   │   └── AppContext.tsx          # 全局状态 + navigation stack
│   └── App.tsx                     # 根组件，挂载 AppProvider + Navigator
├── package.json
└── tsconfig.json
```

**清理项（迁移后删除）：**
- `src/apdu/` — 改用 `@iron-vault/apdu`
- `src/crypto/` — 改用 `@iron-vault/crypto`
- `src/screens/HomeScreen.tsx` — 被新屏幕替代

---

## 4. 设计系统对齐

### 4.1 `packages/theme` 更新

当前主色为蓝色，需与 prototype 对齐改为 lime green：

```typescript
// packages/theme/src/index.ts  (更新)
export const C = {
  // 主色调（来自 prototype globals.css）
  primary:          '#8FC322',  // lime green  ← 关键更新
  onPrimary:        '#000000',

  // 背景层级
  bg:               '#000000',
  surface:          '#111111',
  surfaceContainer: '#1A1A1A',
  surfaceContainerHigh: '#222222',
  surfaceContainerLow:  '#0D0D0D',

  // 文字
  text:             '#FFFFFF',   // onSurface
  text2:            '#999999',   // onSurfaceVariant
  textDisabled:     '#555555',

  // 边框
  border:           '#2A2A2A',   // outline
  borderVariant:    '#1A1A1A',   // outlineVariant

  // 语义色
  error:            '#CF6679',
  errorContainer:   'rgba(207,102,121,0.15)',
  green:            '#34A853',
  yellow:           '#F9AB00',
  sol:              '#9945FF',   // Solana 品牌色
} as const;

// 圆角（对应 prototype 的 sharp 风格）
export const R = {
  xs:  2,
  sm:  4,
  md:  8,
  lg:  12,
  xl:  16,
  xxl: 20,
} as const;
```

### 4.2 字体

Prototype 使用 Space Grotesk（标题）+ Manrope（正文）。React Native 需要通过 `react-native-font` 或字体文件加载：

- 加载字体文件到 `assets/fonts/`
- `package.json` 增加 `"rnpm": { "assets": ["./assets/fonts/"] }`
- `theme.ts` 导出 `FONTS = { headline: 'SpaceGrotesk-Bold', body: 'Manrope-Regular', ... }`
- **降级方案**：若字体加载复杂，MVP 阶段可用 `Platform.select({ ios: 'System', android: 'sans-serif' })` 先通过功能验收

---

## 5. AppContext 状态结构

```typescript
// src/store/AppContext.tsx

export type ScreenName =
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05'
  | 'P06' | 'P08' | 'P09' | 'P10' | 'P11';

export type BleState = 'idle' | 'broadcasting' | 'connected';

export interface Account {
  full:  string;   // 完整地址
  short: string;   // 截断地址（显示用）
  path:  string;   // BIP-32 路径
}

// ── 核心新增：待签交易（延迟签名架构，见第7节）──────────────────
export interface PendingTx {
  chain:   'eth' | 'sol';
  type:    'erc20_transfer' | 'eth_transfer' | 'solana_transfer' | 'unknown';
  from:    string;
  to:      string;
  amount:  string;
  gas:     string;
  rawHex:  string;
  resolve: (signedHex: string) => void;
  reject:  () => void;
}

interface AppCtx {
  // Navigation
  current:    ScreenName;
  stack:      ScreenName[];
  go:         (name: ScreenName) => void;
  goBack:     () => void;
  canGoBack:  boolean;

  // Wallet setup
  mnemonicReady:    boolean;
  setMnemonicReady: (v: boolean) => void;
  generatedWords:   string[];
  setGeneratedWords:(w: string[]) => void;
  pin:              string | null;
  setPin:           (p: string) => void;

  // Accounts
  accounts:         { eth: Account[]; sol: Account[] };
  setAccounts:      (a: { eth: Account[]; sol: Account[] }) => void;

  // Current account selection (P10/P11)
  currentChain:     'eth' | 'sol';
  currentAcctIdx:   number;
  setCurrentAccount:(chain: 'eth' | 'sol', idx: number) => void;

  // BLE
  bleState:         BleState;
  setBleState:      (s: BleState) => void;

  // Pending transaction (deferred signing)
  pendingTx:        PendingTx | null;
  setPendingTx:     (tx: PendingTx | null) => void;
}
```

---

## 6. UI 组件规格

所有组件使用 `StyleSheet.create` + `C`/`R` token，对应 prototype 同名组件的视觉行为。

| 组件 | 关键 Props | 对应 prototype |
|------|-----------|----------------|
| `TopBar` | `title`, `onBack?`, `right?`, `bleState?` | `TopBar.tsx` — 固定顶栏，含可选 BLE 状态徽章 |
| `BottomNav` | `active: 'vault'\|'settings'` | `BottomNav.tsx` — 两个 tab：Vault / Settings |
| `Button` | `variant: 'primary'\|'secondary'\|'danger'\|'ghost'\|'outline-danger'`, `icon?`, `onPress` | `Button.tsx` |
| `Card` | `accent?: boolean` | `Card.tsx` — surface-container 背景，accent=左侧 primary 色条 |
| `SectionLabel` | `children` | `SectionLabel.tsx` — 10px uppercase 标签 |
| `BleStatus` | `state: BleState` | `BleStatus.tsx` — idle/broadcasting/connected 状态卡片 |
| `PinDots` | `length: number`, `error?: boolean` | `PinDots.tsx` — 6 个圆点 |
| `PinPad` | `onComplete: (pin: string) => void`, `onReset?: () => void` | 3×4 数字键盘 |

---

## 7. 延迟签名架构（关键设计决策）

### 现状问题

当前实现在收到 APDU 时立即签名，然后导航到 P11 作为"回执"屏幕。这意味着用户看到签名请求时，签名**已经发出**，P11 的"确认/拒绝"按钮没有实际意义。

### 目标行为（与 prototype P11 对齐）

```
OKX 发送 sign APDU
        ↓
BLE Layer 收到 onApduReceived
        ↓
APDU handler 识别为签名指令
        ↓
解析交易数据（链、金额、接收方 等）
        ↓
创建 PendingTx { raw, decoded, resolve, reject }
存入 AppContext.pendingTx
        ↓
navigate('P11')    ← 此时签名尚未发出
        ↓
TransactionScreen 展示 decoded 字段
        ↓
用户点击「Confirm & Sign」
  → 调用 crypto 签名
  → BleModule.sendApduResponse(signature)
  → pendingTx.resolve(signature)
  → navigate back to P10

用户点击「Reject」
  → BleModule.sendApduResponse('6985')
  → pendingTx.reject()
  → navigate back to P10
```

### APDU Handler 修改

`@iron-vault/apdu` 的 `handleApdu` 需要支持"延迟模式"：

```typescript
// packages/apdu/src/handler.ts

// 注入延迟签名回调
let _requestSignature: ((tx: PendingTxData) => Promise<string>) | null = null;
export function setSignatureRequestHandler(
  fn: (tx: PendingTxData) => Promise<string>
) { _requestSignature = fn; }

// 在 ETH/Solana 签名 APDU 中：
// 不直接签名，而是 await _requestSignature(decodedTx)
// 返回值为签名 hex（由 TransactionScreen confirm 后触发）
```

`AccountDetailScreen` 注册：

```typescript
setSignatureRequestHandler(async (tx) => {
  return new Promise((resolve, reject) => {
    setPendingTx({ ...tx, resolve, reject });
    go('P11');
  });
});
```

---

## 8. 导航流映射

对应 `docs/design/screens/navigation-flows.md`：

| 流程 | 路径 |
|------|------|
| A — 创建钱包 | P01 → P02 → P03 → P04 → P06 |
| B — 导入钱包 | P01 → P05 → P04 → P06 |
| C — 冷启动解锁 | P09 → P06 |
| D — 连接 OKX | P06 → (ConnectSheet) → P10 |
| E — 签名交易 | P10(BLE broadcasting) → P11 → P10 |
| F — 查看助记词备份 | P08 → P02 |
| G — 重置钱包 | P08 → P01 |

### 启动判断逻辑（App.tsx）

```typescript
// 启动时根据存储状态决定初始屏幕
const initialScreen = (): ScreenName => {
  if (!mnemonicReady) return 'P01';    // 全新设备
  if (!pin)          return 'P09';    // 有钱包但未解锁
  return 'P06';                        // 已解锁
};
```

---

## 9. Screen 实现规格

### P01 — WelcomeScreen

- logo 区（lock icon + ping 动画绿点）
- 标题 "OldPhone Wallet" + primary 高亮
- "Create New Wallet" → P02（生成助记词流程）
- "Import Existing Wallet" → P05（导入流程）
- 底部安全信息卡片

### P02 — GenerateMnemonicScreen

- TopBar "Backup Seed Phrase"
- 红色警告条（永远不要截图/分享）
- 2列 grid 展示 12 个单词（序号 + 单词）
- "I've Written It Down" → P03

### P03 — VerifyMnemonicScreen

- TopBar "Verify Seed Phrase"
- 乱序单词列表，用户按正确顺序点击确认
- 全部正确 → P04

### P04 — SetPinScreen

- 无 TopBar（全屏 PIN 输入）
- PinDots（6 位）+ PinPad
- 两阶段：设置 → 确认
- 不一致时显示红色错误状态
- 完成 → `storeMnemonic` + navigate P06

### P05 — ImportMnemonicScreen

- TopBar "Import Wallet"
- 多行文本输入（空格分隔 BIP-39 单词）
- 实时验证（无效时红色提示）
- 确认 → P04（设置 PIN）

### P06 — WalletManagerScreen

- TopBar "Vault"（无返回，右侧设置图标 → P08）
- Ethereum 区块 + Solana 区块
- 每个链：账户列表（短地址 + 路径）+ "Connect" 按钮
- Connect 按钮 → ConnectSheet（底部弹出 OKX 连接指引）
- 账户点击 → P10
- BottomNav
- BLE 状态卡片（当 bleState !== idle 时显示）

### P08 — SettingsScreen

- TopBar "Settings"
- Security section: Change PIN / Backup Seed Phrase / Auto-lock
- Bluetooth section: Device Name
- About section: Version / Updates
- 底部红色 "Reset Wallet" 按钮（Alert 二次确认 → clearMnemonic → P01）

### P09 — PinUnlockScreen

- 全屏 PIN 输入
- Lock 图标 + "Enter PIN to unlock"
- PinDots + PinPad
- 正确 → P06；连续 5 次错误 → 30 分钟锁定提示

### P10 — AccountDetailScreen

- TopBar `{Chain} Account {n}` + BLE 状态徽章
- 地址卡片（完整地址 + 复制按钮 + BIP32 路径）
- BleStatus 组件（idle/broadcasting/connected）
- 活动日志（BLE 事件滚动列表）
- "Start Accepting Transactions" / "Stop" 按钮
- BottomNav
- **BLE 事件在此订阅**（onApduReceived → handleApdu → 若为签名指令 → setPendingTx + go('P11')）

### P11 — TransactionScreen

- TopBar "Sign Request"（无返回，防止误退）
- 来源标识（"From OKX" 绿色徽章）
- 交易详情 Card（Network / Action / From / To / Amount / Gas）
- Raw Hex Data 可折叠面板
- 红色警告条
- 底部固定操作栏：Reject（outline-danger）+ Confirm & Sign（primary，flex-2）
- 签名完成 → 成功态（绿色 check + "Signed" → 返回 P10）

---

## 10. 与 Prototype 的差异说明

| 差异点 | Prototype 行为 | Mobile 行为 | 原因 |
|--------|--------------|-------------|------|
| 数据来源 | 硬编码 mock 地址 | 实时从 crypto 层派生 | 真实实现 |
| BLE 状态 | setTimeout 模拟 | 真实 BleModule 事件 | 真实实现 |
| 签名流程 | 点击即完成 | 延迟签名架构 | 安全性 |
| 字体 | Space Grotesk + Manrope（web font） | 同名字体文件或降级 | 平台限制 |
| CSS 动画 | `animation: ping` | `Animated.loop` | 平台限制 |
| position: fixed | TopBar/BottomNav | SafeAreaView + absolute | RN 布局模型 |

---

## 11. 里程碑映射

| 里程碑 | 目标 | 涉及文件 |
|--------|------|---------|
| **M1** | 助记词管理 UI 完整 | P01/P02/P03/P04/P05, AppContext, PinPad, PinDots |
| **M2** | 钱包主页 + ETH 账户 | P06/P10/P11, WalletManager, AccountDetail, Transaction, 延迟签名架构 |
| **M3** | Solana 支持 + Settings | P08, Solana chain section in P06 |
| **M4** | iOS BLE 外设模式 | `ios/BleModule.swift`, `BleModuleBridge.m` |
| **M5** | 安全加固 | PIN 锁定计时器, FLAG_SECURE (Android), isSecureTextEntry (iOS) |
| **M6** | MVP 发布 | 端到端测试 x20, 压力测试, IPA + APK |

---

## 12. 开发工作流

```bash
# 启动 Metro + Android 设备
cd apps/mobile
pnpm start           # Metro bundler
pnpm android         # 安装到 Android 设备

# 共享包热更新（monorepo 内修改 packages/ 即时生效）
# packages/apdu 和 packages/crypto 通过 pnpm workspace 软链接

# 查看 prototype 参考
# http://localhost:3002  （prototype）
# http://localhost:3001  （BLE debugger）
```

---

## 13. 风险与注意事项

1. **延迟签名需要 `@iron-vault/apdu` 改造** — handler 目前同步签名，需引入 async callback 注入模式，不破坏现有 CLI/debugger 使用方式。

2. **fonts 加载** — Space Grotesk / Manrope 需要 `react-native link` 或手动 `Info.plist` 配置，MVP 阶段可用系统字体降级，M5 前完成字体集成。

3. **packages/theme 主色更新** — `#1A73E8` → `#8FC322` 会影响 `apps/debugger` 和任何使用 `@iron-vault/theme` 的地方；debugger 目前有自己的 tailwind 配置，不受影响。

4. **iOS BLE peripheral mode** — `CBPeripheralManager` 在后台切换时会被系统暂停广播，需要 `CBPeripheralManagerOptionRestoreIdentifierKey` 支持状态恢复。
