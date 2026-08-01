import 'dart:convert';

import '../core/interfaces/account_service.dart';
import '../core/interfaces/crypto_service.dart';
import '../core/models/wallet_accounts.dart';
import '../utils/fnv.dart';

/// Account derivation service — extracts account management from WalletService.
///
/// Implements [IAccountService] so [WalletService] depends on the interface,
/// not the concrete implementation.
///
/// Responsibilities:
/// - Derive default accounts for all 5 chains (ETH, SOL, BTC, TRX, SUI).
/// - Derive a single chain account from seed + path.
/// - Pure-data list operations (add/remove accounts from a [WalletAccounts]).
///
/// All cryptographic operations go through the injected [ICryptoService].
/// This service does NOT access storage or check wallet lock state —
/// those concerns belong to [WalletService].
class AccountService implements IAccountService {
  final ICryptoService _crypto;

  AccountService({required ICryptoService crypto}) : _crypto = crypto;

  // ── Default derivation paths ──────────────────────────────────────────

  @override
  Map<String, String> get defaultPaths => const <String, String>{
        'ethereum': "m/44'/60'/0'/0/0",
        'solana': "m/44'/501'/0'/0'",
        'bitcoin': "m/84'/0'/0'/0/0",
        'tron': "m/44'/195'/0'/0/0",
        'sui': "m/44'/784'/0'/0'/0'",
      };

  // ── Derive default accounts for all chains ────────────────────────────

  @override
  Future<WalletAccounts> deriveDefaultAccounts(
      String mnemonic, String passphrase, String seedHex) async {
    final accounts = <ChainAccount>[];
    for (final entry in defaultPaths.entries) {
      final account =
          await deriveSingleAccount(entry.key, entry.value, seedHex);
      if (account != null) {
        accounts.add(account);
      }
    }

    final fingerprint = fnv1aFingerprint(mnemonic);
    return WalletAccounts(
      accounts: accounts,
      mnemonicFingerprint: fingerprint,
    );
  }

  // ── Derive a single chain account ─────────────────────────────────────

  @override
  Future<ChainAccount?> deriveSingleAccount(
      String chain, String path, String seedHex) async {
    switch (chain) {
      case 'ethereum':
        final address = _crypto.deriveEthAddress(seedHex, path);
        if (address == null) return null;
        final privKey =
            _crypto.deriveSecp256k1PrivateKey(seedHex, path);
        final pubKey =
            privKey != null ? _crypto.hexEncode(privKey) : '';
        return ChainAccount(
          chain: 'ethereum',
          address: address,
          derivationPath: path,
          publicKey: pubKey,
        );

      case 'solana':
        final address = _crypto.deriveSolAddress(seedHex, path);
        if (address == null) return null;
        final privKey =
            _crypto.deriveEd25519PrivateKey(seedHex, path);
        final pubKeyBytes = privKey != null
            ? _crypto.solanaPublicKeyBytes(_crypto.hexEncode(privKey))
            : null;
        final pubKey = pubKeyBytes != null
            ? _crypto.hexEncode(pubKeyBytes)
            : '';
        return ChainAccount(
          chain: 'solana',
          address: address,
          derivationPath: path,
          publicKey: pubKey,
        );

      case 'bitcoin':
        final address = _crypto.deriveBtcAddress(seedHex, path);
        if (address == null) return null;
        final privKey =
            _crypto.deriveSecp256k1PrivateKey(seedHex, path);
        final pubKey =
            privKey != null ? _crypto.hexEncode(privKey) : '';
        return ChainAccount(
          chain: 'bitcoin',
          address: address,
          derivationPath: path,
          publicKey: pubKey,
        );

      case 'tron':
        final address = _crypto.deriveTronAddress(seedHex, path);
        if (address == null) return null;
        final privKey =
            _crypto.deriveSecp256k1PrivateKey(seedHex, path);
        final pubKey =
            privKey != null ? _crypto.hexEncode(privKey) : '';
        return ChainAccount(
          chain: 'tron',
          address: address,
          derivationPath: path,
          publicKey: pubKey,
        );

      case 'sui':
        final address = _crypto.deriveSuiAddress(seedHex, path);
        if (address == null) return null;
        final privKey =
            _crypto.deriveEd25519PrivateKey(seedHex, path);
        final pubKey =
            privKey != null ? _crypto.hexEncode(privKey) : '';
        return ChainAccount(
          chain: 'sui',
          address: address,
          derivationPath: path,
          publicKey: pubKey,
        );

      default:
        return null;
    }
  }

  // ── Pure-data list operations ─────────────────────────────────────────

  @override
  WalletAccounts addAccountToList(
      WalletAccounts accounts, ChainAccount account) {
    // Check for duplicates (same address + chain)
    final existing = accounts.accounts
        .where((a) => a.address == account.address && a.chain == account.chain);
    if (existing.isNotEmpty) return accounts;

    return accounts.copyWith(
      accounts: [...accounts.accounts, account],
    );
  }

  @override
  WalletAccounts removeAccountFromList(
      WalletAccounts accounts, String chain, String address) {
    return accounts.copyWith(
      accounts: accounts.accounts
          .where((a) => !(a.chain == chain && a.address == address))
          .toList(),
    );
  }

}
