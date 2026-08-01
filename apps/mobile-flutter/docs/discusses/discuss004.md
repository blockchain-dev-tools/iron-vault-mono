接下来我们讨论下产品层面的设计，我觉得现在的产品很怪，你能帮我重新梳理下产品的逻辑么？

---

## 产品定位分析

### 这个产品到底是什么？

**Iron Vault 的本质是一个 BLE 硬件钱包**。它的核心价值主张是：把旧手机变成一个 Ledger Nano X 兼容的蓝牙签名设备。

用户的使用场景是这样的：
1. **一次性设置**：在旧手机上创建/导入钱包
2. **日常使用**：打开 BLE 广播，旧手机放在桌上充当签名器
3. **签名确认**：当主设备（日常手机）上的 OKX Wallet / MetaMask 发起交易时，看向**这台旧手机**的屏幕确认或拒绝

这才是产品的核心闭环。当前 UI 的问题是把这个闭环打乱了。

---

## 当前产品的问题

### 问题 1：两种产品身份混在一个屏幕里

Vault 页同时承担了两个完全不相关的职责：

| 职责 | 使用场景 | 用户心智 |
|---|---|---|
| **账户浏览器**（5 链账户列表、地址、QR） | 用户自己查看钱包余额/地址 | "这是一个钱包 App" |
| **BLE 签名器**（广播开关、日志、签名确认） | 作为另一台设备的硬件钱包 | "这是一个签名设备" |

这两个场景的用户**不是同一个人**——账户浏览器的用户是钱包持有者本人，BLE 签名器的"用户"是另一台设备（以及那个设备前的人）。把两者放在同一个 Vault 页面，用户会困惑："我到底在操作什么？"

### 问题 2：BLE 被当作"附加功能"而非核心功能

当前设计：
- BLE 开关是一个 **FAB**（浮动按钮），和日志按钮挤在右下角
- 账户列表占据屏幕主体
- 给人的感觉：BLE 是 Vault 的一个"小工具"

实际情况：
- 这个设备的**唯一存在意义**就是充当 BLE 签名器
- 账户浏览是"顺便提供"的辅助功能，用于验证地址是否正确
- BLE 应该是**默认开启、始终可见**的核心状态

### 问题 3：签名确认流程的用户心智割裂

当 BLE 签名请求到来时：
1. `SignConfirmation` 拦截请求 → `onRequestPending` 回调
2. Router 跳转到 `/transaction`（TransactionScreen）
3. 用户看到交易详情，点 Approve/Reject
4. 跳转到 `/signature-result`（SignatureResultScreen）
5. 结果页展示签名结果

这个流程本身是正确的（和 Ledger 硬件钱包的交互模式一致），但与 Vault 页的关系很奇怪：
- 签名请求到来时，用户可能正在 Vault 页看账户
- 突然被强制跳转到 TransactionScreen
- 完成后跳转到 SignatureResultScreen
- 然后……回到 Vault？还是留在结果页？
- 用户在签名过程中完全失去了"我在管理一个硬件钱包"的上下文

### 问题 4：Enigma 入口让新用户困惑

Welcome 页面有三个入口：

| 入口 | 目标用户 | 清晰度 |
|---|---|---|
| Create New Wallet | 新用户 | ✅ 清晰 |
| Import Existing | 有助记词的用户 | ✅ 清晰 |
| Enigma Setup | ??? | ❌ 不清晰 |

"Advanced entropy generation with Enigma"——新用户完全不知道这是什么。Enigma 的本质是 "用自定义谜语+秘密生成确定性助记词"，这是一个高级功能，但 Welcome 页面把它和"创建钱包""导入钱包"并列，暗示它是第三种创建方式。

**建议**：Enigma 不应该在 Welcome 页面作为一级入口。它应该是一个"高级选项"，放在 Create New Wallet 流程中作为可选的 entropy 来源。

### 问题 5：账户管理功能定位不清

Vault 页面可以"Add Account"（在同一链上派生新地址），但：
- 用户无法重命名账户
- 用户无法删除账户
- 用户无法在 App 内发起交易
- AccountDetail 页面只有"查看地址+QR"功能，没有实际可操作性

账户列表的存在意义是什么？如果只是为了验证"BLE 返回的地址和 App 显示的一致"，那它应该是一个**验证工具**而非"钱包主页"。但当前设计把它当作了 App 的主页。

### 问题 6：产品命名和品牌混淆

- App 叫 "Iron Vault"
- Welcome 页副标题："Turn your old phone into a hardware wallet"
- 使用了 Ledger 的 Logo（`LedgerLogo` CustomPainter）
- BLE 使用 Ledger Nano X 的 GATT UUID

用户看到 Ledger Logo + "Turn your old phone into a hardware wallet" 会困惑：这到底是 Ledger 官方产品，还是第三方兼容设备？

---

## 重新梳理产品逻辑

### 核心洞察：这个产品有两种"模式"，应该分开设计

