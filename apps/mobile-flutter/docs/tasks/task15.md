---
title: BLE 签名确认流程 — TransactionScreen 真实集成
status: final
created: 2026-07-04
---

# BLE 签名确认流程

## 背景 / 问题

当前签名流程存在两个完全割裂的路径：

### 路径 A：BLE 真实签名（无确认）

```
OKX Wallet (BLE Central)
  → BlePeripheral (GATT Server)
  → AppState._onApduCommand()
  → ApduHandler.handle()        ← 立即签名，无 UI
  → ble.sendApduResponse(sig)   ← 直接返回 BLE
```

所有 APDU 签名指令（ETH_SIGN 0x04、PERSONAL_MESSAGE 0x08、EIP-712 0x0C/0x0D、SOL_SIGN 0x0A 等）进来后——**用户完全不知道，直接就签了**。

### 路径 B：TransactionScreen（stub，仅从 App 内进入）

```
AccountDetailScreen → "Sign Transaction" 按钮
  → context.go('/transaction')
  → TransactionScreen（展示硬编码占位数据）
  → _onApprove() 里只有 TODO，无真实签名
  → 弹 snackbar → pop
```

### 目标

当 BLE 签名 APDU 进来时：

1. **拦截**签名指令，挂起 BLE 响应
2. **导航到确认页**，展示：签名的**内容**（交易详情/消息）+ 签名的**地址**
3. 用户 **Approve** → 执行签名 → 发送 BLE 响应 → 展示**结果页**
4. 用户 **Reject** → 返回错误状态字 → 返回上一页
5. 超时 **60s** → 自动 Reject

---

## 最终方案

### 1. BLE 响应挂起机制 — `_pendingRequest` 单请求模式

> 决策：LEDGER BLE 协议是严格串行的，同一时间最多一个 pending 请求。不需要队列。

```dart
// AppState
PendingSignRequest? _pendingRequest;  // 最多一个

Future<void> _onApduCommand(Uint8List raw) async {
  if (_isSignCommand(command)) {
    _pendingRequest = PendingSignRequest(command);
    _parseAndNavigate(command);  // 触发导航
    return;  // 不阻塞，BLE stream 继续接收
  }
  // 非签名指令立即处理
  final response = _apduHandler.handle(command);
  await ble.sendApduResponse(response.toBytes());
}

void approveSign() {
  final req = _pendingRequest!;
  final response = _apduHandler.handle(req.command);
  ble.sendApduResponse(response.toBytes());
  _pendingRequest = null;
  // → 导航到结果页
}
```

### 2. 导航触发方式 — 回调注入 + ChangeNotifier

AppState 不直接依赖 Flutter Navigator。

```dart
class AppState extends ChangeNotifier {
  final void Function(Map<String, dynamic> txData)? onSignRequest;
  
  PendingSignRequest? _pendingRequest;
  PendingSignRequest? get pendingRequest => _pendingRequest;
}
```

- `onSignRequest` 回调 → main.dart/router 注入，触发 `context.go('/transaction')`
- `notifyListeners()` → UI 层可监听 `pendingRequest` 变化

### 3. 交易内容解析 — 全部在 Rust SDK

所有链的 payload 解析逻辑放在 Rust SDK 中，通过 FFI 返回 JSON。

| 链 | Rust 解析方式 | JSON 输出 |
|---|---|---|
| ETH RLP | `rlp` crate 解码 | `{type, to, value, gas, gasPrice, nonce, data}` |
| PERSONAL_MSG | try UTF-8 decode | `{type, message, messageHex}` |
| EIP-712 | hex 显示两个 hash | `{type, domainHash, structHash}` |
| SOL/BTC/TRON/SUI | 原始 hex 展示 | `{type: "raw", hex, size, chain}` |

Rust FFI 函数：

```rust
parse_sign_data(chain: *const c_char, payload_hex: *const c_char) -> *mut c_char
// Returns JSON string or null
```

### 4. 确认页 (TransactionScreen)

改造现有 TransactionScreen：

- 不再从 GoRouter extra 读取数据
- 从 AppState.pendingRequest 读取 txData（已由 Rust 解析为 JSON）
- 展示内容：
  - 链标识（Ethereum / Solana / ...）
  - 签名地址（从 seed+path 派生，已存在的 FFI 函数）
  - 解析后的交易详情（to / value / gas / data）
  - 60s 倒计时（AppBar 或顶部）
  - Approve / Reject 按钮
- Approve → AppState.approveSign()
- Reject → AppState.rejectSign()

### 5. 结果页 (SignatureResultScreen)

新增全屏结果页：

