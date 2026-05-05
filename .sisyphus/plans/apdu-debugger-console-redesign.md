# APDU Debugger & Transaction Console — 重构计划

## 概述

将当前 `apps/website` 的 `/debugger` 页面拆分为两个独立页面，定位清晰化：

| 页面 | 路由 | 目标用户 | 核心价值 |
|------|------|---------|---------|
| **APDU 教育工具** | `/debugger` | 协议开发者 / 学习者 | 可视化 APDU 每一层，理解底层原理 |
| **交易控制台** | `/console` | 钱包用户 | 构建真实交易，连接手机签名 |

两条路线共享同一套传输基础设施（Simulator / BLE），并在底层互通——用户可以在控制台构造交易，切到 APDU 视图查看对应的原始 hex。

---

## 当前资产盘点

### 可直接复用的模块

| 模块 | 位置 | 用途 | 当前状态 |
|------|------|------|---------|
| APDU 协议引擎 | `packages/apdu/src/handler.ts` → `handleApdu()` | 核心 APDU 处理 | ✅ 已完成 |
| APDU 十六进制解析 | `packages/apdu/src/parser.ts` → `parseApdu()` | hex → CLA/INS/P1/P2/Data | ✅ 已完成 |
| APDU 链处理器 | `packages/apdu/src/handlers/{eth,sol,btc,tron,sui}.ts` | 各链签名逻辑 | ✅ 已完成 |
| 延迟签名模式 | `packages/apdu/src/handlers/shared.ts` → `maybeDeferred()` | 用户确认签名模式 | ✅ 已完成 |
| 模拟器桥 | `packages/simulator/src/lib/apdu-bridge.ts` | injectApdu → handleApdu + sign confirm | ✅ 已完成 |
| 钱包模拟器 | `packages/simulator/src/components/WalletSimulator.tsx` | 浏览器内手机 UI 模拟 | ✅ 已完成 |
| BLE 传输 | `apps/website/lib/ble-transport.ts` | Web Bluetooth 连接 + 帧封装 | ✅ 已完成 |
| BLE 状态机 | `apps/website/hooks/useBleDevice.ts` | BLE 连接生命周期 | ✅ 已完成 |
| APDU 总线 | `apps/website/lib/apdu-bus.ts` | 命令发送 ↔ 响应路由 | ✅ 但需扩展 |
| 预设命令 (16条) | `apps/website/components/debugger/CommandBuilder.tsx` | 教学素材 | ✅ 需提取为共享模块 |
| BLE 帧编解码 | `apps/website/lib/ble-transport.ts` lines 12-53 | 帧封装演示素材 | ✅ 需提取为共享模块 |
| TX/RX 日志 | `apps/website/components/debugger/ApduLog.tsx` | 命令日志 | ✅ 需增强 |
| ETH RLP 解码 | `packages/apdu/src/handlers/eth.ts` → `decodeEthTx()` | 交易字段解析 | ✅ 已完成 |
| 三栏布局 | `apps/website/components/layout/DebuggerLayout.tsx` | 页面骨架 | ✅ 可直接用 |

---

## 实施步骤

计划分 5 个阶段，建议按顺序执行。

---

## 阶段一：共享模块提取（底层基础设施）

目标：将当前散落在 `apps/website` 中的可复用逻辑抽取到 `packages/apdu`，建立共享资产。

### 1.1 APDU 预设提取

**文件：** `packages/apdu/src/presets.ts`（新建）

从 `CommandBuilder.tsx` 提取 16 条预设，整理为结构化数据，增加字段注释：

```typescript
export interface ApduPreset {
  label: string          // 人类可读名称
  hex: string            // APDU 十六进制字符串
  group: string          // System / Ethereum / Solana / Bitcoin / Tron / Sui
  chain: string          // 目标链
  description: string    // 简短说明（新增）
  fields: {              // 预解析的字段（新增）
    cla: string
    ins: string
    insName: string      // 指令名称（如 GET_VERSION）
    p1: string
    p2: string
    dataDescription: string  // 数据内容说明
  }
  references?: string[]  // 指向 app-*/APDU.md 的链接
}

export const APDU_PRESETS: ApduPreset[] = [...]
```

每条预设增加 `references` 字段，链接到 Ledger 官方开源仓库的对应文档。

**涉及改动：** 新建 `packages/apdu/src/presets.ts`，更新 `packages/apdu/src/index.ts`。

### 1.2 BLE 帧编解码提取

**文件：** `packages/apdu/src/ble-framing.ts`（新建）

