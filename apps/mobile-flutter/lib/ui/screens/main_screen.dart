import 'package:flutter/material.dart';

import '../../app/app_state.dart';
import '../../core/interfaces/wallet_service.dart';
import '../../generated/l10n/app_localizations.dart';
import '../theme/color_tokens.dart';
import 'accounts/accounts_tab.dart';
import 'ble/ble_screen.dart';
import 'history/history_screen.dart';
import 'settings/settings_screen.dart';

/// Main screen with bottom navigation — the app's home after unlock.
///
/// Four tabs:
/// - **Accounts** — wallet accounts grouped by chain
/// - **BLE** — BLE peripheral status, toggle, and log
/// - **History** — past signing operations
/// - **Settings** — theme, security, BLE name, about
///
/// Uses [IndexedStack] to preserve tab state across switches.
/// Navigation to sub-pages (AccountDetail, SetPin, BackupSeed, Transaction)
/// is handled by pushing on top of this screen via `context.push()`.
class MainScreen extends StatefulWidget {
  final AppState? appState;
  final IWalletService? walletService;

  const MainScreen({super.key, this.appState, this.walletService});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  String _tabTitle(int index, AppLocalizations l10n) {
    switch (index) {
      case 0:
        return l10n.vaultTitle;
      case 3:
        return l10n.settings;
      case 1:
        return 'BLE';
      case 2:
        return l10n.historyTab;
      default:
        return '';
    }
  }

  // ── Tab pages (created once, preserved by IndexedStack) ───────────

  late final List<Widget> _tabs = [
    AccountsTab(walletService: widget.walletService),
    BleScreen(appState: widget.appState),
    HistoryScreen(appState: widget.appState),
    Builder(
      builder: (context) => SettingsScreen(
        settingsService: widget.appState?.settingsService,
        walletService: widget.walletService,
        isTab: true,
      ),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        backgroundColor: c.bg,
        surfaceTintColor: Colors.transparent,
        title: Text(
          _tabTitle(_currentIndex, l10n),
          style: TextStyle(
            color: c.text,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: c.surface,
        selectedItemColor: c.primary,
        unselectedItemColor: c.text.withAlpha(120),
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            activeIcon: const Icon(Icons.account_balance_wallet),
            label: l10n.vaultTitle,
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.bluetooth_outlined),
            activeIcon: Icon(Icons.bluetooth),
            label: 'BLE',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.history_outlined),
            activeIcon: const Icon(Icons.history),
            label: l10n.historyTab,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.settings_outlined),
            activeIcon: const Icon(Icons.settings),
            label: l10n.settings,
          ),
        ],
      ),
    );
  }
}
