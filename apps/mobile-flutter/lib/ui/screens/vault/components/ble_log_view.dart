import 'package:flutter/material.dart';

import '../../../../generated/l10n/app_localizations.dart';
import '../../../theme/color_tokens.dart';

/// Bottom sheet view showing BLE log history.
class BleLogView extends StatelessWidget {
  final List<String> log;
  final ColorTokens c;

  const BleLogView({super.key, required this.log, required this.c});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SizedBox(
        height: 300,
        child: Column(
          children: [
            // ── Header ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Icon(Icons.bluetooth, size: 20, color: c.primary),
                  const SizedBox(width: 8),
                  Text(
                    AppLocalizations.of(context)!.bleLogs,
                    style: TextStyle(
                      color: c.text,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(Icons.close, size: 22, color: c.text.withAlpha(120)),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),

            // ── Log entries ───────────────────────────────────────────
            Expanded(
              child: log.isEmpty
                  ? Center(
                      child: Text(
                        'No BLE activity yet',
                        style: TextStyle(
                          color: c.text.withAlpha(100),
                          fontSize: 14,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      itemCount: log.length,
                      itemBuilder: (_, i) {
                        final entry = log[log.length - 1 - i]; // newest first
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            entry,
                            style: TextStyle(
                              color: c.text.withAlpha(180),
                              fontSize: 13,
                              fontFamily: 'monospace',
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
