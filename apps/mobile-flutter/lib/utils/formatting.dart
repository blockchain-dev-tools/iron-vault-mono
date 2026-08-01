import 'package:flutter/material.dart';

/// Shared formatting utilities used across multiple screens.
///
/// Consolidates duplicated chain labels/icons and Ethereum unit
/// conversions that were previously copy-pasted across 4 screens.

/// Human-readable label for a chain identifier.
///
/// Used in: TransactionScreen, SignatureResultScreen, AccountDetailScreen,
/// VaultScreen.
String chainLabel(String chain) {
  const labels = <String, String>{
    'ethereum': 'Ethereum',
    'solana': 'Solana',
    'bitcoin': 'Bitcoin',
    'tron': 'Tron',
    'sui': 'Sui',
    'personal_msg': 'Ethereum — Personal Message',
    'eip712': 'Ethereum — EIP-712',
  };
  return labels[chain] ?? chain;
}

/// Material icon for a chain identifier.
///
/// Used in: VaultScreen, AccountDetailScreen.
IconData chainIcon(String chain) {
  const icons = <String, IconData>{
    'ethereum': Icons.account_balance,
    'solana': Icons.wb_sunny,
    'bitcoin': Icons.currency_bitcoin,
    'tron': Icons.monetization_on,
    'sui': Icons.waves,
  };
  return icons[chain] ?? Icons.account_balance_wallet;
}

/// SVG asset path for a chain icon.
///
/// Returns the path to the chain's branded SVG icon under
/// `assets/icons/chains/`. Supports all 5 wallet chains.
///
/// Used in: AccountsTab.
String chainIconAssetPath(String chain) {
  const paths = <String, String>{
    'ethereum': 'assets/icons/chains/eth.svg',
    'solana': 'assets/icons/chains/sol.svg',
    'bitcoin': 'assets/icons/chains/btc.svg',
    'tron': 'assets/icons/chains/tron.svg',
    'sui': 'assets/icons/chains/sui.svg',
  };
  return paths[chain] ?? 'assets/icons/chains/eth.svg';
}

/// Convert a wei decimal string to an ETH display string.
///
/// Example: "1000000000000000000" → "1"
///          "1234567890123456789" → "1.234567890123456789"
String weiToEth(String wei) {
  if (wei == '0' || wei.isEmpty) return '0';
  // Pad to at least 19 chars (1 ETH = 10^18 wei)
  final padded = wei.padLeft(19, '0');
  final intPart = padded.substring(0, padded.length - 18);
  final decPart = padded.substring(padded.length - 18);
  // Trim trailing zeros
  final trimmed = decPart.replaceAll(RegExp(r'0+$'), '');
  final dec = trimmed.isEmpty ? '' : '.$trimmed';
  return '$intPart$dec';
}

/// Convert a wei decimal string to a Gwei display string.
///
/// Example: "1000000000" → "1"
String weiToGwei(String wei) {
  if (wei == '0' || wei.isEmpty) return '0';
  final padded = wei.padLeft(10, '0');
  final intPart = padded.substring(0, padded.length - 9);
  final decPart = padded.substring(padded.length - 9);
  final trimmed = decPart.replaceAll(RegExp(r'0+$'), '');
  final dec = trimmed.isEmpty ? '' : '.$trimmed';
  return '$intPart$dec';
}
