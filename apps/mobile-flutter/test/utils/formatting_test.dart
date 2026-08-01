/// Unit tests for formatting utilities.
///
/// Covers chainLabel, chainIcon, weiToEth, weiToGwei.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:iron_vault_flutter/utils/formatting.dart';

void main() {
  // ═════════════════════════════════════════════════════════════════════
  // chainLabel
  // ═════════════════════════════════════════════════════════════════════

  group('chainLabel', () {
    test('ethereum → "Ethereum"', () {
      expect(chainLabel('ethereum'), 'Ethereum');
    });

    test('solana → "Solana"', () {
      expect(chainLabel('solana'), 'Solana');
    });

    test('bitcoin → "Bitcoin"', () {
      expect(chainLabel('bitcoin'), 'Bitcoin');
    });

    test('tron → "Tron"', () {
      expect(chainLabel('tron'), 'Tron');
    });

    test('sui → "Sui"', () {
      expect(chainLabel('sui'), 'Sui');
    });

    test('personal_msg → "Ethereum — Personal Message"', () {
      expect(chainLabel('personal_msg'), 'Ethereum — Personal Message');
    });

    test('eip712 → "Ethereum — EIP-712"', () {
      expect(chainLabel('eip712'), 'Ethereum — EIP-712');
    });

    test('unknown chain returns input unchanged', () {
      expect(chainLabel('cosmos'), 'cosmos');
      expect(chainLabel('polkadot'), 'polkadot');
      expect(chainLabel(''), '');
    });

    test('empty string returns empty string', () {
      expect(chainLabel(''), '');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // chainIcon
  // ═════════════════════════════════════════════════════════════════════

  group('chainIcon', () {
    test('ethereum returns Icons.account_balance', () {
      expect(chainIcon('ethereum'), Icons.account_balance);
    });

    test('solana returns Icons.wb_sunny', () {
      expect(chainIcon('solana'), Icons.wb_sunny);
    });

    test('bitcoin returns Icons.currency_bitcoin', () {
      expect(chainIcon('bitcoin'), Icons.currency_bitcoin);
    });

    test('tron returns Icons.monetization_on', () {
      expect(chainIcon('tron'), Icons.monetization_on);
    });

    test('sui returns Icons.waves', () {
      expect(chainIcon('sui'), Icons.waves);
    });

    test('unknown chain returns Icons.account_balance_wallet (fallback)', () {
      expect(chainIcon('cosmos'), Icons.account_balance_wallet);
      expect(chainIcon('unknown'), Icons.account_balance_wallet);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // weiToEth
  // ═════════════════════════════════════════════════════════════════════

  group('weiToEth', () {
    test('"0" → "0"', () {
      expect(weiToEth('0'), '0');
    });

    test('empty string → "0"', () {
      expect(weiToEth(''), '0');
    });

    test('"1000000000000000000" → "1" (1 ETH)', () {
      expect(weiToEth('1000000000000000000'), '1');
    });

    test('"2000000000000000000" → "2" (2 ETH)', () {
      expect(weiToEth('2000000000000000000'), '2');
    });

    test('"100000000000000000" → "0.1" (0.1 ETH)', () {
      expect(weiToEth('100000000000000000'), '0.1');
    });

    test('"1000000000000000" → "0.001" (0.001 ETH)', () {
      expect(weiToEth('1000000000000000'), '0.001');
    });

    test('trailing zeros are trimmed', () {
      expect(weiToEth('1000000000000000000'), '1');
      expect(weiToEth('2000000000000000000'), '2');
    });

    test('fractional value with significant decimals', () {
      // 1.234567890123456789 ETH
      expect(weiToEth('1234567890123456789'), '1.234567890123456789');
    });

    test('value less than 1 wei with padding', () {
      // 1 wei → 0.000000000000000001 ETH
      expect(weiToEth('1'), '0.000000000000000001');
    });

    test('10 wei → 0.00000000000000001 ETH', () {
      expect(weiToEth('10'), '0.00000000000000001');
    });

    test('very small value preserves all significant digits', () {
      // 123456789012345 wei
      expect(weiToEth('123456789012345'), '0.000123456789012345');
    });

    test('large value with decimals', () {
      // 1.5 ETH
      expect(weiToEth('1500000000000000000'), '1.5');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // weiToGwei
  // ═════════════════════════════════════════════════════════════════════

  group('weiToGwei', () {
    test('"0" → "0"', () {
      expect(weiToGwei('0'), '0');
    });

    test('empty string → "0"', () {
      expect(weiToGwei(''), '0');
    });

    test('"1000000000" → "1" (1 Gwei)', () {
      expect(weiToGwei('1000000000'), '1');
    });

    test('"2000000000" → "2" (2 Gwei)', () {
      expect(weiToGwei('2000000000'), '2');
    });

    test('"100000000" → "0.1" (0.1 Gwei)', () {
      expect(weiToGwei('100000000'), '0.1');
    });

    test('"1000000" → "0.001" (0.001 Gwei)', () {
      expect(weiToGwei('1000000'), '0.001');
    });

    test('trailing zeros are trimmed', () {
      expect(weiToGwei('1000000000'), '1');
      expect(weiToGwei('5000000000'), '5');
    });

    test('1 wei → minimal Gwei display', () {
      expect(weiToGwei('1'), '0.000000001');
    });

    test('fractional Gwei value', () {
      expect(weiToGwei('1234567890'), '1.23456789');
    });
  });
}
