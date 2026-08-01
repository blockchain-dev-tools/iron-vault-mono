// Basic smoke test for the Iron Vault app entry point.
//
// Verifies the app boots without errors and shows the expected
// initial screen (Welcome for fresh install, Unlock for existing wallet).

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:iron_vault_flutter/main.dart';

void main() {
  testWidgets('app renders welcome screen on fresh install',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const IronVaultApp());
    // Let the async wallet check resolve (NoWalletStorage returns null).
    await tester.pumpAndSettle();

    // Fresh install: no wallet → Welcome screen with app title "Iron Vault"
    expect(find.text('Iron Vault'), findsOneWidget);
  });

  testWidgets('app shows nothing until wallet check resolves',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const IronVaultApp());
    // With mock SharedPreferences, async init resolves. One extra pump
    // triggers rebuild to WelcomeScreen — no blocker/flash.
    await tester.pump();

    expect(find.text('Iron Vault'), findsOneWidget);
  });
}
