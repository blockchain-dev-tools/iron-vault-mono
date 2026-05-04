# End-to-End Test Checklist

发布前必须全部通过。每次 Release 前由测试者签字确认。

**测试设备要求：** Android 8.0+，BLE 已启用，已授权"附近的设备"权限

---

## 一、钱包初始化流程

### 1.1 生成新钱包

- [x] 冷启动 App → 跳转 Welcome 页（无闪屏）
- [x] 点击"生成助记词" → 显示 12 个单词，顺序固定
- [x] 验证页：随机抽查 3 个词位，填写正确 → 进入 SetPin
- [x] 验证页：填写错误 → 显示错误提示，不允许继续
- [x] SetPin：输入 6 位 PIN → 再次确认 → 成功后 `reset` 到 Vault（不可用返回键退回）
- [x] 返回键在 Vault 页无法退出到 PIN/助记词页

#### BIP-39 Passphrase（高级选项）

- [ ] GenerateMnemonic 页默认不展示 passphrase 输入框（折叠状态）
- [ ] 点击 Advanced 展开 → 可输入自定义 passphrase
- [ ] 不填 passphrase（默认）→ 派生地址与标准 BIP-39 路径一致
- [ ] 填入 passphrase → 派生地址与不填时**不同**
- [ ] 相同助记词 + 相同 passphrase → 每次冷启动后派生地址完全一致
- [ ] 相同助记词 + 不同 passphrase → 派生出不同账户地址

问题:
1. 暂时只支持生成12个的助记词，之后需要优化
2. ❌ 有 passphrase 时创建的账户地址不正确（passphrase 未正确传入派生逻辑），然后原来正确的第一个账户马上变成没有助记词短语的账户
### 1.2 导入已有助记词

- [ ] Welcome → Import → 粘贴/输入合法 12/24 词助记词 → 进入 SetPin → Vault
- [ ] 输入无效助记词（非 BIP-39 词表）→ 显示错误，不允许继续
- [ ] 导入后与生成钱包共享同一套派生地址（相同助记词 = 相同账户）

问题:
1. 提示不支持24个助记词，超过12个单词显示too many words

### 1.3 PIN 解锁

- [ ] 杀进程重启 → 跳 Unlock（已有钱包时不回 Welcome）
- [ ] 输入正确 PIN → `reset` 进入 Vault
- [ ] 输入错误 PIN → 提示失败，字段清空
- [ ] 硬件返回键在 Unlock 页无法退出

### 1.4 Enigma 钱包（谜题派生）

- [ ] EnigmaScreen：输入谜题文本 + 密钥 → 生成确定性助记词
- [ ] 相同谜题 + 相同密钥 → 每次派生结果一致
- [ ] 不同密钥 → 不同助记词

---

## 二、账户与地址

### 2.1 账户列表（Vault）

- [ ] ETH / SOL / BTC / TRX / SUI 各链至少显示一个账户
- [ ] 地址格式正确（ETH: 0x + 40 hex；SOL: base58；BTC: bc1...；TRX: T...；SUI: 0x...）
- [ ] 账户卡片点击 → 进入 AccountDetail

### 2.2 AccountDetail

- [ ] 显示正确派生路径（如 ETH: m/44'/60'/0'/0/0）
- [ ] 复制地址功能正常

---

## 三、BLE 连接

### 3.1 广播与发现

- [ ] Vault 页开启 BLE → 设备广播名为 "IRON Vault"
- [ ] 主机端钱包扫描 → 可发现 "IRON Vault"
- [ ] GATT Service UUID 正确：`13d63400-2c97-0004-0000-4c6564676572`

问题:
1. Tronlink Global可以导入，但波宝Pro无法搜索到设备
2. Tronlink Global和

### 3.2 连接与断线

- [ ] 主机连接后 App 显示"已连接"状态
- [ ] 主机主动断开 → App 状态更新为"未连接"，可重新广播
- [ ] App 进入后台（按 Home）→ BLE 连接保持
- [ ] BLE 断线后重连：主机可再次发现并连接（无需重启 App）

---

