# Screen: Account Detail

**Route ID:** `account-detail`

## Purpose
Show a specific account and control BLE broadcasting. This is the primary BLE interaction screen — the phone acts as a Ledger peripheral here.

## Layout

```
┌─────────────────────────┐
│ ‹  Ethereum 账户 1      │
│                         │
│ ┌─────────────────────┐ │
│ │       [Ethereum]    │ │  ← Chain badge (colored pill)
│ │  0x9858EfC427...    │ │  ← Full address (monospace)
│ │  m/44'/60'/0'/0/0   │ │  ← Derivation path
│ │     📋 复制地址      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ●  BLE 未启动        │ │  ← BLE status card
│ │    点击下方按钮开始   │ │
│ └─────────────────────┘ │
│                         │
│ [Activity log]          │  ← Hidden when idle
│                         │
│  点击下方按钮后，手机将作为硬件钱包│
│  接受来自 OKX 的交易签名请求│
│                         │
│  ┌───────────────────┐  │
│  │    开始接受交易    │  │  ← Changes based on BLE state
│  └───────────────────┘  │
└─────────────────────────┘
```

## BLE Status Card States

| State | Card Style | Dot | Title | Sub |
|-------|-----------|-----|-------|-----|
| `idle` | `card` bg | gray | BLE 未启动 | 点击下方按钮开始 |
| `broadcasting` | `primary/10` bg, `primary/30` border | blue (pulsing) | 广播中... | 等待 OKX 连接 |
| `connected` | `green/10` bg, `green/30` border | green (solid) | 已连接 | OKX (MAC address) |

## Button States
| BLE State | Button Text | Button Style |
|-----------|-------------|--------------|
| `idle` | 开始接受交易 | `primary` |
| `broadcasting` | 停止 | `red` |
| `connected` | 停止 | `red` |

## Activity Log
- Visible when BLE state is `broadcasting` or `connected`
- Max height 140px, scrollable
- Each line: `[time]  [icon]  [message]`
- Auto-scrolls to bottom on new entry

## Simulated BLE Flow
1. Tap 开始接受交易 → state: `broadcasting`, log: 📶 BLE 广播已启动
2. After 2s → state: `connected`, log: 🟢 已连接: OKX, 📱 钱包识别, 🔑 查询地址
3. After 2s → log: ✍️ 收到签名请求! → navigate to `transaction-confirm`

## Navigation
- **Back** → `wallet-manager`
- **Sign request received** → `transaction-confirm` (auto)
