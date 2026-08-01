# scripts/

构建、安装、调试等辅助脚本。

## 脚本列表

| 脚本 | 用途 |
|---|---|
| `build_and_install.sh` | git pull → 构建 Rust SDK → 构建 Flutter APK → 安装到设备 |

## 前置条件

- Flutter SDK（`flutter` 命令可用）
- Android SDK + ADB（`adb` 命令可用）
- Rust 工具链 + Android target（`aarch64-linux-android`）
- Android NDK（Rust 交叉编译用）
- Git 仓库已初始化且配置了远程

## 使用方式

```bash
# 默认：git pull master + 构建全部 + 安装到第一个可用设备
./scripts/build_and_install.sh

# 指定分支
./scripts/build_and_install.sh --branch develop

# 跳过 Rust 编译（仅修改了 Dart 代码时）
./scripts/build_and_install.sh --skip-rust

# 指定设备
./scripts/build_and_install.sh --device emulator-5554

# release 模式
./scripts/build_and_install.sh --release
```
