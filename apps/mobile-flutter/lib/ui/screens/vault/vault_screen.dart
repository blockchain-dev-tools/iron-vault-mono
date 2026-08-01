import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_state.dart';
import '../../../core/interfaces/wallet_service.dart';
import '../../../core/models/ble_types.dart';
import '../../../core/models/wallet_accounts.dart';
import '../../../generated/l10n/app_localizations.dart';
import '../../../utils/formatting.dart';
import '../../theme/color_tokens.dart';
import 'components/ble_log_view.dart';

/// Main wallet dashboard showing accounts across 5 chains + BLE controls.
///
/// Displays expandable cards for Ethereum, Solana, Bitcoin, Tron, and Sui.
/// Each card shows the chain name and account count; expanded view lists
/// account addresses with copy-to-clipboard icons.
///
/// Navigation:
/// - Settings gear → `context.go('/settings')`
/// - Account tap → `context.go('/account/:index', extra: ChainAccount)`
///
/// The floating action button opens a BLE control panel (visual-only stubs
/// for Phase 3; real BLE implementation arrives in Phase 4).
///
/// Ported from iron-vault-mono `apps/mobile/src/screens/WalletManager.tsx`.
class VaultScreen extends StatefulWidget {
  /// Optional wallet service for fetching accounts.
  ///
  /// When `null`, the screen shows a "No accounts yet" placeholder.
  final IWalletService? walletService;

  /// Application state for BLE peripheral control.
  final AppState? appState;

  const VaultScreen({super.key, this.walletService, this.appState});

  @override
  State<VaultScreen> createState() => _VaultScreenState();
}

class _VaultScreenState extends State<VaultScreen> {
  /// Which chain sections are expanded (keyed by chain name).
  final Set<String> _expandedChains = {};

  /// Subscription to BLE log stream from BlePeripheral.
  StreamSubscription<String>? _bleLogSub;

