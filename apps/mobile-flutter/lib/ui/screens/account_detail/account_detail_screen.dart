import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../generated/l10n/app_localizations.dart';
import '../../../utils/formatting.dart';
import '../../theme/color_tokens.dart';
import '../../widgets/common/copy_button.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/models/wallet_accounts.dart';

/// Shows account details: address, QR code, derivation path, BLE toggle.
///
/// Receives [ChainAccount] via [GoRouterState.extra] (passed from
/// [VaultScreen]). Falls back to a placeholder view when no extra is
/// provided (e.g. direct deep-link to `/account/:id`).
///
/// Signing is triggered by BLE-connected wallet clients (OKX Wallet, etc.)
/// via APDU commands — no in-app "Sign" button.
///
/// Ported from iron-vault-mono `apps/mobile/src/screens/AccountDetail.tsx`.
class AccountDetailScreen extends StatelessWidget {
  const AccountDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;

    // Resolve account from GoRouter extra (passed by VaultScreen).
    final state = GoRouterState.of(context);
    final account = state.extra is ChainAccount ? state.extra as ChainAccount : null;

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.accountDetail,
          style: TextStyle(
            color: c.text,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: c.text),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            }
          },
        ),
      ),
      body: account == null
          ? _buildPlaceholder(context, c)
          : _buildContent(context, c, account),
    );
  }

  /// Placeholder shown when no account data is available.
  Widget _buildPlaceholder(BuildContext context, ColorTokens c) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.qr_code, size: 64, color: c.text.withAlpha(60)),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.noAccountSelected,
            style: TextStyle(
              color: c.text.withAlpha(120),
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  /// Full account detail body.
  Widget _buildContent(
      BuildContext context, ColorTokens c, ChainAccount account) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // ── Chain badge ──────────────────────────────────────────
          _buildChainBadge(c, account.chain),

          const SizedBox(height: 24),

          // ── Address card ──────────────────────────────────────────
          _buildAddressCard(context, c, account.address),

          const SizedBox(height: 24),

          // ── QR code ──────────────────────────────────────────────
          _buildQrCode(c, account.address),

          const SizedBox(height: 24),

          // ── Derivation path ──────────────────────────────────────
          _buildDerivationPath(context, c, account.derivationPath),

          const SizedBox(height: 20),

          // ── Public key ───────────────────────────────────────────
          if (account.publicKey.isNotEmpty) _buildPublicKey(context, c, account.publicKey),

          // (Sign Transaction button removed — signing flows through BLE)
        ],
      ),
    );
  }

  // ── Sub-widgets ─────────────────────────────────────────────────────

  /// Chain name badge with icon.
  Widget _buildChainBadge(ColorTokens c, String chain) {
    final label = chainLabel(chain);
    final icon = chainIcon(chain);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: c.primary.withAlpha(20),
        borderRadius: BorderRadius.circular(R.xl),
        border: Border.all(color: c.primary.withAlpha(40)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: c.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: c.primary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// Address display card with copy-to-clipboard button.
  Widget _buildAddressCard(
      BuildContext context, ColorTokens c, String address) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        children: [
          // ── Address title ────────────────────────────────────────
          Text(
            AppLocalizations.of(context)!.address,
            style: TextStyle(
              color: c.text.withAlpha(120),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),

          // ── Address text (monospace) ─────────────────────────────
          SelectableText(
            address,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: c.text,
              fontSize: 16,
              fontFamily: 'monospace',
              height: 1.5,
              letterSpacing: 0.5,
            ),
          ),

          const SizedBox(height: 12),

          // ── Copy button ──────────────────────────────────────────
          CopyButton(
            text: address,
            label: AppLocalizations.of(context)!.copyAddress,
            successMessage: AppLocalizations.of(context)!.copiedToClipboard,
          ),
        ],
      ),
    );
  }

  /// QR code (200×200) encoding the account address.
  Widget _buildQrCode(ColorTokens c, String address) {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(R.lg),
      ),
      padding: const EdgeInsets.all(12),
      child: QrImageView(
        data: address,
        version: QrVersions.auto,
        size: 176,
        backgroundColor: Colors.white,
        eyeStyle: const QrEyeStyle(
          eyeShape: QrEyeShape.square,
          color: Colors.black,
        ),
        dataModuleStyle: const QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.square,
          color: Colors.black,
        ),
      ),
    );
  }

  /// Derivation path label.
  Widget _buildDerivationPath(BuildContext context, ColorTokens c, String path) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Row(
        children: [
          Icon(Icons.route, size: 18, color: c.text.withAlpha(100)),
          const SizedBox(width: 10),
          Text(
            AppLocalizations.of(context)!.derivationPath,
            style: TextStyle(
              color: c.text.withAlpha(120),
              fontSize: 13,
            ),
          ),
          const Spacer(),
          Text(
            path,
            style: TextStyle(
              color: c.text,
              fontSize: 13,
              fontFamily: 'monospace',
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Public key display.
  Widget _buildPublicKey(BuildContext context, ColorTokens c, String pubKey) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context)!.publicKey,
            style: TextStyle(
              color: c.text.withAlpha(120),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          SelectableText(
            pubKey,
            style: TextStyle(
              color: c.text.withAlpha(160),
              fontSize: 12,
              fontFamily: 'monospace',
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

}