- ✅ 成功状态图标
- 签名地址
- 交易 hash（ETH: keccak256(signedTx)）
- 签名值（r+s+v hex，65/64 字节）
- 目标地址 / 价值 / 链
- Raw Signature 可展开显示 + 复制按钮
- "完成" 按钮 → 返回 Vault

### 6. 拦截指令范围 — 全链

| INS | 操作 | 拦截 |
|---|---|---|
| `0x04` ETH_SIGN (RLP) | 签名 ETH 交易 | ✅ |
| `0x06` ETH_SIGN (back compat) | 签名 ETH 交易 | ✅ |
| `0x08` SIGN_PERSONAL_MSG | 签名个人消息 | ✅ |
| `0x04` P1=0x02/0x42 EIP-712 | 单 APDU EIP-712 | ✅ |
| `0x0C` EIP-712 domain | 缓存 domain hash | ✅ |
| `0x0D` EIP-712 struct | 签名 struct | ✅ |
| `0x0A` SOL_SIGN | 签名 Solana 消息 | ✅ |
| `0x44` BTC_SIGN_TX | 签名 BTC 交易 | ✅ |
| `0x04` CLA=0x14 TRON_SIGN | 签名 TRON 交易 | ✅ |
| `0x04` CLA=0x07 SUI_SIGN | 签名 SUI 交易 | ✅ |

### 7. BLE 响应

| 操作 | BLE 响应 |
|---|---|
| 用户 Approve | 正常签名结果 + 0x9000 |
| 用户 Reject | 0x6985 |
| 超时 (60s) | 0x6985 |
| 页面被 dismiss | 0x6985 |

### 8. AccountDetail 按钮

移除 "Sign Transaction" 按钮（签名走 BLE 通道，不需要 App 内触发）。

---

## 实现计划

### Phase 1: Rust SDK — RLP 解析 + parse_sign_data FFI

| 步骤 | 文件 |
|---|---|
| `Cargo.toml` 加 `rlp`, `serde`, `serde_json` | `rust/Cargo.toml` |
| 新建 `rust/src/parse.rs` — `parse_eth_tx()`, `parse_sign_data()` | `rust/src/parse.rs` |
| `lib.rs` 加 FFI 导出 `parse_sign_data` | `rust/src/lib.rs` |
| Dart `CryptoBridge` 加 `parseSignData()` | `lib/infrastructure/ffi/crypto_bridge.dart` |

### Phase 2: AppState — 签名拦截 + pending 机制

| 步骤 | 文件 |
|---|---|
| 新增 `PendingSignRequest` 模型 | `lib/core/models/apdu_message.dart` |
| `_onApduCommand()` 拦截签名指令 | `lib/app/app_state.dart` |
| `approveSign()` / `rejectSign()` / timeout | `lib/app/app_state.dart` |
| 注入 `onSignRequest` 回调 | `lib/main.dart` |

### Phase 3: UI — 确认页（TransactionScreen 重写）

| 步骤 | 文件 |
|---|---|
| TransactionScreen 改为从 AppState 读取数据 | `lib/ui/screens/transaction/transaction_screen.dart` |
| 展示解析后的交易内容 + 签名地址 | 同上 |
| 60s 倒计时 | 同上 |
| Approve/Reject 调用 AppState | 同上 |

### Phase 4: UI — 结果页（SignatureResultScreen）

| 步骤 | 文件 |
|---|---|
| 新建 SignatureResultScreen | `lib/ui/screens/transaction/signature_result_screen.dart` |
| Router 加 `/signature-result` 路由 | `lib/core/router.dart` |

### Phase 5: AccountDetail + 清理

| 步骤 | 文件 |
|---|---|
| 移除 "Sign Transaction" 按钮 | `lib/ui/screens/account_detail/account_detail_screen.dart` |
| 验证全流程 | `flutter analyze` + `flutter test` |

---

## 涉及文件

| 文件 | 改动 |
|---|---|
| `rust/Cargo.toml` | +rlp, +serde, +serde_json |
| `rust/src/parse.rs` | **新建** — RLP 解析 + parse_sign_data |
| `rust/src/lib.rs` | +`mod parse`, +FFI `parse_sign_data` |
| `lib/infrastructure/ffi/crypto_bridge.dart` | +`parseSignData()` FFI |
| `lib/core/models/apdu_message.dart` | +`PendingSignRequest` |
| `lib/app/app_state.dart` | 签名拦截 + pending + approve/reject |
| `lib/main.dart` | 注入导航回调 |
| `lib/core/router.dart` | +结果页路由，传 AppState |
| `lib/ui/screens/transaction/transaction_screen.dart` | 重写 |
| `lib/ui/screens/transaction/signature_result_screen.dart` | **新建** |
| `lib/ui/screens/account_detail/account_detail_screen.dart` | 移除 Sign Transaction 按钮 |
| `docs/progress/README.md` | 更新进度 |
