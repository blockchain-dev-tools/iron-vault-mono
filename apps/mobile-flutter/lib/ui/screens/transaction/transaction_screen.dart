import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_state.dart';
import '../../../core/models/apdu_message.dart';
import '../../../generated/l10n/app_localizations.dart';
import '../../../utils/formatting.dart';
import '../../theme/color_tokens.dart';
import '../../widgets/common/primary_button.dart';

/// Sign approval UI — shows transaction content and signing address
/// for the user to approve or reject.
///
/// Reads [PendingSignRequest] from [AppState.pendingRequest].
/// Displays a 60-second timeout countdown.
class TransactionScreen extends StatefulWidget {
  final AppState? appState;

  const TransactionScreen({super.key, this.appState});

  /// Cached chain name map loaded from assets/chains.json.
  static Map<String, String>? _chainNames;

  /// Load chain names from assets JSON.
  static Future<void> loadChainNames() async {
    if (_chainNames != null) return;
    try {
      final json = await rootBundle.loadString('assets/chains.json');
      final decoded = jsonDecode(json) as Map<String, dynamic>;
      _chainNames = decoded.map((k, v) => MapEntry(k, v as String));
    } catch (_) {
      _chainNames = {};
    }
  }

  /// Lookup chain name from loaded data.
  static String chainName(String chainId) {
    final name = _chainNames?[chainId];
    if (name != null) return '$name (ID: $chainId)';
    return 'Chain ID: $chainId';
  }

  @override
  State<TransactionScreen> createState() => _TransactionScreenState();
}

class _TransactionScreenState extends State<TransactionScreen> {
  Timer? _countdownTimer;
  int _secondsRemaining = 60;

  AppState get _appState => widget.appState!;

  /// Per-param decimals override. Key = "method:paramName", value = decimals.
  /// Default for uint256 is 18; user can tap +/- to adjust.
  final Map<String, int> _decimalsOverrides = {};

