# 测试指南

> 最后更新：2026-06-21 (task13: 分层架构重构)

---

## 测试策略

采用**分层测试 + 依赖隔离**策略。每层测试的目标不同，mock 的对象不同，绝不出现"想测 PIN 锁定却需要 Rust .so"的情况。

### 分层测试矩阵

| 被测层 | Mock 什么 | 不依赖什么 | 单测速度 | 例子 |
|---|---|---|---|---|
| `core/models/` | 无（纯数据结构） | 一切 | <0.1s | `WalletAccounts.toJson()` |
| `services/` | `core/interfaces/` 中的抽象 | Rust FFI, Flutter, 真存储 | <0.5s | `PinAuthService.isLocked()` |
| `data/repositories/` | `Storage` 接口 | 真 SharedPreferences, 真文件 | <0.5s | `WalletRepositoryImpl.saveAccounts()` |
| `protocols/` | `ICryptoService` | 真 Rust FFI | <0.5s | `ApduHandler` 地址响应格式 |
| `infrastructure/` | 不 mock（集成测试） | 真设备 / 真 FFI / 真 .so | 10s+ | `CryptoBridge.pbkdf2Derive()` |

### 集成测试时机

以下场景必须写集成测试（不 mock，真调 Rust FFI 和平台 API）：

- 修改 `core/interfaces/icrypto_service.dart` 契约
- 修改 `CryptoBridge` 的 FFI 绑定
- Enigma 助记词确定性验证（Dart → Rust 端到端）
- BLE GATT 服务端真机行为

其余所有逻辑的单测通过 mock 接口完成。

---

## 测试文件放置

**测试文件与源文件并列**，不在单独 `test/` 目录隔离：

```
lib/
├── services/
│   ├── wallet_service.dart
│   └── wallet_service_test.dart         ← 紧邻源文件
│
├── data/repositories/
│   ├── wallet_repository_impl.dart
│   └── wallet_repository_impl_test.dart
│
└── core/models/
    ├── wallet_accounts.dart
    └── wallet_accounts_test.dart
```

好处：找测试文件时不用跳目录；改一个模块时一眼看到它的测试。

---

## Mock 编写

### 原则

- ✅ mock `core/interfaces/` 中的**抽象类/接口**
- ❌ 禁止 mock 具体类（`CryptoBridge` 等平台实现）
- ✅ Service 层接口（`IWalletService`）允许在 widget 测试中 mock
- ✅ mock 只设数据（`when(...).thenAnswer(...)`），不设编排逻辑
- ❌ 禁止在 mock 里重现业务逻辑（那是在测 mock，不是测代码）

### 示例

```dart
// ✅ 正确：mock 接口
class MockWalletRepository extends Mock implements IWalletRepository {}
class MockCryptoService extends Mock implements ICryptoService {}

test('isLocked returns true after 5 failures', () async {
  final repo = MockWalletRepository();
  when(repo.loadPinAttempts()).thenAnswer((_) async => 5);

  final service = PinAuthService(repo, MockCryptoService());
  expect(await service.isLocked(), true);
});
```

```dart
// ❌ 错误：mock 具体类
class MockWalletService extends Mock implements WalletService {}
```

---

## 运行测试

```bash
# 跑所有单元测试（不涉及 Rust FFI）
flutter test

# 跑单个 Service 的测试
flutter test lib/services/pin_auth_service_test.dart

# 跑集成测试（需要 Rust .so 编译完成）
flutter test integration_test/

# Rust 侧测试
cd rust && cargo test
```

---

## CI 测试流水线

```
1. flutter analyze lib/       ← 分层依赖检查 + 静态分析
2. flutter test                ← 单元测试（mock 接口，0.5s/个）
3. cd rust && cargo test       ← Rust 侧测试
4. flutter build apk --debug   ← APK 编译验证
5. flutter test integration_test/  ← 集成测试（需要 APK 安装到设备）
```
