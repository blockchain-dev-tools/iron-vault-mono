import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../generated/l10n/app_localizations.dart';
import '../../theme/color_tokens.dart';
import '../../theme/widgets/ledger_logo.dart';
import 'components/entry_card.dart';

/// Welcome screen — the app's landing page with three wallet entry points.
///
/// Ported from iron-vault-mono `apps/mobile/src/screens/Welcome.tsx`.
/// Displays the Ledger logo, app title, subtitle, and three styled action cards:
/// Create New Wallet, Import Existing, Enigma Setup.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;

    return Scaffold(
      backgroundColor: c.bg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final topPadding = constraints.maxHeight * 0.12;

            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: Padding(
                  padding: EdgeInsets.only(top: topPadding),
                  child: Column(
                    children: [
                      // ── Ledger Logo ──────────────────────────────
                      const LedgerLogo(size: 120),

                      const SizedBox(height: 32),

                      // ── App Title ─────────────────────────────────
                      Text(
                        l10n.appTitle,
                        style: TextStyle(
                          color: c.text,
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),

                      const SizedBox(height: 10),

                      // ── Subtitle ──────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 48),
                        child: Text(
                          l10n.welcomeSubtitle,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: c.text.withAlpha(180),
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ),

                      const SizedBox(height: 48),

                      // ── Action Cards ──────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          children: [
                            EntryCard(
                              key: const Key('entry-create'),
                              icon: Icons.add_circle_outline,
                              title: l10n.createWallet,
                              description: l10n.generateWithTouch,
                              onTap: () => context.go('/entropy'),
                            ),
                            const SizedBox(height: 12),
                            EntryCard(
                              key: const Key('entry-import'),
                              icon: Icons.download,
                              title: l10n.importWallet,
                              description: l10n.restoreFromSeed,
                              onTap: () => context.go('/import'),
                            ),
                            const SizedBox(height: 12),
                            EntryCard(
                              key: const Key('entry-enigma'),
                              icon: Icons.shield,
                              title: l10n.enigmaWallet,
                              description: l10n.advancedEnigma,
                              onTap: () => context.go('/enigma'),
                            ),
                          ],
                        ),
                      ),

                      // Bottom spacer so content isn't jammed at bottom
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

}