  @override
  void initState() {
    super.initState();
    TransactionScreen.loadChainNames().then((_) {
      if (mounted) setState(() {});
    });
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _secondsRemaining = 60;
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _secondsRemaining--;
      });
      if (_secondsRemaining <= 0) {
        _countdownTimer?.cancel();
        _onTimeout();
      }
    });
  }

  Future<void> _onTimeout() async {
    await _appState.rejectSign();
    if (mounted) {
      context.go('/');
    }
  }

  Future<void> _onApprove() async {
    _countdownTimer?.cancel();
    await _appState.approveSign();
    if (mounted) {
      context.go('/signature-result');
    }
  }

  Future<void> _onReject() async {
    _countdownTimer?.cancel();
    await _appState.rejectSign();
    if (mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = ColorTokens.dark;
    final req = _appState.pendingRequest;

    // If no pending request, show a spinner or redirect.
    if (req == null) {
      return Scaffold(
        backgroundColor: c.bg,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.signTransaction),
        actions: [
          // Countdown timer
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '⏱ ${_secondsRemaining}s',
                style: TextStyle(
                  color: _secondsRemaining <= 10 ? c.error : c.text.withAlpha(180),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // ── Header ──────────────────────────────────────────
              _buildHeader(c, req),
              const SizedBox(height: 20),

              // ── Signing address ─────────────────────────────────
              _buildAddressCard(c, req.signingAddress, req.chain),
              const SizedBox(height: 16),

              // ── Transaction details ─────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  child: _buildTxDetails(c, req),
                ),
              ),

              const SizedBox(height: 16),

              // ── Approve / Reject ────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton(
                      label: AppLocalizations.of(context)!.reject,
                      onTap: _onReject,
                      outline: true,
                      outlineColor: c.error,
                      textColor: c.error,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: PrimaryButton(
                      label: AppLocalizations.of(context)!.approve,
                      onTap: _onApprove,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ColorTokens c, PendingSignRequest req) {
    return Column(
      children: [
        Icon(Icons.shield_outlined, size: 48, color: c.primary),
        const SizedBox(height: 12),
        Text(
          AppLocalizations.of(context)!.transactionDetails,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: c.text,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          chainLabel(req.chain),
          style: TextStyle(color: c.primary, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildAddressCard(ColorTokens c, String address, String chain) {
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
          Row(
            children: [
              Icon(Icons.key, size: 16, color: c.primary.withAlpha(200)),
              const SizedBox(width: 6),
              Text(
                AppLocalizations.of(context)!.from,
                style: TextStyle(color: c.text.withAlpha(150), fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SelectableText.rich(
            _highlightedAddress(address, c),
            style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 6),
          Text(
            _appState.pendingRequest?.derivationPath ?? '',
            style: TextStyle(
              color: c.text.withAlpha(100),
              fontSize: 11,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  /// Build a [TextSpan] with first 6 and last 6 chars bold+primary.
  TextSpan _highlightedAddress(String address, ColorTokens c) {
    if (address.length <= 12) {
      return TextSpan(text: address, style: TextStyle(color: c.text));
    }
    final prefix = address.substring(0, 6);
    final middle = address.substring(6, address.length - 6);
    final suffix = address.substring(address.length - 6);
    return TextSpan(
      children: [
        TextSpan(
          text: prefix,
          style: TextStyle(color: c.primary, fontWeight: FontWeight.bold),
        ),
        TextSpan(text: middle, style: TextStyle(color: c.text)),
        TextSpan(
          text: suffix,
          style: TextStyle(color: c.primary, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildTxDetails(ColorTokens c, PendingSignRequest req) {
    final parsed = req.parsedData;

    if (parsed == null || parsed.isEmpty) {
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
            _rawDataRow(c, AppLocalizations.of(context)!.dataHex, '0x${req.payloadHex.substring(0, req.payloadHex.length.clamp(0, 64))}${req.payloadHex.length > 64 ? '...' : ''}'),
            const SizedBox(height: 8),
            _rawDataRow(c, AppLocalizations.of(context)!.dataSize, '${req.payloadHex.length ~/ 2} bytes'),
          ],
        ),
      );
    }

    final type = parsed['type'] as String?;

    switch (type) {
      case 'eth_tx':
        return _buildEthTxDetails(c, parsed);
      case 'personal_msg':
        return _buildPersonalMsgDetails(c, parsed);
      case 'eip712':
        return _buildEip712Details(c, parsed);
      default:
        return _buildRawDetails(c, parsed);
    }
  }

  Widget _buildEthTxDetails(ColorTokens c, Map<String, dynamic> data) {
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
          _detailRow(c, AppLocalizations.of(context)!.chain, TransactionScreen.chainName(data['chainId'] as String? ?? '0')),
          const SizedBox(height: 10),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 10),
          _buildAddressRow(c, AppLocalizations.of(context)!.to, data['to'] as String? ?? ''),
          const SizedBox(height: 10),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 10),
          _detailRow(c, AppLocalizations.of(context)!.value, '${weiToEth(data['value'] as String? ?? '0')} ETH'),
          const SizedBox(height: 10),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 10),
          _detailRow(c, 'Type', data['txType'] as String? ?? 'legacy'),
          const SizedBox(height: 10),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 10),
          _detailRow(c, AppLocalizations.of(context)!.gasLimit, data['gas'] as String? ?? ''),
          const SizedBox(height: 10),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 10),
          _detailRow(c, _gasPriceLabel(data['txType'] as String? ?? ''), '${weiToGwei(data['gasPrice'] as String? ?? '0')} Gwei'),
          if (data['txType'] == 'eip1559' && data['priorityFee'] != null) ...[
            const SizedBox(height: 10),
            Container(height: 1, color: c.border.withAlpha(60)),
            const SizedBox(height: 10),
            _detailRow(c, AppLocalizations.of(context)!.priorityFee, '${weiToGwei(data['priorityFee'] as String? ?? '0')} Gwei'),
          ],
          if (data['nonce'] != null && (data['nonce'] as String?) != '0') ...[
            const SizedBox(height: 10),
            Container(height: 1, color: c.border.withAlpha(60)),
            const SizedBox(height: 10),
            _detailRow(c, AppLocalizations.of(context)!.nonce, data['nonce'] as String? ?? ''),
          ],
          if (data['data'] != null && (data['data'] as String?) != '0x') ...[
            const SizedBox(height: 10),
            Container(height: 1, color: c.border.withAlpha(60)),
            const SizedBox(height: 10),
            _buildDataField(c, data['data'] as String? ?? ''),
          ],
          if (data['action'] is Map) ...[
            const SizedBox(height: 10),
            Container(height: 1, color: c.border.withAlpha(60)),
            const SizedBox(height: 10),
            _buildDecodedAction(c, data['action'] as Map<String, dynamic>),
          ],
        ],
      ),
    );
  }

  /// Build a human-readable row for a decoded contract action (e.g. ERC-20 transfer).
  Widget _buildDecodedAction(ColorTokens c, Map<String, dynamic> action) {
    final method = action['method'] as String?;
    final params = action['params'] as List<dynamic>?;
    if (method == null || params == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.code, size: 16, color: c.primary),
            const SizedBox(width: 6),
            Text(
              AppLocalizations.of(context)!.decodedAction,
              style: TextStyle(
                color: c.primary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _detailRow(c, AppLocalizations.of(context)!.methodLabel, method),
        ...params.map((p) {
          return Padding(
            padding: const EdgeInsets.only(top: 6),
            child: _buildParamRow(c, p as Map<String, dynamic>),
          );
        }),
      ],
    );
  }

  /// Build a display row for a single decoded param, handling nested types.
  Widget _buildParamRow(ColorTokens c, Map<String, dynamic> param) {
    final name = (param['name'] as String?) ?? '';
    final value = (param['value'] as String?) ?? '';
    final type = (param['type'] as String?) ?? '';

    if (type == 'address') {
      return _buildAddressRow(c, name, value);
    }

    if (type == 'tuple' || type == 'tuple[]') {
      // value is JSON string of nested params
      List<dynamic> nested;
      try {
        nested = jsonDecode(value) as List<dynamic>;
      } catch (_) {
        return _detailRow(c, _paramLabel(name), value);
      }
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _paramLabel(name),
            style: TextStyle(
              color: c.text.withAlpha(150),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: nested.map((e) {
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: _buildParamRow(c, e as Map<String, dynamic>),
                );
              }).toList(),
            ),
          ),
        ],
      );
    }

    if (type.startsWith('uint') || type.startsWith('int')) {
      return _buildUintRow(c, name, value, type);
    }

    if (type == 'bool') {
      return _detailRow(c, _paramLabel(name), value == 'true' ? 'Yes' : 'No');
    }

    if (type == 'bytes' || type == 'bytes32') {
      final display = value.length > 20
          ? '${value.substring(0, 18)}...'
          : value;
      return _detailRow(c, _paramLabel(name), display);
    }

    if (type == 'string') {
      return _detailRow(c, _paramLabel(name), value);
    }

    // address[] / uint256[] etc.
    if (type.endsWith('[]')) {
      List<dynamic> arr;
      try {
        arr = jsonDecode(value) as List<dynamic>;
      } catch (_) {
        return _detailRow(c, _paramLabel(name), value);
      }
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_paramLabel(name)} (${arr.length})',
            style: TextStyle(
              color: c.text.withAlpha(150),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Column(
              children: arr.asMap().entries.map((e) {
                return Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: _detailRow(c, '#${e.key}', e.value.toString()),
                );
              }).toList(),
            ),
          ),
        ],
      );
    }

    return _detailRow(c, _paramLabel(name), value);
  }

  /// Build a row for an address with highlighted prefix/suffix.
  Widget _buildAddressRow(ColorTokens c, String name, String address) {
    final prefix = address.length > 12 ? address.substring(0, 6) : address;
    final suffix = address.length > 12 ? address.substring(address.length - 6) : '';
    final middle = address.length > 12 ? address.substring(6, address.length - 6) : '';

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              _paramLabel(name),
              style: TextStyle(color: c.text.withAlpha(130), fontSize: 13),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: SelectableText.rich(
              TextSpan(
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'monospace',
                ),
                children: [
                  TextSpan(
                    text: prefix,
                    style: TextStyle(
                      color: c.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (middle.isNotEmpty)
                    TextSpan(
                      text: middle,
                      style: TextStyle(color: c.text),
                    ),
                  if (suffix.isNotEmpty)
                    TextSpan(
                      text: suffix,
                      style: TextStyle(
                        color: c.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  String _gasPriceLabel(String txType) {
    if (txType == 'eip1559') return AppLocalizations.of(context)!.maxFee;
    return AppLocalizations.of(context)!.gasPrice;
  }

  /// Data field with expand/collapse — default max 3 lines.
  Widget _buildDataField(ColorTokens c, String dataHex) {
    final bytes = dataHex.startsWith('0x') ? (dataHex.length - 2) ~/ 2 : dataHex.length ~/ 2;

    return StatefulBuilder(
      builder: (context, setInnerState) {
        final expanded = _dataExpanded;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SizedBox(
                  width: 72,
                  child: Text(
                    'Data',
                    style: TextStyle(color: c.text.withAlpha(130), fontSize: 13),
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () {
                    setInnerState(() {
                      _dataExpanded = !_dataExpanded;
                    });
                  },
                  child: Text(
                    expanded ? AppLocalizations.of(context)!.showLess : AppLocalizations.of(context)!.showAll(bytes),
                    style: TextStyle(color: c.primary, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            SelectableText(
              dataHex,
              maxLines: expanded ? null : 3,
              style: TextStyle(
                color: c.text.withAlpha(180),
                fontSize: 11,
                fontFamily: 'monospace',
                height: 1.4,
              ),
            ),
          ],
        );
      },
    );
  }

  bool _dataExpanded = false;

  /// Build a row for uint/int with adjustable decimals.
  Widget _buildUintRow(ColorTokens c, String name, String rawValue, String type) {
    final key = '${_currentMethod}:$name';
    final decimals = _decimalsOverrides[key] ?? 18;
    final formatted = _formatWithDecimals(rawValue, decimals);

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              _paramLabel(name),
              style: TextStyle(color: c.text.withAlpha(130), fontSize: 13),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                SelectableText(
                  formatted,
                  style: TextStyle(
                    color: c.text,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  ),
                  textAlign: TextAlign.right,
                ),
                Text(
                  'dec: $decimals',
                  style: TextStyle(
                    color: c.text.withAlpha(100),
                    fontSize: 10,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          // Decimals adjuster
          Column(
            children: [
              InkWell(
                onTap: () {
                  setState(() {
                    _decimalsOverrides[key] = (_decimalsOverrides[key] ?? 18) + 1;
                  });
                },
                child: Icon(Icons.arrow_drop_up, size: 18, color: c.text.withAlpha(120)),
              ),
              InkWell(
                onTap: () {
                  setState(() {
                    final current = _decimalsOverrides[key] ?? 18;
                    if (current > 0) {
                      _decimalsOverrides[key] = current - 1;
                    }
                  });
                },
                child: Icon(Icons.arrow_drop_down, size: 18, color: c.text.withAlpha(120)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Track current method name for decimals override key.
  String get _currentMethod {
    final action = _appState.pendingRequest?.parsedData?['action'];
    if (action is Map) return (action['method'] as String?) ?? '';
    return '';
  }

  /// Format a raw integer string with N decimal places.
  /// "1000000000000000000" / 18 → "1.0"
  String _formatWithDecimals(String raw, int decimals) {
    if (raw.isEmpty || raw == '0') return '0';
    final padded = raw.padLeft(decimals + 1, '0');
    final intPart = padded.substring(0, padded.length - decimals);
    final decPart = padded.substring(padded.length - decimals);
    final trimmed = decPart.replaceAll(RegExp(r'0+$'), '');
    final dec = trimmed.isEmpty ? '' : '.$trimmed';
    return '$intPart$dec';
  }

  /// Convert snake_case param name to display label.
  String _paramLabel(String name) {
    if (name == 'spender') return AppLocalizations.of(context)!.spender;
    if (name == 'amount') return AppLocalizations.of(context)!.amount;
    if (name == 'from') return 'From';
    if (name == 'to') return 'To';
    if (name.isEmpty) return '';
    return name[0].toUpperCase() + name.substring(1);
  }

  Widget _buildPersonalMsgDetails(ColorTokens c, Map<String, dynamic> data) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context)!.messageToSign,
            style: TextStyle(
              color: c.text.withAlpha(130),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: c.bg,
              borderRadius: BorderRadius.circular(R.sm),
            ),
            child: SelectableText(
              data['message'] as String? ?? '',
              style: TextStyle(
                color: c.text,
                fontSize: 14,
                fontFamily: 'monospace',
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEip712Details(ColorTokens c, Map<String, dynamic> data) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(R.lg),
        border: Border.all(color: c.border.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context)!.eip712TypedData,
            style: TextStyle(
              color: c.primary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            AppLocalizations.of(context)!.domainHash,
            style: TextStyle(color: c.text.withAlpha(130), fontSize: 12),
          ),
          const SizedBox(height: 4),
          SelectableText(
            data['domainHash'] as String? ?? '',
            style: TextStyle(
              color: c.text,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
          ),
          const SizedBox(height: 12),
          Text(
            AppLocalizations.of(context)!.structHash,
            style: TextStyle(color: c.text.withAlpha(130), fontSize: 12),
          ),
          const SizedBox(height: 4),
          SelectableText(
            data['structHash'] as String? ?? '',
            style: TextStyle(
              color: c.text,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRawDetails(ColorTokens c, Map<String, dynamic> data) {
    final hex = data['hex'] as String? ?? '';
    final size = data['size'] as int? ?? 0;
    final displayHex = hex.length > 80 ? '${hex.substring(0, 80)}...' : hex;

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
          _rawDataRow(c, 'Hex', displayHex),
          const SizedBox(height: 8),
          Container(height: 1, color: c.border.withAlpha(60)),
          const SizedBox(height: 8),
          _rawDataRow(c, 'Size', '$size bytes'),
        ],
      ),
    );
  }

  static Widget _detailRow(ColorTokens c, String label, String value) {
    final truncated = value.length > 50
        ? '${value.substring(0, 50)}...'
        : value;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(
            label,
            style: TextStyle(color: c.text.withAlpha(130), fontSize: 13),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SelectableText(
            truncated,
            style: TextStyle(
              color: c.text,
              fontSize: 13,
              fontFamily: 'monospace',
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  static Widget _rawDataRow(ColorTokens c, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: c.text.withAlpha(130), fontSize: 13),
        ),
        Flexible(
          child: Text(
            value,
            style: TextStyle(
              color: c.text,
              fontSize: 13,
              fontFamily: 'monospace',
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }


}
