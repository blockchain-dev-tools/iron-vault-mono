---
description: Build Flutter APK and install to device — git pull → (opt. Rust) → Flutter build → adb install
---

# Build & Install

User invoked `/build-and-install $ARGUMENTS`. Run the build-and-install script from project root.

Run `./scripts/build_and_install.sh $ARGUMENTS` with optional arguments forwarded.

**Arguments** (all optional):
- `--branch <name>` — Git branch to pull (default: master)
- `--skip-rust` — Skip Rust cross-compilation
- `--device <id>` — Target device ID
- `--release` — Release mode (default: debug)

**Examples:**
```
/build-and-install
/build-and-install --skip-rust
/build-and-install --device emulator-5554 --release
```

## After execution

- Report exit code and output to user
- Do NOT modify the script itself
