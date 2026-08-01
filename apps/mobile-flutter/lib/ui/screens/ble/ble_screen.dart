import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/app_state.dart';
import '../../../core/models/ble_types.dart';
import '../../../generated/l10n/app_localizations.dart';
import '../../theme/color_tokens.dart';

/// BLE peripheral status and control tab.
///
/// Displays the current BLE state (idle / broadcasting / connected),
/// a toggle button, and a live log of BLE activity.
///
/// BLE log stream is subscribed in [initState] and unsubscribed
/// in [dispose] — state is local to this tab.
class BleScreen extends StatefulWidget {
  final AppState? appState;

  const BleScreen({super.key, this.appState});

  @override
  State<BleScreen> createState() => _BleScreenState();
}

class _BleScreenState extends State<BleScreen> {
  StreamSubscription<String>? _logSub;
  final List<String> _logEntries = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ble = widget.appState?.blePeripheral;
      if (ble != null) {
        _logSub = ble.logStream.listen((log) {
          setState(() => _logEntries.add(log));
        });
        setState(() {}); // trigger initial render with current state
      }
    });
  }

  @override
  void dispose() {
    _logSub?.cancel();
    super.dispose();
  }

  // ── BLE toggle ─────────────────────────────────────────────────────

  void _toggleBle() {
    final appState = widget.appState;
    final ble = appState?.blePeripheral;
    if (ble == null) return;

    setState(() {
      if (ble.state == BleState.broadcasting ||
          ble.state == BleState.connected) {
        appState?.stopBleAdvertising();
      } else {
        appState?.startBleAdvertising();
      }
    });
  }

  // ── Build ──────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;
    final ble = widget.appState?.blePeripheral;

    // Rebuild when AppState changes (BLE peripheral state updates).
    return ListenableBuilder(
      listenable: widget.appState ?? ChangeNotifier(),
      builder: (context, _) {
        final bleState = ble?.state ?? BleState.idle;
        final bleActive = bleState == BleState.broadcasting ||
            bleState == BleState.connected;
        final bleConnected = bleState == BleState.connected;

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Status card ─────────────────────────────────────
              _buildStatusCard(c, bleActive, bleConnected, bleState),
              const SizedBox(height: 16),
              // ── Log viewer ──────────────────────────────────────
              Expanded(child: _buildLogView(c)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusCard(
      ColorTokens c, bool active, bool connected, BleState state) {
    final statusText = connected
        ? AppLocalizations.of(context)!.connected
        : active
            ? AppLocalizations.of(context)!.broadcasting
            : 'Idle';
    final statusIcon = connected
        ? Icons.bluetooth_connected
        : active
            ? Icons.bluetooth
            : Icons.bluetooth_disabled;
    final statusColor = connected
        ? c.primary
        : active
            ? c.primary.withAlpha(180)
            : c.text.withAlpha(100);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        children: [
          // ── Status indicator ────────────────────────────────────
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(R.sm),
                ),
                child: Icon(statusIcon, color: statusColor, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.blePeripheral,
                      style: TextStyle(
                        color: c.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // ── Toggle button ──────────────────────────────────
              GestureDetector(
                onTap: _toggleBle,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: active
                        ? c.error.withAlpha(30)
                        : c.primary.withAlpha(30),
                    borderRadius: BorderRadius.circular(R.sm),
                  ),
                  child: Icon(
                    active ? Icons.stop : Icons.play_arrow,
                    color: active
                        ? c.error.withAlpha(200)
                        : c.primary.withAlpha(200),
                    size: 28,
                  ),
                ),
              ),
            ],
          ),

          // ── Hint text ──────────────────────────────────────────
          const SizedBox(height: 12),
          Text(
            connected
                ? 'A client is connected. Signing requests will appear here.'
                : active
                    ? AppLocalizations.of(context)!.advertisingAs
                    : AppLocalizations.of(context)!.startBleBroadcasting,
            style: TextStyle(
              color: c.text.withAlpha(120),
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogView(ColorTokens c) {
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Header ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                Icon(Icons.list_alt, size: 18, color: c.text.withAlpha(140)),
                const SizedBox(width: 8),
                Text(
                  AppLocalizations.of(context)!.bleLogs,
                  style: TextStyle(
                    color: c.text.withAlpha(180),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: c.border),

          // ── Log entries ─────────────────────────────────────────
          Expanded(
            child: _logEntries.isEmpty
                ? Center(
                    child: Text(
                      AppLocalizations.of(context)!.noBleActivity,
                      style: TextStyle(
                        color: c.text.withAlpha(100),
                        fontSize: 14,
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    itemCount: _logEntries.length,
                    itemBuilder: (_, i) {
                      final entry =
                          _logEntries[_logEntries.length - 1 - i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(
                          entry,
                          style: TextStyle(
                            color: c.text.withAlpha(180),
                            fontSize: 12,
                            fontFamily: 'monospace',
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
