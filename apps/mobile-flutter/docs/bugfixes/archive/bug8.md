# Bug 8: OKX Wallet 无法通过蓝牙连接

状态：已修复

## 症状

OKX Wallet 无法通过蓝牙发现或连接到当前 App。其他 Ledger Nano X 兼容钱包（MetaMask、Ledger Live 等）同样无法发现设备。

## 诊断

**根因：BLE 实现完全是 stub/simulator，未使用真实蓝牙硬件。**

- `lib/ble/ble_peripheral.dart` 使用 `Timer` 模拟连接和 APDU 收发，不调用任何蓝牙 API
- 未集成任何 BLE 外设框架（`flutter_blue_plus` 被注释且仅支持 Central 模式）
- `AndroidManifest.xml` 无任何 BLE 权限
- `VaultScreen` 的 BLE FAB 仅操作本地 `bool _bleActive` 变量

此外，经过调研发现：
- `flutter_blue_plus` 仅支持 BLE **Central** 角色，不能用于 GATT **Peripheral** Server
- 需要改用 `ble_gatt_server`（Android-only，完整 GATT server 支持）

## 修复

### 1. 添加 BLE 依赖和权限
- `pubspec.yaml`：添加 `ble_gatt_server: ^0.1.0` + `permission_handler: ^11.3.0`
- `AndroidManifest.xml`：添加 `BLUETOOTH_ADVERTISE`、`BLUETOOTH_CONNECT`、`BLUETOOTH_SCAN`（Android 12+）及旧版兼容权限

### 2. 扩展 BLE 类型定义（`lib/models/ble_types.dart`）
- 新增 `bleApduWriteCommandCharacteristicUuid`（...-0003-...，Write Without Response）
- 新增 `bleCccdDescriptorUuid`（00002902-0000-1000-8000-00805f9b34fb）

### 3. 重写 BLE 核心实现（`lib/ble/ble_peripheral.dart`）
- 替换 `Timer` 模拟器 → 真实 `ble_gatt_server` GATT Server（305 行 → 583 行）
- 保留相同公开 API 接口，向下兼容
- 实现 Ledger Nano X 兼容 GATT 服务：1 Service + 3 Characteristics + CCCD
- 实现 APDU 分片协议（tag `0x05` 的首片/后续片格式、`0x08` GET_MTU）
- 运行时权限请求（`permission_handler`）
- 完整事件处理：连接状态变化、特性写入、MTU 变更、广播成功/失败

### 4. 集成到应用状态（`lib/app/app_state.dart`）
- 新增 `BlePeripheral` 字段和 getter/setter
- 新增 `startBleAdvertising()` / `stopBleAdvertising()` 方法
- 后台时自动停止广播，前台恢复（`onAppBackgrounded` / `onAppForegrounded`）
- `dispose()` 中清理 BLE 资源

### 5. 集成到启动流程（`lib/main.dart`）
- 在 `_initApp()` 中创建 `BlePeripheral` 实例并注入 `AppState`

### 6. 更新 VaultScreen BLE 控制（`lib/screens/vault_screen.dart`）
- 移除本地 `_bleActive` / `_bleLog` 桩
- 通过 `AppState.blePeripheral` 获取真实 BLE 状态
- 订阅 `BlePeripheral.logStream` 显示实时日志
- BLE FAB toggle 调用真实 `startAdvertising()` / `stopAdvertising()`

### 7. 更新路由（`lib/app/router.dart`）
- VaultScreen 构造传递 `appState: appState`

## 涉及文件

| 文件 | 变更类型 |
|---|---|
| `pubspec.yaml` | 依赖添加 |
| `android/app/src/main/AndroidManifest.xml` | 权限添加 |
| `lib/models/ble_types.dart` | 新增 UUID 常量 |
| `lib/ble/ble_peripheral.dart` | **完全重写**（stub → 真实 GATT Server）|
| `lib/app/app_state.dart` | BLE 生命周期集成 |
| `lib/main.dart` | BLE 初始化 |
| `lib/screens/vault_screen.dart` | BLE UI 集成 |
| `lib/app/router.dart` | 参数传递 |

## 验证

- `flutter analyze lib/`: 零问题
- `flutter test`: 47/47 全部通过
- `ble_peripheral.dart` 单独分析: 零问题