从 `apps/website/lib/ble-transport.ts` 提取帧编码/解码逻辑，补全注释和类型：

```typescript
export interface BleFrame {
  channel: number[]
  tag: number
  seq: number
  totalLen?: number     // 仅首帧存在
  data: Uint8Array
}

export function frameAPDU(apdu: Uint8Array): Uint8Array[]   // APDU → BLE 包序列
export function unframeResponse(chunks: Uint8Array[]): Uint8Array  // BLE 包序列 → 响应
export function describeFrames(packets: Uint8Array[]): BleFrame[]  // 新增：解析每个包的结构
```

`describeFrames()` 是新增函数，将 raw BLE 包解析为结构化帧描述，用于教育工具的帧可视化面板。

**涉及改动：** 新建 `packages/apdu/src/ble-framing.ts`，更新 `packages/apdu/src/index.ts`，修改 `apps/website/lib/ble-transport.ts` 改为从 apdu 包导入 `frameAPDU`/`unframeResponse`。

### 1.3 APDU 字段解释器

**文件：** `packages/apdu/src/apdu-explainer.ts`（新建）

从 presets 和 parser.ts 组合出字段级解释能力：

```typescript
export interface ApduFieldBreakdown {
  raw: string
  cla: { hex: string; meaning: string }
  ins: { hex: string; name: string; meaning: string }
  p1:  { hex: string; meaning: string }
  p2:  { hex: string; meaning: string }
  lc:  { hex: string; value: number }
  data: { hex: string; ascii: string; description: string }
}

export function explainApdu(hex: string): ApduFieldBreakdown
export function decodeStatusWord(sw: string): { code: string; name: string; meaning: string }
export function getInsName(cla: string, ins: string, chain?: string): string
export function chainFromCla(cla: string): string  // 0xE1→Bitcoin, 0x14→Tron, 0x07→Sui
```

SW 解码表参考 Ledger 官方 `docs/APDU.md` 中的状态字定义。

### 1.4 共享指令常量

**文件：** `packages/apdu/src/constants.ts`（新建）

APDU 指令常量表，供 handlers 和 builders 共同引用，保证编码一致性：

```typescript
// 链标识
export type ChainId = 'ethereum' | 'solana' | 'bitcoin' | 'tron' | 'sui'

// CLA 常量
export const CLA = {
  APP:     0xE0,   // 通用 Ledger 应用命令
  GLOBAL:  0xB0,   // 全局命令
  BTC:     0xE1,   // Bitcoin New App
  TRON:    0x14,   // Tron App
  SUI:     0x07,   // Sui App
  CONTINUE: 0xF8,  // BTC CONTINUE 协议
} as const

// 通用 INS 常量
export const INS = {
  GET_VERSION:         0x01,
  GET_APP_AND_VERSION: 0x01,   // CLA B0
  // ETH
  ETH_GET_ADDRESS:     0x02,
  ETH_SIGN_TX:         0x04,
  ETH_SIGN_MSG:        0x08,
  ETH_SIGN_EIP712:     0x0C,
  // SOL
  SOL_GET_PUBKEY:      0x05,
  SOL_SIGN_MSG:        0x04,
  SOL_SIGN_TX:         0x06,
  // BTC
  BTC_GET_XPUB:        0x00,
  BTC_SIGN_PSBT:       0x04,
  BTC_CONTINUE:        0x01,   // CLA F8
  // TRON
  TRON_GET_PUBKEY:     0x02,
  TRON_SIGN_TX:        0x04,
  // SUI
  SUI_GET_PUBKEY:      0x02,
  SUI_SIGN_TX:         0x03,
} as const

// P1 常量
export const P1 = {
  FIRST_CHUNK:  0x00,  // 首帧（含 BIP32 路径）
  MORE_CHUNKS:  0x80,  // 续帧
  LAST_CHUNK:   0x90,  // 末帧
  SIGN_HASH:    0x00,  // ETH 签名模式
} as const

// 状态字
export const SW = {
  OK:                      '9000',
  DENY:                    '6985',  // 用户拒绝
  WRONG_P1P2:              '6A86',
  WRONG_DATA_LENGTH:       '6A87',
  INS_NOT_SUPPORTED:       '6D00',
  CLA_NOT_SUPPORTED:       '6E00',
  INTERRUPTED_EXECUTION:   'E000',  // BTC CONTINUE
  INTERNAL_ERROR:          '6F00',
} as const

export const CHAIN_INFO: Record<ChainId, { name: string; cla: number; appName: string }> = {
  ethereum: { name: 'Ethereum',  cla: CLA.APP,  appName: 'Ethereum' },
  solana:   { name: 'Solana',    cla: CLA.APP,  appName: 'Solana' },
  bitcoin:  { name: 'Bitcoin',   cla: CLA.BTC,  appName: 'Bitcoin' },
  tron:     { name: 'Tron',      cla: CLA.TRON, appName: 'Tron' },
  sui:      { name: 'Sui',       cla: CLA.SUI,  appName: 'Sui' },
}
```

