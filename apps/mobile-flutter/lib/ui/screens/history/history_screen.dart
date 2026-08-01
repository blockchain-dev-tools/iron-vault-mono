import 'package:flutter/material.dart';

import '../../../app/app_state.dart';
import '../../../core/models/signature_record.dart';
import '../../../generated/l10n/app_localizations.dart';
import '../../../utils/formatting.dart';
import '../../theme/color_tokens.dart';

/// History tab — lists all completed signing operations.
///
/// Reads [AppState.signHistory] for chronological records.
/// Each entry shows chain, address, status, and timestamp.
/// Tap to expand and view full details (parsed data, signature hex).
class HistoryScreen extends StatefulWidget {
  final AppState? appState;

  const HistoryScreen({super.key, this.appState});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  int? _expandedIndex;

  AppState get _appState => widget.appState!;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark
        ? ColorTokens.dark
        : ColorTokens.light;
    final history = _appState.signHistory;

    if (history.isEmpty) {
      return _buildEmptyState(c);
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: history.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final record = history[history.length - 1 - index]; // newest first
        final isExpanded = _expandedIndex == index;
        return _buildRecordCard(c, record, index, isExpanded);
      },
    );
  }

  Widget _buildEmptyState(ColorTokens c) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.history, size: 64, color: c.text.withAlpha(60)),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.noSigningHistory,
            style: TextStyle(
              color: c.text.withAlpha(100),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppLocalizations.of(context)!.transactionSignaturesWillAppear,
            style: TextStyle(
              color: c.text.withAlpha(60),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordCard(
      ColorTokens c, SignatureRecord record, int index, bool isExpanded) {
    final statusColor = !record.isApproved
        ? Colors.orange
        : record.isSuccess
            ? c.primary
            : c.error;

    final statusIcon = !record.isApproved
        ? Icons.cancel_outlined
        : record.isSuccess
            ? Icons.check_circle
            : Icons.error_outline;

    final statusLabel = !record.isApproved
        ? AppLocalizations.of(context)!.rejectedStatus
        : record.isSuccess
            ? AppLocalizations.of(context)!.signed
            : AppLocalizations.of(context)!.failedStatus;

    return GestureDetector(
      onTap: () => setState(() {
        _expandedIndex = isExpanded ? null : index;
      }),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(R.lg),
          border: Border.all(color: c.border.withAlpha(80)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header row ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Row(
                children: [
                  // Status icon
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(30),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(statusIcon, color: statusColor, size: 20),
                  ),
                  const SizedBox(width: 12),

                  // Chain + address
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          chainLabel(record.chain),
                          style: TextStyle(
                            color: c.text,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _truncateAddress(record.signingAddress),
                          style: TextStyle(
                            color: c.text.withAlpha(120),
                            fontSize: 12,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(25),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),

                  // Expand chevron
                  Icon(
                    isExpanded
                        ? Icons.expand_less
                        : Icons.expand_more,
                    color: c.text.withAlpha(100),
                    size: 20,
                  ),
                ],
              ),
            ),

            // ── Timestamp row (always visible) ─────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Text(
                _formatTimestamp(record.timestamp),
                style: TextStyle(
                  color: c.text.withAlpha(80),
                  fontSize: 11,
                ),
              ),
            ),

            // ── Expanded detail ────────────────────────────────────
            if (isExpanded) ...[
              Container(
                height: 1,
                color: c.border.withAlpha(60),
                margin: const EdgeInsets.symmetric(horizontal: 16),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _detailRow(c, AppLocalizations.of(context)!.derivationPath,
                        record.derivationPath),
                    const SizedBox(height: 10),
                    _detailRow(c, AppLocalizations.of(context)!.signingAddress,
                        record.signingAddress),
                    const SizedBox(height: 10),

                    // Parsed transaction data
                    if (record.parsedData != null &&
                        record.parsedData!.isNotEmpty) ...[
                      _buildParsedData(c, record.parsedData!),
                      const SizedBox(height: 10),
                    ],

                    // Payload hex
                    _buildHexField(c, AppLocalizations.of(context)!.payload, record.payloadHex),
                    const SizedBox(height: 10),

                    // Signature result
                    if (record.isApproved && record.signatureHex != null)
                      _buildHexField(
                          c, AppLocalizations.of(context)!.rawSignature, record.signatureHex!),

                    // Status word
                    const SizedBox(height: 6),
                    _detailRow(
                      c,
                      AppLocalizations.of(context)!.statusWord,
                      '0x${record.statusWord.toRadixString(16).padLeft(4, '0')}',
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildParsedData(
      ColorTokens c, Map<String, dynamic> data) {
    // Show the most relevant fields.
    final type = data['type'] as String?;
    final lines = <Widget>[];

    if (type != null) {
      lines.add(_detailRow(c, 'Type', type));
      lines.add(const SizedBox(height: 8));
    }

    if (data['to'] != null) {
      lines.add(_detailRow(c, AppLocalizations.of(context)!.to, data['to'] as String));
      lines.add(const SizedBox(height: 8));
    }

    if (data['value'] != null && data['value'] != '0') {
      lines.add(_detailRow(c, AppLocalizations.of(context)!.value,
          '${weiToEth(data['value'] as String)} ETH'));
      lines.add(const SizedBox(height: 8));
    }

    if (data['chainId'] != null) {
      final chainName = data['chainId'] as String;
      lines.add(_detailRow(c, AppLocalizations.of(context)!.chainId, chainName));
      lines.add(const SizedBox(height: 8));
    }

    if (data['message'] != null) {
      final msg = data['message'] as String;
      lines.add(Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(AppLocalizations.of(context)!.messageLabel,
              style: TextStyle(
                  color: c.text.withAlpha(130), fontSize: 12)),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: c.bg,
              borderRadius: BorderRadius.circular(R.sm),
            ),
            child: SelectableText(
              msg,
              style: TextStyle(
                color: c.text,
                fontSize: 12,
                fontFamily: 'monospace',
                height: 1.3,
              ),
            ),
          ),
        ],
      ));
      lines.add(const SizedBox(height: 8));
    }

    return Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: lines);
  }

  Widget _buildHexField(
      ColorTokens c, String label, String hex) {
    final truncated = hex.length > 48
        ? '${hex.substring(0, 48)}...'
        : hex;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                color: c.text.withAlpha(130), fontSize: 12)),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: c.bg,
            borderRadius: BorderRadius.circular(R.sm),
          ),
          child: SelectableText(
            '0x$truncated',
            style: TextStyle(
              color: c.text.withAlpha(180),
              fontSize: 11,
              fontFamily: 'monospace',
              height: 1.3,
            ),
          ),
        ),
      ],
    );
  }

  static Widget _detailRow(
      ColorTokens c, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style:
                TextStyle(color: c.text.withAlpha(130), fontSize: 12),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SelectableText(
            value,
            style: TextStyle(
              color: c.text,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  String _truncateAddress(String address) {
    if (address.length <= 14) return address;
    return '${address.substring(0, 8)}...${address.substring(address.length - 6)}';
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return AppLocalizations.of(context)!.justNow;
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    }
    if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    }
    return '${dt.month}/${dt.day}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
