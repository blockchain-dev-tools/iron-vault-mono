#!/usr/bin/env bash
set -euo pipefail

# ─── iron-vault-flutter: git pull → build → install ────────────────────────
# Usage: ./scripts/build_and_install.sh [options]
#
# Options:
#   --branch <name>     Git branch to pull (default: master)
#   --skip-rust         Skip Rust cross-compilation
#   --device <id>       Target device ID (default: auto-select first)
#   --release           Build in release mode (default: debug)
#   --help              Show this help
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

# ─── Defaults ───────────────────────────────────────────────────────────────
BRANCH="master"
SKIP_RUST=false
DEVICE=""
BUILD_MODE="debug"
APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"

# ─── Parse arguments ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"; shift 2 ;;
    --skip-rust)
      SKIP_RUST=true; shift ;;
    --device)
      DEVICE="$2"; shift 2 ;;
    --release)
      BUILD_MODE="release"
      APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
      shift ;;
    --help)
      sed -n '3,12p' "$0"
      exit 0 ;;
    *)
      echo "❌ 未知参数: $1"
      sed -n '3,12p' "$0"
      exit 1 ;;
  esac
done

# ─── Color output ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ─── Prerequisites check ───────────────────────────────────────────────────
info "检查前置工具..."

command -v git    >/dev/null 2>&1 || fail "git 未安装"
command -v flutter >/dev/null 2>&1 || fail "flutter 未安装或在 PATH 中找不到"
command -v adb    >/dev/null 2>&1 || fail "adb 未安装或在 PATH 中找不到"
command -v cargo  >/dev/null 2>&1 || fail "cargo 未安装"

if [[ "$SKIP_RUST" == false ]]; then
  rustup target list --installed 2>/dev/null \
    | grep -q "aarch64-linux-android" \
    || fail "Rust target 'aarch64-linux-android' 未安装。运行: rustup target add aarch64-linux-android"
fi

ok "前置工具检查通过"

# ─── Git pull ───────────────────────────────────────────────────────────────
info "拉取最新代码 (branch: $BRANCH)..."

if [ ! -d ".git" ]; then
  fail "项目根目录没有 .git 目录，请先 git init 并配置远程仓库"
fi

git pull origin "$BRANCH" 2>&1 || fail "git pull 失败，请检查远程仓库配置或网络连接"
ok "代码已更新"

# ─── Rust cross-compilation ─────────────────────────────────────────────────
if [[ "$SKIP_RUST" == false ]]; then
  info "编译 Rust SDK (aarch64-linux-android)..."

  cd rust

  cargo build --target aarch64-linux-android --release 2>&1 \
    || fail "Rust 编译失败，请检查 NDK 配置"

  # 复制 .so 到 jniLibs
  mkdir -p "$SCRIPT_DIR/android/app/src/main/jniLibs/arm64-v8a"
  cp target/aarch64-linux-android/release/libiron_vault_crypto.so \
     "$SCRIPT_DIR/android/app/src/main/jniLibs/arm64-v8a/"

  cd "$SCRIPT_DIR"
  ok "Rust SDK 编译完成，.so 已复制到 jniLibs/arm64-v8a/"
else
  warn "跳过 Rust 编译 (--skip-rust)"
fi

# ─── Flutter build ──────────────────────────────────────────────────────────
info "构建 Flutter APK ($BUILD_MODE)..."

flutter pub get 2>&1 || fail "flutter pub get 失败"

if [[ "$BUILD_MODE" == "release" ]]; then
  flutter build apk --release 2>&1 || fail "Flutter release 构建失败"
else
  flutter build apk --debug 2>&1 || fail "Flutter debug 构建失败"
fi

ok "APK 构建成功: $APK_PATH"

# ─── Install ────────────────────────────────────────────────────────────────
info "安装 APK 到设备..."

if [[ -n "$DEVICE" ]]; then
  # 用户指定了设备
  adb -s "$DEVICE" install -r "$APK_PATH" 2>&1 \
    || fail "安装到设备 $DEVICE 失败"
  ok "已安装到 $DEVICE"
else
  # 自动检测设备
  DEVICES=$(adb devices | awk 'NR>1 && $2 == "device" {print $1}')
  DEVICE_COUNT=$(echo "$DEVICES" | grep -c . || true)

  if [[ "$DEVICE_COUNT" -eq 0 ]]; then
    fail "未检测到已连接的 Android 设备/模拟器"
  fi

  FIRST_DEVICE=$(echo "$DEVICES" | head -1)

  if [[ "$DEVICE_COUNT" -gt 1 ]]; then
    warn "检测到多个设备，自动选择第一个: $FIRST_DEVICE"
    echo "可用设备:"
    echo "$DEVICES" | sed 's/^/  /'
    echo "使用 --device <id> 指定目标设备"
  fi

  adb -s "$FIRST_DEVICE" install -r "$APK_PATH" 2>&1 \
    || fail "安装到 $FIRST_DEVICE 失败"
  ok "已安装到 $FIRST_DEVICE"
fi

# ─── Done ───────────────────────────────────────────────────────────────────
echo ""
ok "✅ 全部完成！"