**涉及改动：** 新建 `packages/apdu/src/constants.ts`，更新 `packages/apdu/src/index.ts`。后续所有 handler 和 builder 都从此文件引用常量，而非硬编码 `0xe0`/`0x02`/`0x00` 等数值。

### 1.5 传输抽象接口

**文件：** `apps/website/lib/transport.ts`（新建）

统一传输抽象放在 `apps/website/lib/`（而非 `packages/apdu`），因为传输层是平台相关的（Web Bluetooth、React 组件通信）：

```typescript
export interface ApduTransport {
  exchange(hex: string): Promise<string>
  isConnected(): boolean
  onDisconnect(cb: () => void): () => void
}

// 模拟器传输：包装 SimulatorBridge
export function createSimulatorTransport(bridge: SimulatorBridge): ApduTransport

// BLE 传输：包装 Web Bluetooth
export function createBleTransport(bleLog: BleLogFn): Promise<ApduTransport>
```

**设计理由（来自 Oracle 审阅）：**
- `packages/apdu` 必须保持平台无关（AGENTS.md 约定）
- `packages/simulator` 是设备模拟器（处理 APDU），而非传输层（发送 APDU）
- Web Bluetooth API (`navigator.bluetooth`) 只存在于浏览器上下文
- 传输只需定义 `exchange(apdu: Uint8Array): Promise<Uint8Array>` 协议

**涉及改动：** 新建 `apps/website/lib/transport.ts`；`apps/website/lib/ble-transport.ts` 修改为导入 BLE 帧编解码并从 `@iron-vault/apdu` 导出 `createBleTransport`。

### 1.6 更新 `packages/apdu/package.json`

新增依赖：无需新增（纯逻辑）。确保 `ble-framing.ts` 和 `constants.ts` 无平台依赖。

**验证方式：** `pnpm exec tsc --noEmit -p packages/apdu/tsconfig.json`

---

## 阶段二：APDU 教育工具改造（`/debugger`）

目标：将当前 debugger 改造为面向协议学习者的教育工具，保留所有现有功能并增强可视化。

### 页面布局

```
┌──────────────┬──────────────────────────────────────────────┐
│  侧边栏       │  主区域                                        │
│  (导航)       │                                                │
│              │  ┌──────────────────────────────────────────┐  │
│              │  │  标签切换: 预设 / 手动 / 命令目录 / 帧演练  │  │
│              │  ├──────────────────────────────────────────┤  │
│              │  │                                          │  │
│              │  │    [预设面板]                              │  │
│              │  │    系统: GET_VERSION (0xE001...)          │  │
│              │  │    ┌──────────────────────────────┐      │  │
│              │  │    │ CLA │ INS  │ P1 │ P2 │ LC │ Data │      │  │
│              │  │    │ E0  │ 01   │ 00 │ 00 │ 00 │ —    │      │  │
│              │  │    │     │ GET_ │    │    │    │      │      │  │
│              │  │    │     │ VER  │    │    │    │      │      │  │
│              │  │    └──────────────────────────────┘      │  │
│              │  │    [BLE 帧可视化]                          │  │
│              │  │    包0: 01 01 05 00 00 00 05 E0 01 ...   │  │
│              │  │    包1: 01 01 05 00 01 [20 bytes]        │  │
│              │  │  ─────────────────────────────────────    │  │
│              │  │    TX/RX 日志 (增强)                       │  │
│              │  │    → E001000000 (GET_VERSION)             │  │
│              │  │    ← 010203...9000  ✅ Success             │  │
│              │  └──────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

### 2.1 改造 CommandBuilder → Tier1ApduInput

**文件：** `apps/website/components/debugger/Tier1ApduInput.tsx`（重写 `CommandBuilder.tsx`）

功能：
- 四标签切换：**预设** | **手动** | **命令目录** | **帧演练**
- 保留原有的 TargetToggle（Simulator / BLE）
- 预设模式：从 `packages/apdu/presets.ts` 导入预设，选中后自动显示字段分解
- 手动模式：输入 hex 时实时解析字段（调用 `explainApdu()`）
- 命令目录模式：从 `packages/apdu/docs/` 生成 INS 列表，点击填充 hex
- 帧演练模式：选中多帧命令（如 ETH SIGN_TX），逐步发送每一帧

### 2.2 新建 Tier1FieldTable

**文件：** `apps/website/components/debugger/Tier1FieldTable.tsx`

展示 APDU 字段分解表：

| 字段 | Hex | 含义 |
|------|-----|------|
| CLA | `E0` | Application class — Ledger app command |
| INS | `01` | GET_VERSION — Get app version info |
| P1 | `00` | Not used |
| P2 | `00` | Not used |
| Lc | `00` | No data payload |
| Data | — | Empty |

点击 INS 时弹出说明浮层，显示该指令在 Ledger 官方文档中的定义。每条指令有 `references` 链接跳转到 GitHub App 仓库的对应 APDU 文档。

### 2.3 新建 Tier1BleFrames

**文件：** `apps/website/components/debugger/Tier1BleFrames.tsx`

BLE 帧可视化面板。当选中一个 APDU 命令时，调用 `describeFrames(frameAPDU(hexBytes))` 并渲染为折叠式帧列表：

```
📦 BLE 传输 (MTU=20) — 共 3 帧

