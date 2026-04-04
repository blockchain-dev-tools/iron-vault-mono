# Screen: Settings

**Route ID:** `settings`

## Purpose
App configuration: security, BLE device name, about info, and danger zone.

## Layout

```
┌─────────────────────────┐
│ ‹  设置                 │
│                         │
│  安全                   │  ← Section label
│  修改 PIN              › │
│  备份助记词             › │
│  自动锁定时间     5 分钟   │
│                         │
│  BLE                    │
│  设备名称        Nano X › │
│                         │
│  关于                   │
│  版本               0.1.0│
│  检查更新              › │
│                         │
│  ┌───────────────────┐  │
│  │   重置钱包（危险）  │  │  ← Red button
│  └───────────────────┘  │
└─────────────────────────┘
```

## Row Types
- **Tappable** (with `›`): navigates or shows action
- **Display only**: shows value, no chevron, no interaction

## Navigation
- **Back** → `wallet-manager`
- **备份助记词** → `generate-mnemonic`
- **重置钱包** → confirmation → `welcome`

## Notes
- Section labels: uppercase, letter-spacing, `text2`
- Row separator: 1px `#222`
