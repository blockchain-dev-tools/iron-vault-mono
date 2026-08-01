# Bug #1: Entropy 页卡死（Touch 200 次后不动）

> 报告日期：2026-06-01 | 状态：已修复

---

## 症状

1. 在 Entropy 页面 touch 200 次
2. 一直卡在"生成助记词的页面"动不了

## 诊断

**表面现象**: GestureDetector 回调 `_onTap` → `_finalize()` 调用 `CryptoBridge.generateMnemonic()` 后，`context.go('/generate-mnemonic')` 未执行。

**根因**: `libiron_vault_crypto.so`（Rust 加密库）**没有被打包进 APK**。

调用链：
```
_onTap (GestureDetector.onTapDown)
  → _finalize()
    → CryptoBridge.generateMnemonic()
      → DynamicLibrary.open('libiron_vault_crypto.so')  ← 失败！
      → NoSuchMethodError / ArgumentError
```

由于 Flutter 的 `GestureDetector` 回调会**静默吞掉异常**（不崩溃、不跳转，页面直接卡死），用户看不到任何错误提示。

## 修复

### 1. 交叉编译 Rust 库 for Android

- **更新 Rust**: 1.90.0 → 1.96.0（TUNA 镜像仅保留近 2 周档案）
- **安装 android target**: `rustup target add aarch64-linux-android`
- **配置 NDK linker**: `.cargo/config.toml`
  ```toml
  [target.aarch64-linux-android]
  linker = "<ndk>/aarch64-linux-android26-clang"
  ```
- **编译**: `cargo build --target aarch64-linux-android --release`

### 2. 部署 .so 到 APK

```bash
cp rust/target/aarch64-linux-android/release/libiron_vault_crypto.so \
   android/app/src/main/jniLibs/arm64-v8a/
```

### 3. Entropy 页面错误处理

`_finalize()` 改为 async + try-catch：
- 失败时显示错误信息 + 重试按钮
- 生成中显示 loading spinner
- 不再静默卡死

### 4. Gradle 国内镜像配置

`build.gradle.kts` + `settings.gradle.kts` 添加 `maven.aliyun.com` 仓库。Flutter 引擎 JAR 通过 `export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn` 环境变量下载。

---

## 涉及文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `lib/screens/entropy_screen.dart` | 修改 | `_finalize()` async + try-catch + error UI + retry |
| `rust/.cargo/config.toml` | 新增 | Android NDK 交叉编译配置 |
| `android/app/src/main/jniLibs/arm64-v8a/` | 新增 | Rust .so 部署目录 |
| `android/build.gradle.kts` | 修改 | 添加 aliyun mirror 仓库 |
| `android/settings.gradle.kts` | 修改 | pluginManagement 添加 aliyun mirror |
| `android/gradle.properties` | 修改 | 添加 Gradle 性能配置 |

## 验证

```bash
unzip -l app-debug.apk | grep iron_vault
# lib/arm64-v8a/libiron_vault_crypto.so   ← 确认已打包
```

APK 安装后在真机测试通过：Entropy 200 tap → 正常跳转至 GenerateMnemonic 页。