[帧 0]  首帧  序号=0  总长=70
        01 01 05 00 00 00 46 E0 04 00 00 46 05 80 ...
        ───────────────────┬── ──────────┬─────────
        信道=0x0101  tag=05  头部(7B)     数据(22B)

[帧 1]  续帧  序号=1
        01 01 05 00 01 [20 bytes data]
        ──────────────┬─ ──────────
        信道=0x0101   头部(5B)  数据(20B)

[帧 2]  续帧  序号=2
        01 01 05 00 02 [20 bytes data]
```

### 2.4 新建 Tier1InsCatalog

**文件：** `apps/website/components/debugger/Tier1InsCatalog.tsx`

按链分组的 INS 命令目录。数据源来自 `packages/apdu/docs/` 中的文档。每个命令展示：

| INS | 名称 | CLA | 说明 | 链接到 Ledger 源码 |
|-----|------|-----|------|-------------------|
| 0x02 | GET_ETH_ADDRESS | E0 | 获取以太坊地址 | [app-ethereum →](...) |
| 0x04 | SIGN_ETH_TX | E0 | 签名以太坊交易 | [app-ethereum →](...) |

点击命令自动填充到手动输入区。

### 2.5 增强 ApduLog

**文件：** `apps/website/components/debugger/ApduLog.tsx`（修改）

增强现有日志组件：
- 状态字自动解码（调用 `decodeStatusWord()`）
- 响应耗时显示
- 点击日志条目标记时展开字段分解
- 支持日志导出（copy as text / copy as Ledger Live log format）

### 2.6 保留 SimulatorPanel

**文件：** `apps/website/components/simulator/SimulatorPanel.tsx`（微调）

保持现有功能不变，仅做适配：
- 改为使用 `SimulatorTransport` 替代直接调用 `apdu-bus`
- 签名确认弹窗保留

**验证方式：** `pnpm --filter website dev` 查看 `/debugger` 页面功能完整。

---

## 阶段三：传输层增强

### 3.1 扩展 apdu-bus（仅教育工具使用）

**文件：** `apps/website/lib/apdu-bus.ts`（修改）

当前 `apdu-bus.ts` 是单请求 Zustand store，服务于教育工具的 CommandBuilder ↔ SimulatorPanel 解耦。console 页面**不使用** apdu-bus（直接调用 `transport.exchange()`）。

教育工具需要的增强：

```typescript
// 新增：序列化发送（用于多帧回放）
dispatchSequence(hexes: string[], intervalMs?: number): Promise<string[]>

