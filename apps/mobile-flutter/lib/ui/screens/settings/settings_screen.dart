import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../services/settings_service.dart';
import '../../../core/interfaces/wallet_service.dart';
import '../../../generated/l10n/app_localizations.dart';
import '../../theme/color_tokens.dart';
import '../../widgets/common/section_header.dart';

/// App settings: theme toggle, language selection, security options,
/// BLE device name configuration, and about section.
///
/// Ported from iron-vault-mono `apps/mobile/src/screens/Settings.tsx`.
///
/// When [isTab] is true, renders as a scaffold-less content widget
/// (for use inside a bottom navigation tab). When false (default),
/// renders as a full-screen page with its own AppBar and back button.
class SettingsScreen extends StatefulWidget {
  final SettingsService? settingsService;
  final IWalletService? walletService;
  final bool isTab;

  const SettingsScreen({
    super.key,
    this.settingsService,
    this.walletService,
    this.isTab = false,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  /// Local tracking of the current BLE device name.
  String _bleName = 'Iron Vault';

  /// Whether the current theme is dark (derived from [SettingsService]).
  bool _isDarkMode = true;

  /// Currently selected locale (tracked for language tile subtitle).
  Locale _currentLocale = const Locale('en');

  @override
  void initState() {
    super.initState();
    _syncThemeMode();
    widget.settingsService?.addListener(_onSettingsChanged);
  }

  @override
  void dispose() {
    widget.settingsService?.removeListener(_onSettingsChanged);
    super.dispose();
  }

  void _onSettingsChanged() {
    _syncThemeMode();
  }

  void _syncThemeMode() {
    final svc = widget.settingsService;
    if (svc != null) {
      setState(() {
        _isDarkMode = svc.themeMode == ThemeMode.dark;
        _currentLocale = svc.locale;
      });
    }
  }

  /// Toggles between dark and light theme by delegating to [SettingsService].
  void _toggleTheme() {
    widget.settingsService?.toggleTheme();
  }

  /// Shows a dialog to edit the BLE device name.
  void _editBleName() {
    final controller = TextEditingController(text: _bleName);
    final isDark = widget.settingsService?.themeMode == ThemeMode.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    showDialog(
      context: context,
      builder: (ctx) {
        final l10n = AppLocalizations.of(context)!;
        return AlertDialog(
          backgroundColor: c.surface,
          title: Text(l10n.bleName, style: TextStyle(color: c.text)),
          content: TextField(
            controller: controller,
            autofocus: true,
            maxLength: 20,
            style: TextStyle(color: c.text),
            decoration: InputDecoration(
              hintText: l10n.bleNameHint,
              hintStyle: TextStyle(color: c.text.withAlpha(100)),
              filled: true,
              fillColor: c.bg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(R.sm),
                borderSide: BorderSide(color: c.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(R.sm),
                borderSide: BorderSide(color: c.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(R.sm),
                borderSide: BorderSide(color: c.primary),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(
                l10n.cancel,
                style: TextStyle(color: c.text.withAlpha(150)),
              ),
            ),
            TextButton(
              onPressed: () {
                setState(() => _bleName = controller.text.trim().isEmpty
                    ? 'Iron Vault'
                    : controller.text.trim());
                Navigator.of(ctx).pop();
              },
              child: Text(
                l10n.done,
                style: TextStyle(color: c.primary),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Returns the display name of the currently active locale.
  String _currentLanguageName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (_currentLocale.languageCode) {
      case 'en':
        return l10n.languageEnglish;
      case 'zh':
        return l10n.languageChinese;
      case 'ja':
        return l10n.languageJapanese;
      case 'ko':
        return l10n.languageKorean;
      default:
        return l10n.languageEnglish;
    }
  }

  /// Shows a language selection dialog.
  void _showLanguagePicker(BuildContext context) {
    final c = _isDarkMode ? ColorTokens.dark : ColorTokens.light;
    final l10n = AppLocalizations.of(context)!;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: c.surface,
          title: Text(l10n.language, style: TextStyle(color: c.text)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _languageOption(ctx, c, l10n, const Locale('en'), l10n.languageEnglish),
              _languageOption(ctx, c, l10n, const Locale('zh'), l10n.languageChinese),
              _languageOption(ctx, c, l10n, const Locale('ja'), l10n.languageJapanese),
              _languageOption(ctx, c, l10n, const Locale('ko'), l10n.languageKorean),
            ],
          ),
        );
      },
    );
  }

  /// A single language option row in the language picker dialog.
  Widget _languageOption(
    BuildContext ctx,
    ColorTokens c,
    AppLocalizations l10n,
    Locale locale,
    String label,
  ) {
    final selected = _currentLocale.languageCode == locale.languageCode;
    return ListTile(
      leading: Icon(
        selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
        color: selected ? c.primary : c.text.withAlpha(100),
        size: 22,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: selected ? c.primary : c.text,
          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      onTap: () {
        widget.settingsService?.setLocale(locale);
        Navigator.of(ctx).pop();
      },
    );
  }

  /// Shows a confirmation dialog before resetting the wallet.
  void _confirmResetWallet() {
    final isDark = widget.settingsService?.themeMode == ThemeMode.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    showDialog(
      context: context,
      builder: (ctx) {
        final l10n = AppLocalizations.of(context)!;
        return AlertDialog(
          backgroundColor: c.surface,
          title: Text(l10n.resetWalletTitle, style: TextStyle(color: c.text)),
          content: Text(
            l10n.resetWalletConfirm,
            style: TextStyle(color: c.text.withAlpha(200), fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(
                l10n.cancel,
                style: TextStyle(color: c.text.withAlpha(150)),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _resetWallet();
              },
              child: Text(
                l10n.reset,
                style: TextStyle(color: c.error),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Clears all wallet data and navigates to the Welcome screen.
  Future<void> _resetWallet() async {
    await widget.walletService?.clearWallet();
    if (mounted) context.go('/welcome');
  }

  @override
  Widget build(BuildContext context) {
    final c = _isDarkMode ? ColorTokens.dark : ColorTokens.light;

    final content = ListView(
      padding: const EdgeInsets.all(24),
      children: [
            // ── Section: Appearance ──────────────────────────────
            SectionHeader(title: AppLocalizations.of(context)!.appearance),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.palette,
              title: AppLocalizations.of(context)!.theme,
              subtitle: _isDarkMode
                  ? AppLocalizations.of(context)!.darkMode
                  : AppLocalizations.of(context)!.lightMode,
              onTap: _toggleTheme,
              trailing: Switch(
                value: _isDarkMode,
                onChanged: (_) => _toggleTheme(),
                activeTrackColor: c.primary.withAlpha(120),
                activeThumbColor: c.primary,
              ),
            ),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.language,
              title: AppLocalizations.of(context)!.language,
              subtitle: _currentLanguageName(context),
              onTap: () => _showLanguagePicker(context),
            ),

            const SizedBox(height: 28),

            // ── Section: Security ─────────────────────────────────
            SectionHeader(title: AppLocalizations.of(context)!.security),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.lock_outline,
              title: AppLocalizations.of(context)!.changePin,
              subtitle: AppLocalizations.of(context)!.changePin,
              onTap: () => context.go('/set-pin'),
            ),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.delete_outline,
              title: AppLocalizations.of(context)!.resetWalletTitle,
              subtitle: AppLocalizations.of(context)!.deleteAllWalletData,
              onTap: _confirmResetWallet,
              iconColor: c.error,
            ),

            const SizedBox(height: 28),

            // ── Section: BLE ──────────────────────────────────────
            SectionHeader(title: AppLocalizations.of(context)!.bluetooth),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.bluetooth,
              title: AppLocalizations.of(context)!.bleName,
              subtitle: _bleName,
              onTap: _editBleName,
            ),

            const SizedBox(height: 28),

            // ── Section: About ────────────────────────────────────
            SectionHeader(title: AppLocalizations.of(context)!.about),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.info_outline,
              title: AppLocalizations.of(context)!.appTitle,
              subtitle: '${AppLocalizations.of(context)!.version} 0.1.0',
              enabled: false,
            ),
            const SizedBox(height: 8),
            _settingsTile(
              c,
              icon: Icons.code,
              title: AppLocalizations.of(context)!.ledgerCompatible,
              subtitle: AppLocalizations.of(context)!.welcomeSubtitle,
              enabled: false,
            ),

            const SizedBox(height: 24),
          ],
        );

    // When used as a tab, render content directly (no Scaffold/AppBar).
    // The parent MainScreen provides the Scaffold.
    if (widget.isTab) {
      return content;
    }

    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: c.bg,
        appBar: AppBar(
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: c.text),
            onPressed: () => context.pop(),
          ),
          title: Text(AppLocalizations.of(context)!.settingsTitle),
        ),
        body: SafeArea(child: content),
      ),
    );
  }

  /// A single settings tile row.
  ///
  /// Displays an [icon], [title], [subtitle], optional [trailing] widget,
  /// and responds to [onTap]. When [enabled] is false, the tile is muted.
  Widget _settingsTile(
    ColorTokens c, {
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
    Widget? trailing,
    bool enabled = true,
    Color? iconColor,
  }) {
    final effectiveColor = enabled ? c.text : c.text.withAlpha(80);
    final effectiveSubColor = enabled
        ? c.text.withAlpha(130)
        : c.text.withAlpha(60);

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(R.lg),
          border: Border.all(
            color: enabled ? c.border : c.border.withAlpha(60),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: iconColor ?? (enabled ? c.primary : c.text.withAlpha(60)),
              size: 22,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: effectiveColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: effectiveSubColor,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null)
              trailing
            else if (enabled && onTap != null)
              Icon(Icons.chevron_right, color: c.text.withAlpha(80), size: 20),
          ],
        ),
      ),
    );
  }
}
