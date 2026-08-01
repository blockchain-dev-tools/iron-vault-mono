# Task 6d — BLE 外设 + APDU 链处理器补全

## Refined Task Description

### Goal
实现 BLE 外设（GATT server + Android/iOS 原生权限处理 + APDU over BLE 帧协议），补全 ApduHandler 中所有链处理器（ETH/Sol/BTC/Tron/Sui），实现签名会话管理和 ClearSign/BlindSign 数据追踪。

### Background

当前状态：
- `lib/ble/` 目录为空（仅有 `.gitkeep`）
- `lib/services/apdu_handler.dart` 仅实现了 OS 命令分发（getVersion、getAppName），其余链处理器为占位符返回 `INS_NOT_SUPPORTED`
- `lib/services/apdu_constants.dart` 常量定义完整
- `lib/models/apdu_message.dart` 消息序列化完整
- `lib/models/ble_types.dart` BLE 类型定义完整

> 对标的 mono 源：`apps/mobile/src/ble/BlePeripheral.ts`、`packages/apdu/src/handlers/eth.ts` 等

### Breakdown

- [ ] **4.1** 创建 `lib/ble/ble_peripheral.dart`：
  - GATT server 搭建（Service UUID: `13d63400-2c97-0004-0000-4c6564676572`）
  - Characteristic 定义（TX/RX 通道，W-AES-ECB 配对）
  - 状态机：`idle → broadcasting → connected → error`
  - `startAdvertising()` / `stopAdvertising()` / `sendApduResponse()`
  - 事件流：`onApduReceived`、`onBleLog`、`onBleStatus`
- [ ] **4.2** 实现 BLE 权限处理：
  - Android 12+：`BLUETOOTH_CONNECT`、`BLUETOOTH_ADVERTISE`、`BLUETOOTH_SCAN`
  - Android <12：`BLUETOOTH`、`BLUETOOTH_ADMIN`、`ACCESS_FINE_LOCATION`
  - iOS：`CoreBluetooth` 权限（Info.plist）
  - 运行时权限请求 + 拒绝处理
- [ ] **4.3** 实现 APDU over BLE 帧处理：
  - `frameAPDU(apdu: Uint8List) → List<Uint8List>` — 拆分为 MTU=20 的帧
  - `unframeResponse(frames: List<Uint8List>) → Uint8List` — 合并帧为完整响应
  - Ledger BLE 帧协议（首字节标识帧类型）
- [ ] **4.4** 补全 ApduHandler 中缺失的链处理器：
  - **ETH**（CLA 0xE0）：GET_ETH_ADDRESS、SIGN_ETH_TX、GET_APP_CONFIG、SIGN_PERSONAL_MSG、PROVIDE_ERC20、SIGN_EIP712、PROVIDE_NFT、GET_CHALLENGE、PROVIDE_DOMAIN、GET_BLIND_SIGN、GET_PUBLIC_KEY、SIGN_TYPED_DATA
  - **Solana**（CLA 0xE0，INS 区分）：GET_APP_CONFIG、SIGN_OFFLINE、SIGN_MSG、GET_PUBKEY、SIGN_TX、GET_ADDRESS
  - **BTC**（CLA 0xE1/0xF8）：GET_XPUB、REGISTER_WALLET、GET_WALLET_ADDR、SIGN_PSBT、GET_MASTER_FP、SIGN_MESSAGE、CONTINUE 协议
  - **Tron**（CLA 0x14）：GET_APP_CONFIG、GET_PUBKEY、SIGN_TX、SIGN_PERSONAL
  - **Sui**（CLA 0x07）：GET_APP_CONFIG、GET_PUBKEY、SIGN_TX、SIGN_PERSONAL
- [ ] **4.5** 实现签名会话管理：
  - 超时自动清除（60s 默认）
  - 支持 ETH / ETH personal / ETH EIP-712 / SOL / BTC PSBT / Tron / Sui
  - 并发会话隔离（同一链同一时间只有一个活跃签名会话）
- [ ] **4.6** 实现 ClearSign/BlindSign 数据追踪：
  - ERC20 代币信息存储（name、symbol、decimals、contractAddress）
  - NFT 元数据存储（name、collection、contractAddress、tokenId）
  - 域名信息存储

### Files / Modules Involved

**新增：**
- `lib/ble/ble_peripheral.dart` — BLE 外设核心
- `lib/ble/ble_permissions.dart` — 权限处理
- `lib/ble/ble_framing.dart` — APDU 帧协议

**修改/补全：**
- `lib/services/apdu_handler.dart` — 5 个链处理器实现
- `lib/services/apdu_constants.dart` — 可能需要补充 INS 常量（大概率已完整）

**参考：**
- `lib/models/ble_types.dart` — BLE 状态/设备/UUID 定义
- `lib/models/apdu_message.dart` — APDU 消息序列化

### Notes

- **BLE 平台差异**：Android 和 iOS 的 BLE peripheral API 差异较大，优先实现 Android
- **Foreground service**：Android 需要在 foreground service 中运行 BLE 广告以保证可靠性
- **MTU=20**：Ledger 标准 BLE 帧大小
- **APDU 签名会话**：超时后自动调用 Rust 签名函数（通过 WalletService），而非在 Dart 侧签名
- **BTC CONTINUE 协议**：CLA 0xF8，分段签名 PSBT，需要状态保持
- `pubspec.yaml` 可能需要添加 `flutter_blue_plus` 依赖

### Depends On

- Task 6b 完成（WalletService 可用，APDU Handler 需要调用 Wallet 进行签名）
- Task 6c 可选（屏幕可与 BLE 并行开发）

### Verification

- [ ] `flutter analyze lib/ble/ lib/services/` 零错误
- [ ] APDU handler 所有 INS 有对应处理方法（无默认 fallback to error 的遗漏）

---

> 父任务：Task 6 — iron-vault-mono 剩余功能实现
> 前序：Task 6b — Dart FFI Bridge + Wallet Service（可与 6c 并行）
> 下一个：Task 6e — 周边功能