// 保持现有（教育工具仍需要）：
dispatch(hex: string): Promise<string>
resolve(id: string, responseHex: string): void
reject(id: string, reason: string): void
```

**设计理由（来自 Oracle 审阅）：**
- apdu-bus 解决了布局解耦问题（左侧 CommandBuilder ↔ 右侧 SimulatorPanel），教育工具仍然是三栏布局，需要保留
- console 是线性工作流：选链 → 填表单 → 发送 → 拿结果，一个组件内完成，不需要 pub/sub
- 请求队列对 console 无意义——真实 BLE 会话天然串行（一发一收）
- `dispatchSequence()` 专为"帧演练"模式设计：自动按时间间隔发送多帧命令

### 3.2 TransportContext（跨页面共享传输实例）

**文件：** `apps/website/lib/TransportContext.tsx`（新建）

跨页面保持同一份传输实例的 React Context：

```typescript
interface TransportContextValue {
  transport: ApduTransport
  target: 'simulator' | 'ble'
  setSimulator(): void
  setBle(deviceName?: string): Promise<void>
  disconnect(): void
}
```

路由切换时 TransportContext 保持 mount，传输连接不丢失。

**清理钩子：** `useApduCleanup` — 页面卸载时调用 `resetSharedState()`，防止全局 S 对象状态泄漏：

```typescript
export function useApduCleanup() {
  useEffect(() => {
    return () => { resetSharedState() }
  }, [])
}
```

### 3.3 ESLint 防护

新增 `no-restricted-imports` 规则，阻止 console 页面误导入 apdu-bus：

```json
// apps/website/.eslintrc 或 next.config.mjs
{
  "no-restricted-imports": [{
    "name": "@/lib/apdu-bus",
    "message": "Console page should use transport.exchange() directly, not apdu-bus"
  }]
}
```

---

## 阶段四：交易控制台（`/console`）

目标：新建面向用户的交易构建页面，类似 Ledger Live Web 或 OneKey Playground。

### 页面布局

```
┌──────────────┬──────────────────────────────────────────────┐
│  侧边栏       │  主区域                                        │
│  (导航)       │                                                │
│              │  ┌──────────────────────────────────────────┐  │
│              │  │  链选择: [Ethereum ▼]  [连接: 模拟器 ●]   │  │
│              │  ├──────────────────────────────────────────┤  │
│              │  │  [交易表单]     [设备状态]                 │  │
│              │  │  ┌──────────┐  ┌──────────┐             │  │
│              │  │  │ From:    │  │ 手机状态  │             │  │
│              │  │  │ 0xABC... │  │ 待签名: 1 │             │  │
│              │  │  │ To:      │  │ [拒绝]    │             │  │
│              │  │  │ 0xDEF... │  │ [批准]    │             │  │
│              │  │  │ Value:   │  └──────────┘             │  │
│              │  │  │ 0.001 ETH│                            │  │
│              │  │  │ Gas:     │  [APDU 预览]                │  │
│              │  │  │ 21000    │  E0 04 00 00 46 ...        │  │
│              │  │  │ Nonce:   │                            │  │
│              │  │  │ 1        │                            │  │
│              │  │  │ [签名]     │  [广播]                    │  │
│              │  │  └──────────┘  └──────────┘             │  │
│              │  └──────────────────────────────────────────┘  │
│              │                                                │
│              │  [签名结果]                                      │
│              │  v: 0x...  r: 0x...  s: 0x...                  │
│              │  [复制] [在 Etherscan 查看]                     │
└──────────────┴──────────────────────────────────────────────┘
```

### 4.1 ConsoleLayout

**文件：** `apps/website/components/layout/ConsoleLayout.tsx`（新建）

类似 DebuggerLayout，但增加设备状态栏（固定在右侧）：

```typescript
interface ConsoleLayoutProps {
  left: ReactNode     // 交易表单
  right: ReactNode    // APDU 预览 + 签名确认
  deviceBar: ReactNode // 手机状态
}
```

### 4.2 页面入口

**文件：** `apps/website/app/[locale]/console/page.tsx`（新建）

```typescript
export default function ConsolePage() {
  const [chain, setChain] = useState<ChainId>('ethereum')
  const [transport] = useTransport()
  
  return (
    <ConsoleLayout
      left={
        <>
          <ChainSelector value={chain} onChange={setChain} />
          {chain === 'ethereum' && <EthereumTxForm transport={transport} />}
          {chain === 'solana' && <SolanaTxForm transport={transport} />}
        </>
      }
      right={
        <>
          <TxPreview />
          <TxResult />
        </>
      }
      deviceBar={<DeviceStatusPanel transport={transport} />}
    />
  )
}
```

### 4.3 ChainSelector

**文件：** `apps/website/components/console/ChainSelector.tsx`

下拉框选择 ETH / SOL / BTC / TRON / SUI。切换链时自动更新 `setCurrentApp()`。

### 4.4 DeviceStatusPanel

**文件：** `apps/website/components/console/DeviceStatusPanel.tsx`

基于 `transport` 当前状态展示：
- 未连接 → 显示连接按钮（扫描 BLE 设备）
- 模拟器 → 显示 "模拟器 ● 在线"
- BLE 已连接 → 显示设备名 + RSSI
- 有待签名 → 显示签名弹窗（复用 SimulatorPanel 的 approve/reject 按钮）

使用 `transport.onStateChange()` 监听状态变更。

### 4.5 EthereumTxForm

**文件：** `apps/website/components/console/EthereumTxForm.tsx`

**输入字段：**
- From（只读，从当前账户派生）
- To（地址输入，带 ENS 解析？MVP 不做）
- Value（ETH，可选单位转换）
- Gas Limit（默认 21000）
- Max Priority Fee / Max Fee（EIP-1559）
- Nonce（可选，自动推断）
- Data（hex 输入，可选）

**构建流程：**
```
表单数据 → serializeEthTx()  → 构建 SIGN_ETH_TX APDU hex
         → 显示在 TxPreview
         → 用户点击"签名" → transport.exchange(apduHex)
         → 返回签名 { v, r, s }
         → 显示在 TxResult