## 四、APDU 协议

### 4.1 基础命令

| 命令 | APDU | 预期响应 |
|------|------|---------|
| GET_VERSION | `E0 01 00 00 00` | 固件版本 + `9000` |
| GET_APP_AND_VERSION | `B0 01 00 00 00` | 当前 App 名 + `9000` |
| GET_DEVICE_NAME | `E0 D2 00 00 00` | "IRON Vault" + `9000` |
| QUIT_APP | `B0 A7 00 00 00` | `9000` |

### 4.2 切换 App

- [ ] 切换到 Ethereum App → `currentApp = 'Ethereum'`
- [ ] 切换到 Solana App → `currentApp = 'Solana'`
- [ ] 切换到 Bitcoin App → `currentApp = 'Bitcoin'`

---

## 五、各链签名（核心路径）

每条链需在真实钱包 App 上完成"获取地址 → 发起交易 → 在 Iron Vault 确认 → 广播"全流程。

### 5.1 Ethereum

- [ ] **GET_ETH_ADDRESS**：MetaMask 连接后显示正确 ETH 地址
- [ ] **SIGN_ETH_TRANSACTION**：发送 ETH → Iron Vault 弹出确认 → 签名 → 交易广播成功
- [ ] **SIGN_PERSONAL_MESSAGE**：MetaMask "Sign Message" → 确认 → 签名返回正确
- [ ] **SIGN_EIP_712**：Permit/Typed Data 签名 → 返回正确 v/r/s
- [ ] **ERC-20 转账**：PROVIDE_ERC20_TOKEN_INFO → SIGN → 确认页显示 Token 名称与金额
- [ ] **用户拒绝**：点击拒绝 → 返回 `6985`，主机端显示用户取消
- [ ] **超时**：120 秒内不操作 → 签名 session 自动清除，主机收到错误

### 5.2 Solana

- [ ] **GET_SOL_ADDRESS**：Phantom/Backpack 显示正确 SOL 地址
- [ ] **SIGN_SOL_TRANSACTION**：发送 SOL → 确认 → 签名正确
- [ ] **SIGN_SOL_MESSAGE**：dApp 消息签名 → 返回正确签名

### 5.3 Bitcoin

- [ ] **GET_BTC_ADDRESS**：显示正确 bc1... 原生隔离见证地址
- [ ] **SIGN_PSBT**：发起 BTC 转账 → PSBT 分帧传输 → 签名后广播成功
- [ ] 多帧 PSBT（大于 1 个 MTU 包）→ 正确重组后签名

### 5.4 Tron

- [ ] **GET_TRON_ADDRESS**：显示正确 T... 地址
- [ ] **SIGN_TRX_TRANSACTION**：发送 TRX → 确认 → 签名正确

### 5.5 Sui

- [ ] **GET_SUI_ADDRESS**：显示正确 0x... 地址
- [ ] **SIGN_SUI_TRANSACTION**：发送 SUI → 确认 → 签名正确

---

## 六、设置与维护

### 6.1 设置页

- [ ] Vault → Settings 可进入，返回键回到 Vault（不重置栈）
- [ ] 修改 PIN：旧 PIN 验证 → 新 PIN 两次确认 → 生效
- [ ] 备份助记词：PIN 验证后显示 24 词，返回后不留痕迹
- [ ] 重置钱包：确认对话框 → 清除全部数据 → `reset('Welcome')`

### 6.2 主题

- [ ] 深色 / 浅色 / 跟随系统 三档切换正常，重启后保持

---

## 七、安全边界

- [ ] 助记词/PIN 从未出现在 BLE 日志、Metro 日志、logcat 中
- [ ] `adb backup` 无法提取 Keychain 数据（`android:allowBackup="false"` 已设置）
- [ ] App 进入后台超过系统超时阈值 → 重新进入需要 PIN 重新验证（如已实现）
- [ ] 多次错误 PIN 不导致数据损坏（输入错误不清空钱包）

---

## 签字

| 版本 | 测试者 | 日期 | 通过 |
|------|-------|------|------|
| v1.0.0 | | | ☐ |
