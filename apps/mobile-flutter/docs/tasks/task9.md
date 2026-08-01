---
title: "scripts/ 构建安装自动化脚本"
status: draft
created: 2026-06-06
---

# 任务标题

## 想法 / 背景

帮我在scripts下新建一个README.md 的目录文件，然后创建一个脚本，快速确定当前编译出来的版本是不是最新的版本。如果是的话，自动安装到测试机或者模拟器上，如果不是的话，自动变最新的版本，然后安装到测试机或者模拟器上，如果没有便宜的话也自动变异。

## 初步拆解

- [ ]

## 备注

[其他想补充的，或者想问的问题]

---

## Refined Task Description

### Goal

在 `scripts/` 目录下创建：
1. `README.md` — 目录说明文档
2. `build_and_install.sh` — **git pull → build → install** 自动化脚本

脚本功能：一键拉取最新代码 → 构建 Rust SDK → 构建 Flutter APK → 安装到设备/模拟器。不做版本对比，每次都走完整流程。

### Background

项目是 Flutter + Rust 混合工程（Iron Vault BLE 硬件钱包）。完整构建链路：
1. **git pull** — 拉取远程最新代码
2. **Rust 交叉编译** — `cargo build --target aarch64-linux-android --release`，产物复制到 `android/app/src/main/jniLibs/arm64-v8a/`
3. **Flutter APK 打包** — `flutter build apk --debug`
4. **安装** — `adb install -r build/app/outputs/flutter-apk/app-debug.apk`

项目当前健康状态：`flutter build apk --debug` 已验证通过，Rust 交叉编译 + `.so` 打包已配置完成。`scripts/` 目录已存在但为空。

⚠️ 当前工作目录**未初始化 git 仓库**（`git repo: no`），脚本运行前需先 `git init` 并配置远程或用户自行初始化。

### Breakdown

- [ ] Step 1: 创建 `scripts/README.md` — 目录说明、每个脚本用途、前置条件、使用示例
- [ ] Step 2: 创建 `scripts/build_and_install.sh` — Shell 脚本，按序执行：
  - [ ] 2a: **git pull** — `git pull origin <branch>` 拉取最新代码（失败时给出清晰提示）
  - [ ] 2b: **Rust 构建** — `cd rust && cargo build --target aarch64-linux-android --release`，然后复制 `.so` 到 `jniLibs/arm64-v8a/`
  - [ ] 2c: **Flutter 构建** — `flutter pub get && flutter build apk --debug`
  - [ ] 2d: **安装** — 自动检测设备（`adb devices`），安装 APK
  - [ ] 2e: 命令行参数支持（`--device`, `--release`, `--skip-rust`, `--branch` 等）
  - [ ] 2f: 错误处理 — 每一步失败时打印清晰的错误信息并退出，不静默吞错误
  - [ ] 2g: 前置检查 — 确认 `flutter`、`adb`、`cargo`、`rustup target` 等工具可用
- [ ] Step 3: 验证脚本在开发机上可运行

### Files / Modules Involved

- `scripts/README.md` — 新建
- `scripts/build_and_install.sh` — 新建
- `rust/Cargo.toml` — 参考（确定 Rust crate 名称）
- `rust/.cargo/config.toml` — 参考（NDK linker 配置）
- `android/app/src/main/jniLibs/` — Rust `.so` 目标目录

### Notes

- 不去检测"是否最新"——每次都 `git pull` 后重新构建安装，简化逻辑
- 用户原文中"便编译"应为"拉取最新代码后编译"
- Rust 交叉编译目前仅 Linux 有效（需要 NDK）；macOS 需额外配置
- 构建产物路径：`build/app/outputs/flutter-apk/app-debug.apk`
- 安装命令：`adb install -r <apk_path>`（`-r` 覆盖安装）

### Decisions (confirmed with user)

| 决策项 | 选择 |
|---|---|
| Git 分支 | `master`（默认，可通过 `--branch` 覆盖） |
| Rust 编译 | 默认每次都编译，支持 `--skip-rust` 跳过 |
| 构建模式 | `--debug`（默认，可通过 `--release` 切换） |
| 多设备 | 自动选第一个可用设备，支持 `--device <id>` 指定 |
| Git 仓库 | 已 `git init`，脚本假设 git 已就绪 |
| 脚本行为 | **git pull → (opt. Rust build) → Flutter build → adb install** |