```

### 4.6 SolanaTxForm

**文件：** `apps/website/components/console/SolanaTxForm.tsx`

**输入字段：**
- From（只读）
- To（Base58 地址）
- Amount（SOL）
- Memo（可选文本）

**构建流程：**
```
表单数据 → serializeSolTx() → 构建 SIGN_SOLANA_MESSAGE APDU hex
```

### 4.7 交易序列化器

**文件：** `apps/website/lib/ethereum-tx-builder.ts`（新建）

```typescript
export interface EthTxParams {
  to: string
  value: string        // wei hex
  gasLimit: string     // hex
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: string
  data?: string
  chainId: number
}

export function buildEthSignTxApdu(path: string, tx: EthTxParams): string
// 返回 E0 04 P1 P2 Lc [BIP32_PATH] [RLP_ENCODED_TX]
```

**文件：** `apps/website/lib/solana-tx-builder.ts`（新建）

```typescript
export interface SolTxParams {
  to: string
  amount: string
  memo?: string
}

export function buildSolSignMessageApdu(path: string, tx: SolTxParams): string
```

序列化器调用 `@iron-vault/crypto` 中的 RLP 编码等工具函数，生成与 Ledger 协议兼容的 APDU 命令。

### 4.8 TxPreview

**文件：** `apps/website/components/console/TxPreview.tsx`

折叠式面板，显示即将发送的 APDU hex。用户可展开查看字段分解（复用 `Tier1FieldTable` 组件）。

### 4.9 TxResult

**文件：** `apps/website/components/console/TxResult.tsx`

签名成功后的结果展示：
- v / r / s 值
- 签名 hex 全文
- 复制按钮
- "在 Etherscan 查看交易" 链接（通过 RPC 广播）
- 广播按钮（调用公共 RPC 提交交易）

**验证方式：** 在模拟器模式下执行完整签名流程 → 得到签名 → 复制。

### 4.10 Broadcast 功能

**文件：** `apps/website/lib/rpc-broadcast.ts`（新建）

```typescript
export async function broadcastEthTx(signedTx: string, rpcUrl?: string): Promise<string>
// 默认使用公共 RPC，返回 tx hash
```

MVP 阶段可选，先提供签名结果复制功能。

---

## 阶段五：导航整合与收尾

### 5.1 更新导航

**文件：** `apps/website/lib/nav.ts`

在导航结构中新增 "Transaction Console" 条目。

**文件：** `apps/website/components/layout/Sidebar.tsx`

在侧边栏 debugger 链接下方增加 console 链接。

**文件：** `apps/website/app/[locale]/page.tsx`

在首页 footer 和导航栏添加 console 链接。

### 5.2 i18n 更新

**文件：** `apps/website/messages/en.json`、`apps/website/messages/zh.json`

新增 console 相关翻译 key：
- `nav.sections.transactionConsole`
- `console.pageTitle`
- 各表单字段的翻译

### 5.3 旧文件清理

删除不再使用的旧组件：
- `apps/website/components/debugger/CommandBuilder.tsx`（已被 Tier1ApduInput 替代）
- `apps/website/lib/apdu-bus.ts`（已被 apdu-session.ts 替代，保留兼容导出）

### 5.4 验证

```bash
# 类型检查
pnpm exec tsc --noEmit -p packages/apdu/tsconfig.json
pnpm exec tsc --noEmit -p apps/website/tsconfig.json

