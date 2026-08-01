import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app/app_state.dart';
import '../ui/screens/account_detail/account_detail_screen.dart';
import '../ui/screens/backup_seed/backup_seed_screen.dart';
import '../ui/screens/enigma/enigma_screen.dart';
import '../ui/screens/enigma_mnemonic/enigma_mnemonic_screen.dart';
import '../ui/screens/entropy/entropy_screen.dart';
import '../ui/screens/generate_mnemonic/generate_mnemonic_screen.dart';
import '../ui/screens/import_mnemonic/import_mnemonic_screen.dart';
import '../ui/screens/set_pin/set_pin_screen.dart';
import '../ui/screens/transaction/transaction_screen.dart';
import '../ui/screens/transaction/signature_result_screen.dart';
import '../ui/screens/unlock/unlock_screen.dart';
import '../ui/screens/main_screen.dart';
import '../ui/screens/verify_mnemonic/verify_mnemonic_screen.dart';
import '../ui/screens/welcome/welcome_screen.dart';

/// Creates a [GoRouter] that handles navigation for the entire app.
///
/// [initialHasWallet] controls the initial route:
/// - `true` → `/unlock` (cold start with wallet)
/// - `false` → `/welcome` (fresh install)
///
/// Auth flow rules (matching AGENTS.md):
/// - Auth success → `context.go('/')` (replaces entire stack, goes to tabbed main screen)
/// - Reset wallet → `context.go('/welcome')` (replaces entire stack)
/// - Back buttons → `context.pop()`
///
/// Navigation through GoRouter means using `context.go()` instead of
/// `Navigator.pushAndRemoveUntil` — `go()` replaces the entire route stack.
GoRouter createRouter({required bool initialHasWallet, AppState? appState}) {
  return GoRouter(
    initialLocation: initialHasWallet ? '/unlock' : '/welcome',
    routes: [
      // ── Welcome (landing) ────────────────────────────────────────
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      // ── Wallet Creation Flow ─────────────────────────────────────
      GoRoute(
        path: '/entropy',
        builder: (context, state) => EntropyScreen(mnemonicService: appState?.mnemonicService),
      ),
      GoRoute(
        path: '/generate-mnemonic',
        builder: (context, state) => GenerateMnemonicScreen(
          mnemonic: state.extra as String,
        ),
      ),
      GoRoute(
        path: '/verify-mnemonic',
        builder: (context, state) {
          Map<String, String> creationData;
          final extra = state.extra;
          if (extra is Map) {
            creationData = Map<String, String>.from(extra);
          } else {
            creationData = {'mnemonic': extra as String, 'passphrase': ''};
          }
          return VerifyMnemonicScreen(creationData: creationData);
        },
      ),

      // ── Wallet Import ────────────────────────────────────────────
      GoRoute(
        path: '/import',
        builder: (context, state) => ImportMnemonicScreen(mnemonicService: appState?.mnemonicService),
      ),

      // ── PIN Setup / Change ───────────────────────────────────────
      GoRoute(
        path: '/set-pin',
        builder: (context, state) {
          String? mnemonic;
          String passphrase = '';
          final extra = state.extra;
          if (extra is Map) {
            mnemonic = extra['mnemonic'] as String?;
            passphrase = (extra['passphrase'] as String?) ?? '';
          } else {
            mnemonic = extra as String?;
          }
          return SetPinScreen(
            mnemonic: mnemonic,
            passphrase: passphrase,
            walletService: appState?.walletService,
          );
        },
      ),

      // ── Main Screen (tabbed: Accounts / BLE / Settings) ─────────
      GoRoute(
        path: '/',
        builder: (context, state) => MainScreen(
          walletService: appState?.walletService,
          appState: appState,
        ),
      ),

      // ── Account Detail (with :id parameter) ──────────────────────
      GoRoute(
        path: '/account/:id',
        builder: (context, state) {
          final accountId = state.pathParameters['id'] ?? '0';
          return AccountDetailScreen(key: ValueKey(accountId));
        },
      ),

      // ── Transaction Signing Confirmation ─────────────────────────
      GoRoute(
        path: '/transaction',
        builder: (context, state) => TransactionScreen(
          appState: appState,
        ),
      ),

      // ── Signature Result ─────────────────────────────────────────
      GoRoute(
        path: '/signature-result',
        builder: (context, state) => SignatureResultScreen(
          appState: appState,
        ),
      ),

      // ── Unlock ───────────────────────────────────────────────────
      GoRoute(
        path: '/unlock',
        builder: (context, state) => UnlockScreen(
          walletService: appState?.walletService,
        ),
      ),

      // ── Backup Seed ──────────────────────────────────────────────
      GoRoute(
        path: '/backup-seed',
        builder: (context, state) => BackupSeedScreen(
          walletService: appState?.walletService,
        ),
      ),

      // ── Enigma Flow ──────────────────────────────────────────────
      GoRoute(
        path: '/enigma',
        builder: (context, state) => const EnigmaScreen(),
      ),
      GoRoute(
        path: '/enigma-mnemonic',
        builder: (context, state) => const EnigmaMnemonicScreen(),
      ),
    ],

    // ── Error page (unknown routes) ────────────────────────────────
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(title: const Text('Not Found')),
      body: Center(
        child: Text(
          'No route for ${state.uri}',
          style: const TextStyle(color: Colors.white),
        ),
      ),
    ),
  );
}
