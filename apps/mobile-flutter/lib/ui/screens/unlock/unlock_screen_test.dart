/// Widget tests for [UnlockScreen].
///
/// Covers:
/// - Reset via "Forgot PIN?" link → calls clearWallet → navigates to welcome
/// - Reset after lockout → calls clearWallet → navigates to welcome
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:iron_vault_flutter/core/interfaces/wallet_service.dart';
import 'package:iron_vault_flutter/core/models/wallet_accounts.dart';
import 'package:iron_vault_flutter/ui/screens/unlock/unlock_screen.dart';

// ═══════════════════════════════════════════════════════════════════════
// Hand-written Mock IWalletService
// ═══════════════════════════════════════════════════════════════════════

class _MockWalletService implements IWalletService {
  bool clearWalletCalled = false;
  bool _isLockedResult = false;
  bool _verifyPinResult = true;

  void setLocked() {
    _isLockedResult = true;
  }

  @override
  Future<bool> isLocked() => Future.value(_isLockedResult);

  @override
  Future<bool> verifyPin(String pin) => Future.value(_verifyPinResult);

  @override
  Future<void> clearWallet() async {
    clearWalletCalled = true;
  }

  // ── Unused stubs ────────────────────────────────────────────────────

  @override
  Future<bool> hasWallet() => Future.value(true);

  @override
  bool get isUnlocked => false;

  @override
  void lock() {}

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

GoRouter _testRouter({required Widget unlockScreen}) => GoRouter(
      initialLocation: '/unlock',
      routes: [
        GoRoute(
          path: '/unlock',
          builder: (_, __) => unlockScreen,
        ),
        GoRoute(
          path: '/welcome',
          builder: (_, __) => const Scaffold(
            body: Center(child: Text('Welcome Screen')),
          ),
        ),
        GoRoute(
          path: '/vault',
          builder: (_, __) => const Scaffold(
            body: Center(child: Text('Vault Screen')),
          ),
        ),
      ],
    );

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

void main() {
  testWidgets('forgot PIN calls clearWallet and navigates to welcome',
      (tester) async {
    final mockWallet = _MockWalletService();

    await tester.pumpWidget(
      MaterialApp.router(
        routerConfig: _testRouter(
          unlockScreen: UnlockScreen(
            walletService: mockWallet,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // "Forgot PIN?" is at the bottom of the scrollable column.
    // Scroll down to reveal it.
    await tester.scrollUntilVisible(
      find.text('Forgot PIN?'),
      100,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    // Tap "Forgot PIN?"
    await tester.tap(find.text('Forgot PIN?'));
    await tester.pumpAndSettle();

    // Verify: clearWallet was called
    expect(mockWallet.clearWalletCalled, isTrue);

    // Verify: navigated to /welcome
    expect(find.text('Welcome Screen'), findsOneWidget);
  });

  testWidgets('reset after lockout calls clearWallet and navigates',
      (tester) async {
    final mockWallet = _MockWalletService();
    mockWallet.setLocked();

    await tester.pumpWidget(
      MaterialApp.router(
        routerConfig: _testRouter(
          unlockScreen: UnlockScreen(
            walletService: mockWallet,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Enter 6 PIN digits to trigger auto-verification.
    // The mock wallet is locked, so _verifyPin() will set _lockedOut = true.
    for (int i = 0; i < 6; i++) {
      await tester.tap(find.byKey(const Key('unlock-btn-1')));
      await tester.pump();
    }
    await tester.pumpAndSettle();

    // Lockout view should now show "Reset Wallet" button
    await tester.scrollUntilVisible(
      find.text('Reset Wallet'),
      100,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text('Reset Wallet'), findsOneWidget);

    // Tap "Reset Wallet"
    await tester.tap(find.text('Reset Wallet'));
    await tester.pumpAndSettle();

    // Verify: clearWallet was called
    expect(mockWallet.clearWalletCalled, isTrue);

    // Verify: navigated to /welcome
    expect(find.text('Welcome Screen'), findsOneWidget);
  });
}