# 运行网站
pnpm --filter website dev
# 手动验证:
# - /debugger: 预设→字段分解→BLE帧可视化→发送→日志
# - /console: 选链→填表单→APDU预览→签名→结果
# - 两页面切换: 传输状态保持
```

---

## 文件变更汇总

### 新增文件（15 个）

```
packages/apdu/src/presets.ts            # APDU 预设数据
packages/apdu/src/ble-framing.ts        # BLE 帧编解码 + 帧描述
packages/apdu/src/constants.ts          # INS/P1/SW 共享常量 (Oracle 建议)
packages/apdu/src/apdu-explainer.ts     # APDU 字段解释器
packages/apdu/src/builders/eth.ts       # ETH 交易构建器
packages/apdu/src/builders/sol.ts       # SOL 交易构建器

apps/website/components/debugger/Tier1ApduInput.tsx   # 教育工具主面板
apps/website/components/debugger/Tier1FieldTable.tsx   # 字段分解表
apps/website/components/debugger/Tier1BleFrames.tsx    # BLE 帧可视化
apps/website/components/debugger/Tier1InsCatalog.tsx   # 命令目录

apps/website/lib/transport.ts            # ApduTransport 接口 + 工厂函数
apps/website/lib/TransportContext.tsx     # 跨页面传输共享 (Oracle 建议)
apps/website/lib/ethereum-tx-builder.ts   # ETH 交易序列化器 (表单→APDU)
apps/website/lib/solana-tx-builder.ts     # SOL 交易序列化器 (表单→APDU)
apps/website/lib/rpc-broadcast.ts         # RPC 广播

apps/website/components/console/ChainSelector.tsx
apps/website/components/console/EthereumTxForm.tsx
apps/website/components/console/SolanaTxForm.tsx
apps/website/components/console/DeviceStatusPanel.tsx
apps/website/components/console/TxPreview.tsx
apps/website/components/console/TxResult.tsx
apps/website/components/layout/ConsoleLayout.tsx
apps/website/app/[locale]/console/page.tsx


### 修改文件（12 个）

```
packages/apdu/src/index.ts               # 新增导出 (presets, ble-framing, constants, builders)
packages/apdu/src/handlers/shared.ts      # 可能的微调（使用 constants 替换硬编码值）

apps/website/lib/ble-transport.ts         # 改为从 @iron-vault/apdu 导入帧编解码
apps/website/lib/apdu-bus.ts              # 新增 dispatchSequence() 用于多帧回放
apps/website/components/debugger/ApduLog.tsx   # 增强状态字解码

apps/website/lib/nav.ts                   # 添加 console 导航
apps/website/components/layout/Sidebar.tsx      # 添加 console 链接
apps/website/app/[locale]/page.tsx        # 添加 console 链接
apps/website/app/[locale]/debugger/page.tsx     # 更新导入路径

apps/website/messages/en.json             # i18n
apps/website/messages/zh.json             # i18n
apps/website/components/simulator/SimulatorPanel.tsx  # 适配新传输
```

### 删除文件（1 个——移入历史）

```
apps/website/components/debugger/CommandBuilder.tsx   # 被 Tier1ApduInput 替代
```

注：`apdu-bus.ts` 保留（教育工具仍需要），console 页面直接从 `transport.exchange()` 调用。

---

## 关键设计决策

### D1: 传输抽象放在 apps/website/lib

原因：
- `packages/apdu` 必须保持平台无关——Web Bluetooth 的 `navigator.bluetooth` 只存在于浏览器上下文
- `packages/simulator` 是设备模拟器（处理 APDU），不是传输层
- 传输抽象定义 `exchange(apdu: Uint8Array): Promise<Uint8Array>`，这是一个纯协议接口
- BLE 帧编解码（`frameAPDU`/`unframeResponse`）提取到 packages/apdu，因为它是纯逻辑、无平台依赖
- 传输连接管理（`connectLedgerBle`、`scanDevices`）保留在 apps/website，因为它是平台 API

### D2: apdu-bus 仅教育工具使用

原因：
- `apdu-bus` 解决了教育工具的布局解耦问题（左侧 CommandBuilder ↔ 右侧 SimulatorPanel）
- console 页面是线性工作流，不需要 pub/sub，直接调用 `transport.exchange()`
- 加 ESLint `no-restricted-imports` 防止 console 误导入 apdu-bus

### D3: BLE 帧编解码提取到 packages/apdu