  /// Accumulated BLE log entries from the live stream.
  final List<String> _bleLogEntries = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ble = widget.appState?.blePeripheral;
      if (ble != null) {
        setState(() {}); // trigger initial state read
        _bleLogSub = ble.logStream.listen((log) {
          setState(() {
            _bleLogEntries.add(log);
          });
        });
      }
    });
  }

  @override
  void dispose() {
    _bleLogSub?.cancel();
    super.dispose();
  }

  /// Canonical chain order matching iron-vault-mono.
  static const _chainOrder = [
    'ethereum',
    'solana',
    'bitcoin',
    'tron',
    'sui',
  ];

  /// Canonical default derivation paths per chain (mirrors IAccountService.defaultPaths).
  static const _chainDefaultPaths = <String, String>{
    'ethereum': "m/44'/60'/0'/0/0",
    'solana': "m/44'/501'/0'/0'",
    'bitcoin': "m/84'/0'/0'/0/0",
    'tron': "m/44'/195'/0'/0/0",
    'sui': "m/44'/784'/0'/0'/0'",
  };

  // ── Helpers ─────────────────────────────────────────────────────────

  WalletAccounts? get _accounts => widget.walletService?.getAccounts();

  /// Groups [ChainAccount] items by their `chain` field.
  Map<String, List<ChainAccount>> _groupByChain(WalletAccounts accounts) {
    final map = <String, List<ChainAccount>>{
      for (final ch in _chainOrder) ch: <ChainAccount>[],
    };
    for (final acct in accounts.accounts) {
      map.putIfAbsent(acct.chain, () => []).add(acct);
    }
    return map;
  }

  int _accountIndex(String chain, int localIndex) {
    final all = _accounts?.accounts ?? [];
    int found = 0;
    for (int i = 0; i < all.length; i++) {
      if (all[i].chain == chain) {
        if (found == localIndex) return i;
        found++;
      }
    }
    return localIndex; // fallback
  }

  // ── BLE control ────────────────────────────────────────────────────

  void _toggleBle() {
    final appState = widget.appState;
    final ble = appState?.blePeripheral;
    if (ble == null) return;

    setState(() {
      if (ble.state == BleState.broadcasting || ble.state == BleState.connected) {
        appState?.stopBleAdvertising();
      } else {
        appState?.startBleAdvertising();
      }
    });
  }

  void _showBleLogSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    showModalBottomSheet(
      context: context,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(R.xl)),
      ),
      builder: (_) => BleLogView(log: _bleLogEntries, c: c),
    );
  }

  // ── Navigation ──────────────────────────────────────────────────────

  void _goToSettings() => context.push('/settings');

  void _goToAccount(String chain, int localIndex) {
    final grouped = _groupByChain(_accounts!);
    final list = grouped[chain] ?? [];
    if (localIndex < list.length) {
      final idx = _accountIndex(chain, localIndex);
      context.push('/account/$idx', extra: list[localIndex]);
    }
  }

  void _copyAddress(String address) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tokens = isDark ? ColorTokens.dark : ColorTokens.light;
    Clipboard.setData(ClipboardData(text: address));
    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(l10n.copiedToClipboard, style: TextStyle(color: tokens.onBg)),
        backgroundColor: tokens.primary,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  // ── Build ───────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    final accounts = _accounts;

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.vaultTitle,
          style: TextStyle(
            color: c.text,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            key: const Key('settings-btn'),
            icon: Icon(Icons.settings, color: c.text),
            onPressed: _goToSettings,
          ),
        ],
      ),
      floatingActionButton: _buildBleFab(c),
      body: accounts == null
          ? _buildEmptyState(c)
          : _buildAccountList(c, accounts),
    );
  }

  /// Placeholder shown when no wallet service or no accounts.
  Widget _buildEmptyState(ColorTokens c) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.account_balance_wallet_outlined,
                size: 64, color: c.text.withAlpha(60)),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.noAccounts,
              style: TextStyle(
                color: c.text.withAlpha(120),
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create or import a wallet to get started.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.text.withAlpha(80),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Scrollable list of chain sections.
  Widget _buildAccountList(ColorTokens c, WalletAccounts accounts) {
    final grouped = _groupByChain(accounts);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80), // space for FAB
      children: [
        // ── Wallet fingerprint info ─────────────────────────────────
        _buildFingerprintBanner(c, accounts),

        const SizedBox(height: 12),

        // ── Chain sections ─────────────────────────────────────────
        for (final chain in _chainOrder)
          _buildChainSection(c, chain, grouped[chain] ?? []),
      ],
    );
  }

  /// Small banner showing mnemonic fingerprint.
  Widget _buildFingerprintBanner(ColorTokens c, WalletAccounts accounts) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: c.primary.withAlpha(12),
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.primary.withAlpha(40)),
      ),
      child: Row(
        children: [
          Icon(Icons.fingerprint, size: 20, color: c.primary.withAlpha(160)),
          const SizedBox(width: 10),
          Text(
            'Wallet: ${accounts.mnemonicFingerprint}',
            style: TextStyle(
              color: c.text.withAlpha(160),
              fontSize: 13,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  /// Expandable card for a single chain.
  Widget _buildChainSection(
      ColorTokens c, String chain, List<ChainAccount> accounts) {
    final label = chainLabel(chain);
    final icon = chainIcon(chain);
    final expanded = _expandedChains.contains(chain);
    final count = accounts.length;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(R.lg),
          border: Border.all(color: c.border.withAlpha(80)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // ── Header (always visible) ─────────────────────────────
            GestureDetector(
              key: ValueKey('chain-header-$chain'),
              onTap: () {
                setState(() {
                  if (expanded) {
                    _expandedChains.remove(chain);
                  } else {
                    _expandedChains.add(chain);
                  }
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: c.primary.withAlpha(20),
                        borderRadius: BorderRadius.circular(R.sm),
                      ),
                      child: Icon(icon, color: c.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            label,
                            style: TextStyle(
                              color: c.text,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$count account${count == 1 ? '' : 's'}',
                            style: TextStyle(
                              color: c.text.withAlpha(120),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    AnimatedRotation(
                      turns: expanded ? 0.25 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.chevron_right,
                        color: c.text.withAlpha(100),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Expanded account list ───────────────────────────────
            AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              alignment: Alignment.topCenter,
              child: expanded
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Divider(height: 1),
                        ...accounts.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final acct = entry.value;
                          return _buildAccountRow(c, chain, idx, acct, count);
                        }),
                        // "Add Account" button
                        Container(
                          width: double.infinity,
                          padding:
                              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          child: GestureDetector(
                            onTap: () => _addAccount(chain),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: c.primary.withAlpha(60),
                                ),
                                borderRadius: BorderRadius.circular(R.sm),
                              ),
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add,
                                      size: 18,
                                      color: c.primary.withAlpha(180)),
                                  const SizedBox(width: 6),
                                  Text(
                                    AppLocalizations.of(context)!.addAccount,
                                    style: TextStyle(
                                      color: c.primary.withAlpha(200),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  /// A single account row inside an expanded chain section.
  Widget _buildAccountRow(ColorTokens c, String chain, int localIndex,
      ChainAccount acct, int totalCount) {
    final isLast = localIndex == totalCount - 1;

    return GestureDetector(
      onTap: () => _goToAccount(chain, localIndex),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : Border(
                  bottom: BorderSide(color: c.border),
                ),
        ),
        child: Row(
          children: [
            // ── Derivation path badge ───────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: c.text.withAlpha(12),
                borderRadius: BorderRadius.circular(R.sm),
              ),
              child: Text(
                acct.derivationPath.split('/').last,
                style: TextStyle(
                  color: c.text.withAlpha(140),
                  fontSize: 11,
                  fontFamily: 'monospace',
                ),
              ),
            ),

            const SizedBox(width: 10),

            // ── Address ─────────────────────────────────────────────
            Expanded(
              child: Text(
                _truncateAddress(acct.address),
                style: TextStyle(
                  color: c.text.withAlpha(180),
                  fontSize: 13,
                  fontFamily: 'monospace',
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // ── Copy button ─────────────────────────────────────────
            GestureDetector(
              onTap: () => _copyAddress(acct.address),
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: Icon(
                  Icons.copy,
                  size: 16,
                  color: c.text.withAlpha(100),
                ),
              ),
            ),

            // ── BLE indicator ───────────────────────────────────────
            if (acct.bleEnabled)
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Icon(
                  Icons.bluetooth,
                  size: 14,
                  color: c.primary.withAlpha(160),
                ),
              ),

            const SizedBox(width: 2),
            Icon(Icons.chevron_right, size: 18, color: c.text.withAlpha(60)),
          ],
        ),
      ),
    );
  }

  // ── BLE FAB ─────────────────────────────────────────────────────────

  Widget _buildBleFab(ColorTokens c) {
    final ble = widget.appState?.blePeripheral;
    final bleActive = ble != null &&
        (ble.state == BleState.broadcasting || ble.state == BleState.connected);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // BLE log button
        FloatingActionButton(
          heroTag: 'ble-log',
          mini: true,
          backgroundColor: c.surface,
          onPressed: _showBleLogSheet,
          child: Icon(Icons.list_alt, color: c.text.withAlpha(160)),
        ),
        const SizedBox(height: 8),
        // BLE toggle button
        FloatingActionButton(
          heroTag: 'ble-toggle',
          backgroundColor: bleActive ? c.primary : c.surface,
          onPressed: _toggleBle,
          child: Icon(
            bleActive ? Icons.bluetooth : Icons.bluetooth_disabled,
            color: bleActive ? c.onPrimary : c.text.withAlpha(160),
          ),
        ),
      ],
    );
  }

  // ── Account management ─────────────────────────────────────────────

  /// Compute the next derivation path for the given [chain] based on
  /// existing accounts, incrementing the appropriate path component.
  String _nextPathForChain(String chain, List<ChainAccount> accounts) {
    final defaultPath = _chainDefaultPaths[chain]!;
    final parts = defaultPath.split('/');

    // Find the highest existing index for this chain.
    int maxIdx = -1;
    for (final acct in accounts) {
      int idx;
      if (chain == 'solana' || chain == 'sui') {
        // 3rd segment is the hardened account index (e.g. "0'").
        idx = int.tryParse(acct.derivationPath.split('/')[3].replaceAll("'", '')) ?? -1;
      } else {
        // Last segment is the non-hardened address index.
        idx = int.tryParse(acct.derivationPath.split('/').last) ?? -1;
      }
      if (idx > maxIdx) maxIdx = idx;
    }

    final nextIdx = maxIdx + 1;
    if (chain == 'solana' || chain == 'sui') {
      parts[3] = "$nextIdx'";
    } else {
      parts[parts.length - 1] = '$nextIdx';
    }
    return parts.join('/');
  }

  /// Derive and persist a new account for the given [chain].
  Future<void> _addAccount(String chain) async {
    final ws = widget.walletService;
    if (ws == null) return;

    final grouped = _accounts != null ? _groupByChain(_accounts!) : {};
    final chainAccounts = grouped[chain] ?? [];
    final nextPath = _nextPathForChain(chain, chainAccounts);

    try {
      await ws.addAccount(chain, nextPath);
      setState(() {});
    } catch (e) {
      if (!mounted) return;
      final isDark = Theme.of(context).brightness == Brightness.dark;
      final c = isDark ? ColorTokens.dark : ColorTokens.light;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLocalizations.of(context)!.error}: $e'),
          backgroundColor: c.error,
        ),
      );
    }
  }

  /// Truncate address to a readable form (first 7 … last 5).
  static String _truncateAddress(String address) {
    if (address.length <= 14) return address;
    return '${address.substring(0, 7)}…${address.substring(address.length - 5)}';
  }
}


