我现在暂时没有时间学习flutter，你能自己了解上下文，想想有哪些东西是你可以并行干的么？不要卡在我这边

---

## Refined Task Description

### Goal

让 Agent 全面理解 iron-vault-flutter 项目当前状态，自主识别可独立推进的并行工作流，不再等待用户逐步指导。核心目标：**在用户不参与决策的前提下，最大化并行吞吐量**，将项目从"只有框架和练习"推进到"有可运行的基础设施和屏幕"。

### Background

**已完成（Task 1-4）：**
- 文档基础设施（`docs/` 目录结构、模板、学习路线）
- Flutter 环境搭建 + 项目初始化
- `.opencode/commands/do-task.md` 融入 Karpathy Guidelines
- 25 个进阶练习框架 + 前 3 个练习实现（Exercise 1-3）

**当前代码库状态：**

| 模块 | 状态 | 内容 |
|---|---|---|
| `lib/main.dart` | 默认 | Flutter create 生成的计数器 demo |
| `lib/app/` | 空 | 只有 `.gitkeep` |
| `lib/screens/` | 空 | 14 屏幕全部未创建 |
| `lib/services/` | 空 | 钱包/APDU/BLE 服务全部未实现 |
| `lib/models/` | 空 | 数据类型、存储接口未定义 |
| `lib/ble/` | 空 | BLE 外设未开始 |
| `lib/ffi/` | 空 | Rust FFI 桥接层未开始 |
| `lib/exercises/` | 3 个文件 | exercise_list + Exercise 1 & 3 |
| `rust/` | 不存在 | Rust SDK 尚未创建 |
| `test/` | 基础 | widget_test + key_behavior_test |

