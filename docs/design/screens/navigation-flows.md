# Navigation Flows

各场景下的页面跳转逻辑。

---

## Flow A — 首次使用：创建新钱包

适用场景：本地无任何助记词数据，用户选择生成新钱包。

```
welcome
  └─[创建新钱包]──► generate-mnemonic
                        └─[我已抄写完成]──► verify-mnemonic
                                               ├─[全部答对]──► set-pin
                                               └─[跳过验证]──► set-pin
                                                                  └─[PIN确认成功]──► wallet-manager
```

---

## Flow B — 首次使用：导入已有钱包

适用场景：用户已有助记词，想把旧钱包导入设备。

```
welcome
  └─[导入已有钱包]──► import-mnemonic
                          └─[确认导入]──► set-pin
                                             └─[PIN确认成功]──► wallet-manager
```

---

## Flow C — 冷启动解锁

适用场景：App 已有钱包数据，重新打开时要求 PIN 验证。

```
[App 启动，检测到已有助记词]
  └──► pin-unlock
           ├─[PIN 正确]──► wallet-manager
           └─[连续错误 5 次]──► 锁定 30 分钟
```

---

## Flow D — 连接 OKX 配对（导入账户）

适用场景：用户在 OKX 中添加硬件钱包，扫描并连接设备。

```
wallet-manager
  └─[连接 OKX]──► connect-okx-sheet（bottom sheet 弹起）
                      │  设备开始 BLE 广播，等待 OKX 扫描
                      │
                      ├─[OKX 连接成功]──► OKX 自动读取地址列表
                      │                    └─[sheet 关闭]──► wallet-manager
                      │
                      └─[用户关闭]──► wallet-manager
```

---

## Flow E — 进入账户接收并确认交易

适用场景：OKX 已配对，用户打开账户详情等待签名请求。

```
wallet-manager
  └─[点击账户行]──► account-detail
                       └─[开始接受交易]──► BLE 广播中
                                              └─[OKX 连接]──► BLE 已连接
                                                                  └─[收到签名请求]──► transaction-confirm
                                                                                          ├─[确认签名]──► 签名成功
                                                                                          │                  └─[返回]──► account-detail（BLE 重置为 idle）
                                                                                          └─[拒绝]──► account-detail（BLE 重置为 idle）
```

---

## Flow F — 备份助记词（已有钱包）

适用场景：用户在设置中主动查看/备份助记词。

```
wallet-manager
  └─[⚙️]──► settings
                └─[备份助记词]──► generate-mnemonic
                                      └─[返回]──► settings
```

---

## Flow G — 重置钱包

适用场景：用户清除所有数据，回到初始状态。

```
settings
  └─[重置钱包]──► [确认弹窗]
                      ├─[确认]──► welcome（清除所有本地数据）
                      └─[取消]──► settings
```
