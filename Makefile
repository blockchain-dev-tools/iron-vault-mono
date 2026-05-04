# Iron Vault — Development Makefile
# Run from the monorepo root. See AGENTS.md for workflow details.

MONO_ROOT   := $(shell pwd)
MOBILE_DIR  := apps/mobile
METRO_PORT  := 8081
BUNDLE_ID   := com.ironvault

JAVA_HOME   ?= /usr/lib/jvm/java-17-openjdk-amd64
ANDROID_SDK ?= $(HOME)/Android/Sdk
ADB         := $(ANDROID_SDK)/platform-tools/adb
APK_PATH    := $(MOBILE_DIR)/android/app/build/outputs/apk/debug/app-debug.apk

export JAVA_HOME
export ANDROID_HOME := $(ANDROID_SDK)
export ANDROID_SDK_ROOT := $(ANDROID_SDK)

.PHONY: help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Daily Driver ────────────────────────────────────────────

.PHONY: dev
dev: ## Metro + launch app (daily driver)
	@echo "▶ Starting Metro + launch..."
	@cd $(MOBILE_DIR) && npx react-native start --no-interactive &
	@sleep 2
	@$(ADB) reverse tcp:$(METRO_PORT) tcp:$(METRO_PORT) 2>/dev/null || true
	@$(ADB) shell am start -n $(BUNDLE_ID)/.MainActivity
	@echo "✓ Metro + app launched"

.PHONY: all
all: ## Build + install + Metro + launch
	@$(MAKE) build
	@$(MAKE) install
	@$(MAKE) metro

# ── Metro ───────────────────────────────────────────────────

.PHONY: metro
metro: ## Start Metro (foreground) + ADB forward
	@echo "▶ Starting Metro..."
	@$(ADB) reverse tcp:$(METRO_PORT) tcp:$(METRO_PORT) 2>/dev/null || true
	@cd $(MOBILE_DIR) && npx react-native start --no-interactive

.PHONY: restart
restart: ## Restart Metro
	@echo "▶ Restarting Metro..."
	@pkill -f "react-native start" 2>/dev/null || true
	@sleep 1
	@$(MAKE) metro

.PHONY: stop
stop: ## Stop Metro
	@echo "▶ Stopping Metro..."
	@pkill -f "react-native start" 2>/dev/null || true
	@echo "✓ Metro stopped"

.PHONY: metro-log
metro-log: ## Tail Metro log
	@tail -f /tmp/metro.log 2>/dev/null || echo "No /tmp/metro.log found"

.PHONY: metro-status
metro-status: ## Check if Metro is running
	@pgrep -fl "react-native start" || echo "✗ Metro not running"

.PHONY: adb
adb: ## ADB reverse forwarding (run after daemon restart)
	@$(ADB) reverse tcp:$(METRO_PORT) tcp:$(METRO_PORT)
	@echo "✓ ADB forward set"

# ── Build & Install ────────────────────────────────────────

.PHONY: build
build: ## Build debug APK (requires Java 17)
	@echo "▶ Building debug APK..."
	@cd $(MOBILE_DIR)/android && ./gradlew assembleDebug
	@echo "✓ APK: $(APK_PATH)"

.PHONY: install
install: ## Install APK to device
	@echo "▶ Installing to device..."
	@$(ADB) install -r $(APK_PATH)
	@echo "✓ Installed"

.PHONY: app
app: ## Build + install
	@$(MAKE) build
	@$(MAKE) install

.PHONY: launch
launch: ## Force-stop + reopen app
	@$(ADB) shell am force-stop $(BUNDLE_ID)
	@sleep 0.5
	@$(ADB) shell am start -n $(BUNDLE_ID)/.MainActivity
	@echo "✓ App launched"

# ── Utilities ──────────────────────────────────────────────

.PHONY: clean
clean: ## Clean Android build artifacts
	@echo "▶ Cleaning..."
	@cd $(MOBILE_DIR)/android && ./gradlew clean
	@echo "✓ Clean complete"

.PHONY: type-check
type-check: ## TypeScript type-check (mobile only)
	@echo "▶ Type-checking mobile..."
	@pnpm exec tsc --noEmit -p $(MOBILE_DIR)/tsconfig.json
	@echo "✓ Type check passed"

.PHONY: lint
lint: ## ESLint
	@echo "▶ Linting..."
	@cd $(MOBILE_DIR) && npx eslint . --ext .ts,.tsx
	@echo "✓ Lint passed"
