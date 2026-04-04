# Screen: Transaction Confirm

**Route ID:** `transaction-confirm`

## Purpose
Display incoming transaction details for user review and approval/rejection. This is the critical security screen.

## Layout — Default State

```
┌─────────────────────────┐
│  📝 签名请求             │  ← No back button
│                         │
│  [● 来自 OKX]           │  ← Source badge (green)
│                         │
│ ┌─────────────────────┐ │
│ │ 链        Ethereum  │ │
│ │ 类型      ERC-20 转账│ │
│ │ 发送方    0x9858...  │ │
│ │ 接收方    0xb385...  │ │
│ │ 金额      10.00 USDC │ │
│ │ Gas       ≈0.0003ETH│ │
│ └─────────────────────┘ │
│                         │
│  ▶ 展开原始数据           │  ← Toggle
│                         │
│  ⚠️ 请仔细核对，签名后无法撤回│
│                         │
│  ┌─────────┐ ┌────────┐ │
│  │   拒绝   │ │ 确认签名│ │
│  └─────────┘ └────────┘ │
└─────────────────────────┘
```

## Layout — Success State

```
┌─────────────────────────┐
│                         │
│          ✓              │  ← Green circle check
│      签名完成            │
│    交易已发送回 OKX       │
│                         │
│  ┌───────────────────┐  │
│  │       返回         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Transaction Row Layout
- Left: label (13px, `text2`)
- Right: value (14px, white, bold, max-width 60%)
- Monospace for addresses
- Larger font (18px) for amount

## Raw Data Toggle
- Button toggles `▶ 展开原始数据` / `▼ 收起原始数据`
- Raw hex content shown below in monospace, max-height 80px, scrollable

## Actions
| Button | Style | Result |
|--------|-------|--------|
| 拒绝 | Red outline | Back to `account-detail`, BLE reset |
| 确认签名 | Primary (blue) | Show success state |
| 返回 (success) | Primary | Back to `account-detail`, BLE reset |

## Notes
- No back button (user must explicitly approve or reject)
- After reject/return: BLE state resets to `idle`, activity log cleared