```
┌─────────────────────────────────────────────────────┐
│                     Iron Vault                       │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────────┐   │
│  │   管理模式        │    │    签名模式            │   │
│  │  (Setup/Manage)  │    │  (Signing Device)     │   │
│  │                  │    │                       │   │
│  │  • 创建/导入钱包  │    │  • BLE 广播状态       │   │
│  │  • 查看地址      │    │  • 待签名请求          │   │
│  │  • 设置          │    │  • 签名确认/拒绝       │   │
│  │  • 备份助记词    │    │  • 签名历史            │   │
│  │                  │    │                       │   │
│  │  使用频率: 一次性 │    │  使用频率: 日常        │   │
│  └──────────────────┘    └──────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**管理模式**（设置后很少打开）：
- 钱包创建流程（Entropy → Mnemonic → Verify → SetPin）
- 钱包导入
- 查看地址/QR（验证用）
- 设置（主题、语言、安全）
- 备份助记词

**签名模式**（日常使用的默认状态）：
- BLE 广播状态（核心状态指示器）
- 等待签名请求（空闲状态）
- 签名确认页面（交易详情 + Approve/Reject）
- 签名结果（成功/失败）
- 最近的签名记录

### 重新设计的用户流程

```
首次使用（管理模式）:
  Welcome → Create/Import/Enigma → SetPin → [自动进入签名模式]

日常使用（签名模式—默认状态）:
  打开 App → 自动解锁(或输入PIN) → BLE 自动开启 → 等待签名请求
                                              ↓
                              签名请求到来 → 交易确认页 → Approve/Reject
                                              ↓
                                         签名结果 → 返回等待

偶尔管理:
  签名模式 → 点击"管理" → 账户列表 / 设置 / 备份
                              ↓
                         完成后 → 返回签名模式
```

### 建议的页面重构

**1. 新增：签名模式主页（Dashboard/Standby Screen）**

替代当前的 Vault 页作为 App 主页：

```
┌─────────────────────────────┐
│        Iron Vault           │  ← AppBar
│                             │
│      ┌───────────────┐      │
│      │   🛡️ BLE 广播中  │      │  ← 核心状态：BLE 是否在广播
│      │   等待签名请求... │      │
│      └───────────────┘      │
│                             │
│   最近签名记录（可选）        │
│   • ETH Transfer 10:30     │
│   • SOL Stake   09:15      │
│                             │
│   [管理钱包]  [设置]        │  ← 进入管理模式的入口
└─────────────────────────────┘
```

**2. Vault 页降级为"账户管理"子页面**

- 从管理模式入口进入，而非 App 主页
- 功能保持不变（查看地址、QR、添加账户）
- 移除 BLE FAB（BLE 状态在主页管理）

**3. BLE 行为改变**

- App 解锁后 **BLE 自动开启广播**（这是设备的默认状态）
- 不需要手动点 FAB 开启
- 签名模式主页显示 BLE 状态（广播中/已连接/错误）
- 进入管理模式时可以选择暂停 BLE（可选，一般不需要）

**4. Welcome 页面简化**

```
Create New Wallet     → Entropy 流程
Import Existing       → 导入流程
                       (Enigma 作为 Create 流程的高级选项，不在此展示)
```

**5. 交易签名流程保持但改进入口**

- 签名请求到来 → 无论在哪个页面，弹出/跳转到 TransactionScreen
- 确认/拒绝后 → SignatureResultScreen
- 关闭结果页 → **返回签名模式主页**（而非 Vault）
- 签名模式主页显示刚才的签名记录

---

## 总结：核心设计原则

| 原则 | 当前问题 | 建议 |
|---|---|---|
| **BLE 是核心，非附加** | BLE 是 Vault 页的 FAB 小按钮 | BLE 是主页的核心状态，自动开启 |
| **两种模式分离** | 管理和签名混在 Vault 一页 | 签名模式（日常主页）+ 管理模式（偶尔进入） |
| **默认状态是最常用状态** | 默认打开 Vault（账户列表） | 默认打开签名待机页（等待 BLE 请求） |
| **新用户路径清晰** | Enigma 和 Create/Import 并列 | Create 流程清晰，Enigma 作为高级选项 |

---

## 决策：采用 AirGap Vault 风格的三 Tab 底部导航

**参考**: AirGap Vault (`airgap-it/airgap-vault`) 使用三 Tab Ionic 底部导航：Secrets (钱包) / Scanner (交互) / Settings (设置)。Scanner Tab 在他们应用中是 QR 扫描器，在我们的应用中是 BLE 外设管理。

**最终方案**：底部导航栏 3 个 Tab

| Tab | 内容 | 来源 |
|---|---|---|
| **Accounts** | 钱包账户列表（5 链展开卡片、指纹横幅、添加账户） | 从 VaultScreen 提取 |
| **BLE** | BLE 外设状态、开关、实时日志 | 从 VaultScreen FAB + BleLogView 提取 |
| **Settings** | 主题、安全、BLE 名称、关于 | 适配现有 SettingsScreen（移除返回按钮） |

**架构变更**:
- 新建 `MainScreen` — `BottomNavigationBar` + `IndexedStack` 作为 App 主页
- 新建 `BleScreen` — BLE Tab 独立页面
- 新建 `AccountsTab` — 账户 Tab（从 VaultScreen 提取）
- `SettingsScreen` 新增 `isTab` 参数，支持 Tab 模式和独立页面两种使用方式
- Router: `/` → MainScreen（替代旧 `/vault`），移除独立 `/settings` 路由
- 所有 `context.go('/vault')` → `context.go('/')`