**关键约束：**
- 所有架构约定已写入 `AGENTS.md`（ColorTokens、R 常量、导航规则、屏幕流程、存储接口签名、APDU CLA 分配、BLE UUID 等）
- Mono 参考仓库在 [iron-vault-mono](https://github.com/lbh/iron-vault-mono)，但 Agent 不访问它也能按 AGENTS.md 规范推进
- 用户希望 Agent 充分理解上下文后自主决策，在遇到真正需要决策的岔路口才问用户

### Breakdown — 可并行工作流（6 条独立流）

以下工作流之间**无相互阻塞**，可全部并行启动。每条流内部按顺序执行。

---

#### 流 A：主题系统 & 设计令牌（基础依赖）

这是所有 UI 工作的前置依赖 —— `ColorTokens`、`R` 常量、text styles 在所有屏幕中都要用到。

- [ ] A1: 实现 `lib/app/theme.dart` —— `ColorTokens`（dark/light）+ `R` 半径常量
  - 颜色值完全由 AGENTS.md 定义：dark primary `#8FC322`，bg `#0F0F0F`，surface `#1A1A1A`；light primary `#5f8a0e`，bg `#FFFFFF`，surface `#FFFFFF`
  - 使用 `ThemeExtension` 或独立类，方便 `context.colors.primary` 访问
- [ ] A2: 实现 `lib/app/app_theme.dart` —— `ThemeData` dark/light 完整主题配置
  - 引入 `google_fonts` 或系统字体栈，匹配 mono 的 typography
- [ ] A3: 替换 `lib/main.dart` 默认计数器为项目主题入口
  - 初始化 app state，检查 `hasWallet()` 后决定跳转 Welcome 或 Unlock
- [ ] A4: 实现 `lib/app/app_state.dart` —— 全局状态管理骨架
  - 屏幕导航状态、钱包存在检测、启动逻辑

**产出：** `lib/app/theme.dart`, `lib/app/app_theme.dart`, `lib/app/app_state.dart`, 更新的 `lib/main.dart`

**需要决策：** 状态管理方案（Provider / Riverpod / BLoC？AGENTS.md 列举了三种但未确定）。可以先用手写 `ChangeNotifier` + `ListenableBuilder`（无额外依赖），后续切换到选定方案。

---

#### 流 B：数据模型 & 存储接口（被所有服务依赖）

- [ ] B1: 实现 `lib/models/storage.dart` —— Storage 抽象接口
  - `Future<String?> getItem(String key)`, `Future<void> setItem(String key, String value)`, `Future<void> removeItem(String key)`
  - 移动端实现用 `flutter_secure_storage`
  - 测试用内存 Map 实现
- [ ] B2: 实现 `lib/models/wallet_accounts.dart` —— 钱包账户数据结构
  - `WalletAccounts` 类型：chain → accounts[] → { address, path, publicKey }
  - 序列化/反序列化
- [ ] B3: 实现 `lib/models/apdu_message.dart` —— APDU 请求/响应模型
  - CLA, INS, P1, P2, LC, data, LE 字段
  - 序列化为 BLE 传输格式
- [ ] B4: 实现 `lib/models/ble_types.dart` —— BLE 状态机类型
  - `BleState` enum: idle, broadcasting, connected, error
  - `BleDevice` 连接信息
  - GATT 服务/特征 UUID 常量

**产出：** `lib/models/storage.dart`, `wallet_accounts.dart`, `apdu_message.dart`, `ble_types.dart`

**需要决策：** 无。从 AGENTS.md 可直接推导。

---

#### 流 C：APDU 协议层（纯常量 + 逻辑，无外部依赖）

- [ ] C1: 实现 `lib/services/apdu_constants.dart` —— CLA/INS/SW 枚举
  - CLA: `0xe0` (OS/Solana/ETH), `0xe1`/`0xf8` (Bitcoin), `0x14` (Tron), `0x07` (Sui)
  - INS: 全部指令码（从 mono `packages/apdu/src/constants.ts` 映射）
  - SW: 状态字（0x9000 成功, 0x6a86 错误 P1P2 等）
- [ ] C2: 实现 `lib/services/apdu_handler.dart` —— APDU 命令分发骨架
  - 按 CLA 字节路由到链处理器
  - 每个链返回占位响应（实际签名逻辑待 Rust SDK 完成后填充）
- [ ] C3: 单元测试 `test/services/apdu_handler_test.dart`
  - 验证 CLA 路由正确
  - 验证无效 CLA 返回错误状态字

**产出：** `lib/services/apdu_constants.dart`, `apdu_handler.dart`, `test/services/apdu_handler_test.dart`

**需要决策：** INS 码的具体值需要查 mono 参考。可以：
- 方案 1：查 mono 仓库获取精确值（推荐，需要访问 GitHub）
- 方案 2：先按 Ledger 标准 APDU 约定设占位值，后续修正

---

#### 流 D：Rust SDK 脚手架（独立于 Flutter）

Rust crate 是加密原语的最终归宿。在实现具体密码学之前，先搭好框架。

- [ ] D1: 创建 `rust/` 目录 + `Cargo.toml`
  - crate name: `iron_vault_crypto`
  - 依赖候选：`bip39`, `bip32`, `ed25519-dalek`, `k256`, `sha2`, `ripemd`, `bech32`, `bs58`
  - 配置 `cdylib` 输出（FFI 动态库）
- [ ] D2: 创建模块骨架 `rust/src/lib.rs`
  - `mod mnemonic; mod hdkey; mod signer; mod address; mod btc;`
  - 暴露 FFI 入口函数签名（对应 `CryptoBridge` 的每个方法）
- [ ] D3: 实现 `rust/src/mnemonic.rs` —— BIP-39 生成/验证
  - `generate_mnemonic(strength: u32) -> *mut c_char`
  - `validate_mnemonic(mnemonic: *const c_char) -> bool`
  - `reencode_mnemonic(mnemonic: *const c_char) -> *mut c_char`
- [ ] D4: 实现 `rust/src/hdkey.rs` —— BIP-32 + SLIP-10 派生
- [ ] D5: 实现 `rust/src/signer.rs` —— secp256k1/Ed25519 签名
- [ ] D6: 实现 `rust/src/address.rs` —— 地址派生（5 条链）
- [ ] D7: 实现 `rust/src/btc.rs` —— P2WPKH / Tron / Sui 地址
- [ ] D8: Rust 测试 `cargo test` 全部通过

**产出：** 完整的 `rust/` crate，可编译，可测试

**需要决策：** 密码学参数（派生路径、网络字节等）需要对齐 mono。可以先用常见标准值，后续与 mono 对齐修正。

**⚠️ 注意：** D3-D7 是密码学实现，需要认真对待。应优先完成 D1-D2 框架，然后逐个模块实现并测试。

---

#### 流 E：练习系统扩展（Task 4 延续，Exercise 4-6）

- [ ] E1: Exercise 4 —— MagneticScrollPhysics
  - `lib/exercises/magnetic_scroll.dart`：自定义 `ScrollPhysics` 子类
  - 在 `exercises_main.dart` 添加 demo 页面
  - `test/exercises/magnetic_scroll_test.dart`
- [ ] E2: Exercise 5 —— SliverParallaxHeader
  - `lib/exercises/sliver_parallax.dart`：`SliverPersistentHeaderDelegate` 实现
  - 在 `exercises_main.dart` 添加 demo 页面
  - `test/exercises/sliver_parallax_test.dart`
- [ ] E3: Exercise 6 —— Ledger Logo CustomPainter
  - `lib/app/widgets/ledger_logo.dart`：Canvas 绘制六边形 + 芯片图形
  - 此文件同时也是项目正式组件，可复用
  - 在 `exercises_main.dart` 添加 demo 页面
  - `test/exercises/ledger_logo_test.dart`（golden test）

**产出：** 3 个新练习，`exercise_list.dart` 更新 implemented=true

---

#### 流 F：14 屏幕脚手架（依赖流 A 完成后填充，框架可先行）

- [ ] F1: 创建全部 14 个 screen 文件（空 `Scaffold` 骨架）
  - `welcome_screen.dart`, `entropy_screen.dart`, `generate_mnemonic_screen.dart`
  - `verify_mnemonic_screen.dart`, `import_mnemonic_screen.dart`, `set_pin_screen.dart`
  - `vault_screen.dart`, `account_detail_screen.dart`, `transaction_screen.dart`
  - `settings_screen.dart`, `unlock_screen.dart`, `backup_seed_screen.dart`
  - `enigma_screen.dart`, `enigma_mnemonic_screen.dart`
- [ ] F2: 实现导航路由（`lib/app/router.dart`）
  - 声明式路由表（或使用 `go_router`）
  - auth 成功 → `pushAndRemoveUntil`
  - 启动 → 根据 `hasWallet()` 跳转
- [ ] F3: Welcome 屏幕实现
  - 三个入口：Create New Wallet / Import Existing / Enigma
  - 使用 Ledger Logo 组件
- [ ] F4: Unlock 屏幕实现
  - 6 位 PIN 输入，最多 5 次尝试
  - 失败 → 锁定 → 重置钱包选项

**产出：** 14 个 screen 文件 + 路由系统 + Welcome/Unlock 屏幕完整实现

---

### Files / Modules Involved

| 流 | 新建/修改文件 |
|---|---|
| A | `lib/app/theme.dart`, `lib/app/app_theme.dart`, `lib/app/app_state.dart`, `lib/main.dart` |
| B | `lib/models/storage.dart`, `wallet_accounts.dart`, `apdu_message.dart`, `ble_types.dart` |
| C | `lib/services/apdu_constants.dart`, `apdu_handler.dart`, `test/services/apdu_handler_test.dart` |
| D | `rust/Cargo.toml`, `rust/src/lib.rs`, `rust/src/mnemonic.rs`, `rust/src/hdkey.rs`, `rust/src/signer.rs`, `rust/src/address.rs`, `rust/src/btc.rs` |
| E | `lib/exercises/magnetic_scroll.dart`, `sliver_parallax.dart`, `lib/app/widgets/ledger_logo.dart`, 测试文件 |
| F | `lib/screens/*.dart`（14 个）, `lib/app/router.dart` |

### Notes

- **并行策略：** 流 A-F 全部相互独立，可同时启动。每流内部按顺序执行。
- **优先级排序（按依赖图）：**
  1. 流 A（主题）和流 B（模型）—— 所有其他工作都依赖它们
  2. 流 E（练习）—— 纯增量，不阻塞也不被阻塞
  3. 流 D（Rust）—— 与 Flutter 完全独立
  4. 流 C（APDU）—— 需要流 B 的数据类型
  5. 流 F（屏幕）—— 需要流 A 的主题和流 B 的数据模型
- **Agent 自主决策范围：** 凡 AGENTS.md 已明确规定的（颜色值、半径值、UUID、CLA 分配、导航规则），Agent 直接执行，不问用户
- **状态管理方案：** 先用 `ChangeNotifier` + `ListenableBuilder`（零额外依赖），后续根据需要切换到 Provider/Riverpod。这样不阻塞进度
- **导航方案：** 先用 `Navigator 2.0` 的 `GoRouter`（`go_router` 包），AGENTS.md 将其列为候选，且社区标准
- **Rust SDK 逐步推进：** 先创建框架和测试基础设施，密码学实现可从最简单的模块开始（BIP-39 mnemonic），逐步到 BIP-32 派生和签名

### Open Questions

- [ ] **INS 指令码来源：** APDU 常量的 INS 码需要从 mono `packages/apdu/src/constants.ts` 精确获取。Agent 是否应该访问 mono 仓库获取？还是用 Ledger 标准 APDU 约定先行占位？
- [ ] **状态管理方案最终选择：** 当前用 `ChangeNotifier` 占位，后续切换到 Provider / Riverpod / BLoC？哪个是项目最终选择？
- [ ] **导航方案最终选择：** `go_router` 还是手写 `Router` + `RouteInformationParser`（Exercise 23 会做手写版本）？
- [ ] **流 D（Rust）的深度：** 是一次性实现全部 5 个密码学模块，还是先用调用 `bip39` crate 等成熟库实现，后续再替换自定义逻辑？
- [ ] **屏幕实现顺序：** 流 F 创建 14 个骨架后，是否按用户流程顺序实现（Welcome → Entropy → ...），还是先实现展示型屏幕（Settings, AccountDetail）？
- [ ] **是否需要访问 iron-vault-mono 仓库：** 许多实现细节（INS 码、派生路径、交易签名格式）在 mono 代码中精确定义。Agent 是否需要通过 librarian 查 mono 仓库？还是仅靠 AGENTS.md 描述先行实现？
