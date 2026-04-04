# Component: Connect OKX Sheet

**Type:** Bottom Sheet Overlay
**Triggered from:** `wallet-manager`

## Purpose
Guide the user through connecting OKX to the device as a Ledger hardware wallet. Shows BLE broadcasting state while OKX scans.

## Layout

```
┌─────────────────────────┐
│ (dim backdrop)           │
│                         │
│ ┌─────────────────────┐ │
│ │ 🔗 连接 OKX 导入账户  │ │  ← Sheet title
│ │                     │ │
│ │ [● 广播中... 等待OKX连接]│ │  ← BLE status (blue, pulsing)
│ │                     │ │
│ │ 1  在 OKX 中点击「钱包」→「添加钱包」│
│ │ 2  选择「硬件钱包」→「Ledger」│
│ │ 3  选择 Ethereum 链  │ │  ← Chain name is dynamic
│ │ 4  找到设备Nano X，点击连接│
│ │                     │ │
│ │ 将要导入的账户：       │ │
│ │ Account 1: 0x9858...│ │  ← Monospace preview
│ │ m/44'/60'/0'/0/0    │ │
│ │                     │ │
│ │ [        关闭       ]│ │  ← Danger outline button
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Animation
- Sheet slides up (`slideUp` 300ms ease)
- BLE dot pulses (1.5s infinite)

## States
- Chain name (Ethereum or Solana) is set dynamically from which 连接 OKX was tapped
- Account preview list matches the selected chain

## Dismiss
- Tap backdrop
- Tap 关闭 button
