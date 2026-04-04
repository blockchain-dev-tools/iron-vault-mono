# Screen: Wallet Manager

**Route ID:** `wallet-manager`

## Purpose
Home screen. Shows all derived accounts grouped by chain, with quick actions.

## Layout

```
┌─────────────────────────┐
│  我的钱包           ⚙️  │
│                         │
│ ┌─────────────────────┐ │
│ │ 🔑 主钱包  HD钱包 [2条链]│ │  ← Wallet card header
│ ├─────────────────────┤ │
│ │ Ξ Ethereum  2个账户  🔗连接OKX │  ← Chain header
│ │   1  0x9858...edA94  m/44'/60'/0'/0/0  › │
│ │   2  0xAbcd...1234   m/44'/60'/0'/0/1  › │
│ │   + 添加账户          │ │
│ ├─────────────────────┤ │
│ │ ◎ Solana   1个账户  🔗连接OKX │
│ │   1  FVjy...3kXp   m/44'/501'/0'/0'  › │
│ │   + 添加账户          │ │
│ └─────────────────────┘ │
│                         │
│  ┌───────────────────┐  │
│  │  + 创建/导入新钱包 │  │  ← Ghost button
│  └───────────────────┘  │
└─────────────────────────┘
```

## Account Row
- Index badge (24×24px, `card2`, rounded 6px)
- Truncated address (monospace)
- Derivation path (small, `text2`)
- Chevron `›` (right aligned)

## Chain Icons
| Chain | Background | Symbol |
|-------|-----------|--------|
| ETH | `#627EEA` | Ξ |
| SOL | `#9945FF` | ◎ |

## Overlays
- **Connect OKX Sheet** — slides up from bottom, shows BLE broadcasting state + step-by-step instructions

## Navigation
- **Account row** → `account-detail`
- **⚙️** → `settings`
- **Connect OKX** → Connect OKX bottom sheet (overlay)
- **+ 创建/导入新钱包** → (future: multi-wallet flow)
