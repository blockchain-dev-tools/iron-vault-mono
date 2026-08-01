/// Widget tests for [SettingsScreen].
///
/// Covers:
/// - Reset Wallet flow: confirmation dialog → calls clearWallet → navigates
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:iron_vault_flutter/core/interfaces/wallet_service.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/ui/screens/settings/settings_screen.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mock IWalletService
// ═══════════════════════════════════════════════════════════════════════

class _MockWalletService implements IWalletService {
  bool clearWalletCalled = false;

  @override
  Future<void> clearWallet() async {
    clearWalletCalled = true;
  }

  // ── Unused stubs ────────────────────────────────────────────────────

  @override
  Future<bool> hasWallet() => Future.value(false);

  @override
  Future<bool> isLocked() => Future.value(false);

  @override
  bool get isUnlocked => false;

  @override
  void lock() {}

  @override
  Future<bool> verifyPin(String pin) => Future.value(true);

  @override
  int get pinAttempts => 0;

  @override
  Future<WalletAccounts> setupWallet(
    String mnemonic, {
    required String pin,
    String passphrase = '',
    bool storePassphrase = false,
  }) =>
      throw UnimplementedError();

  @override
  Future<WalletAccounts> unlockWallet(String pin) =>
      throw UnimplementedError();

  @override
  WalletAccounts? getAccounts() => null;

  @override
  Future<WalletAccounts> addAccount(String chain, String path) =>
      throw UnimplementedError();

  @override
  Future<WalletAccounts> removeAccount(String chain, String address) =>
      throw UnimplementedError();

  @override
  Future<String?> revealMnemonic(String pin) => Future.value(null);

  @override
  String? get seedHex => null;

  @override
  String? get mnemonic => null;

  @override
  Future<bool> updatePin(String oldPin, String newPin) =>
      Future.value(true);
}

// ═══════════════════════════════════════════════════════════════════════
// Test helper: builds a GoRouter with only the routes needed by the test
// ═══════════════════════════════════════════════════════════════════════

GoRouter _testRouter({required Widget settingsScreen}) => GoRouter(
      initialLocation: '/settings',
      routes: [
        GoRoute(
          path: '/settings',
          builder: (_, __) => settingsScreen,
        ),
        GoRoute(
          path: '/welcome',
          builder: (_, __) => const Scaffold(
            body: Center(child: Text('Welcome Screen')),
          ),
        ),
      ],
    );

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  testWidgets('reset wallet calls clearWallet and navigates to welcome',
      (tester) async {
    final mockWallet = _MockWalletService();

    await tester.pumpWidget(
      MaterialApp.router(
        routerConfig: _testRouter(
          settingsScreen: SettingsScreen(
            walletService: mockWallet,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Scroll down to find the "Reset Wallet" tile
    await tester.scrollUntilVisible(
      find.text('Reset Wallet'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    // Tap "Reset Wallet"
    await tester.tap(find.text('Reset Wallet'));
    await tester.pumpAndSettle();

    // Confirm dialog should appear — use textContaining since the Text
    // widget renders the full paragraph including "Are you sure?"
    expect(
      find.textContaining('Are you sure'),
      findsOneWidget,
    );

    // Tap "Reset" in the confirmation dialog
    await tester.tap(find.text('Reset'));
    await tester.pumpAndSettle();

    // Verify: clearWallet was called
    expect(mockWallet.clearWalletCalled, isTrue);

    // Verify: navigated to /welcome
    expect(find.text('Welcome Screen'), findsOneWidget);
  });

  testWidgets('reset wallet dialog can be cancelled', (tester) async {
    final mockWallet = _MockWalletService();

    await tester.pumpWidget(
      MaterialApp.router(
        routerConfig: _testRouter(
          settingsScreen: SettingsScreen(
            walletService: mockWallet,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Scroll to Reset Wallet tile
    await tester.scrollUntilVisible(
      find.text('Reset Wallet'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    // Tap "Reset Wallet"
    await tester.tap(find.text('Reset Wallet'));
    await tester.pumpAndSettle();

    // Confirm dialog visible
    expect(find.textContaining('Are you sure'), findsOneWidget);

    // Tap "Cancel"
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    // Verify: clearWallet was NOT called
    expect(mockWallet.clearWalletCalled, isFalse);

    // Verify: still on settings screen
    expect(find.text('Settings'), findsOneWidget);
  });
}