原因：
- `frameAPDU`/`unframeResponse` 是纯函数（`Uint8Array → Uint8Array[]`），零平台依赖
- 教育工具的核心功能就是展示帧封装过程，需要导入这些函数在浏览器中可视化
- 当前它们被埋藏在 `ble-transport.ts` 的扫描/连接代码中，职责分离不清晰
- AGENTS.md 说 "packages/apdu — APDU framing only; no BLE transport"——帧编解码属于 APDU 传输帧协议，不属于 BLE 传输层（GATT 连接）

**只提取：** `frameAPDU`, `unframeResponse`, `describeFrames`, `CHANNEL`, `TAG`, `MTU` 常量
**不提取：** `scanDevices`, `connectLedgerBle`, `BleTransport`, `toHex`, `fromHex`（保留在 website）

### D4: 交易构建器放在 packages/apdu/src/builders/

原因：
- handlers 已编码了 APDU 结构知识（CLA/INS/P1/P2/Lc 编码规则、BIP32 路径格式）
- builders 是 handlers 的逆函数：给定结构化输入 → 生成正确的 APDU hex
- 放在同一包保证编码同步——改 handler 必须改 builder
- builders 是纯函数：`(Chain, TxParams) → { apdu: string, chunks: string[] }`，零平台依赖
- 共享常量文件（`constants.ts`）确保 handlers 和 builders 引用同一组 INS/P1 值

### D5: 保留全局单例模式（不重构 shared.ts）

原因：
- `S` 对象在 `shared.ts` 中有 6 个签名 session 槽位、4 个全局 provider、缓存 seed 状态——深度嵌入每个 handler
- 改为实例化需触碰每个 handler 文件和所有调用点（mobile + web），回归风险高，零用户收益
- 同一浏览器 tab 不存在多个并发的 wallet session
- `createSimulatorBridge` 已提供类实例外观
- 每页面在 unmount 时调用 `resetSharedState()` 防止状态泄漏

### D6: Console 会话模式

console 页面创建 `useConsoleSession` hook，镜像 `useBleSession`（mobile app）的模式：

```typescript
function useConsoleSession(chain: ChainId, mnemonic: string) {
  useEffect(() => {
    setMnemonicProvider(() => Promise.resolve(mnemonic))
    setCurrentApp(CHAIN_APP_NAME[chain])
    setSignRequestHandler(async (req) => {
      // 存储 pendingSign → console 展示签名确认弹窗
      return new Promise(resolve => {
        setPendingTx({ ...req, resolve, reject: () => resolve('6985') })
      })
    })
    return () => { resetSharedState() }
  }, [chain, mnemonic])

  const send = useCallback(async (hex: string) => {
    return transport.exchange(hex)
  }, [transport])

  return { send, pendingTx, approve, reject }
}
```

---

## 工作量评估

| 阶段 | 文件数 | 预估工作量 | 依赖 |
|------|--------|-----------|------|
| 阶段一：共享模块 | 4 新建 + 2 修改 | 中等 | 无 |
| 阶段二：教育工具 | 4 新建 + 2 修改 | 大 | 阶段一 |
| 阶段三：传输增强 | 2 新建 + 1 修改 | 中 | 阶段一 |
| 阶段四：交易控制台 | 8 新建 + 1 修改 | 大 | 阶段三 |
| 阶段五：导航与收尾 | 0 新建 + 4 修改 | 小 | 阶段二+四 |

全部完成预估：**5-8 天**（单人开发）。

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| `packages/apdu` 的全局 S 对象状态管理方式不适合多 session | 保留单例模式，每页面 unmount 时 `resetSharedState()` |
| ETH RLP 交易序列化复杂度高（EIP-1559、ERC-20 等）| MVP 仅支持基础 ETH 转账，EIP-1559 优先级可选 |
| Web Bluetooth 兼容性有限（仅 Chrome/Edge）| Simulator 模式作为默认且可靠的备选 |
| 多帧命令（BTC PSBT）的 UI 交互复杂 | MVP 仅支持单帧命令，多帧放入 Tier1 的帧演练模式 |
| apdu-bus 被 console 页面误导入（Zustand 状态冲突）| ESLint `no-restricted-imports` 规则拦截 |
| 页面切换（/debugger ↔ /console）时全局 S 状态泄漏 | `useApduCleanup` hook → unmount 时 `resetSharedState()` |
| Builder 与 Handler 的 INS/P1 值不同步 | 共享 `constants.ts`，builder 和 handler 都引用同一份常量 |
