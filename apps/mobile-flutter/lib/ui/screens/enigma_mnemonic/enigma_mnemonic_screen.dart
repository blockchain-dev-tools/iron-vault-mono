import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../generated/l10n/app_localizations.dart';
import '../../theme/color_tokens.dart';
import '../../widgets/mnemonic/warning_banner.dart';
import '../../widgets/mnemonic/mnemonic_word_grid.dart';
import '../../widgets/common/primary_button.dart';
import '../../../data/bip39_wordlist.dart';
import '../../../utils/enigma.dart';
import '../../../infrastructure/ffi/crypto_bridge.dart' as bridge;

/// Displays the 24-word mnemonic generated via Enigma protocol.
///
/// Receives the word list, language, entropy hex, riddle and secret from
/// [GoRouterState.extra] (set by [EnigmaScreen]). Supports switching the
/// display language (re-derives mnemonic from the same entropy). Also
/// shows the BIP-39 seed hex for verification.
///
/// The **English mnemonic** is always the one used for wallet setup
/// (passed to SetPin), ensuring address derivation works correctly.
class EnigmaMnemonicScreen extends StatefulWidget {
  const EnigmaMnemonicScreen({super.key});

  @override
  State<EnigmaMnemonicScreen> createState() => _EnigmaMnemonicScreenState();
}

class _EnigmaMnemonicScreenState extends State<EnigmaMnemonicScreen> {
  final TextEditingController _passphraseController = TextEditingController();
  bool _obscurePassphrase = true;

  /// English words — used for wallet setup (SetPin).
  late List<String> _englishWords;

  /// Currently displayed words (may be in any language, for display only).
  late List<String> _displayWords;

  /// The entropy hex from which all language variants are derived.
  late String _entropyHex;

  /// Language selected in the Enigma screen (controls riddle wordlist lookup).
  late Bip39WordlistLanguage _inputLanguage;

  /// Language currently selected for display.
  late Bip39WordlistLanguage _displayLanguage;

  /// BIP-39 seed hex (derived from English mnemonic).
  String? _seedHex;

  /// Whether route extra has been processed (guard for didChangeDependencies).
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _initFromExtra();
      _computeSeed();
    }
  }

  void _initFromExtra() {
    final extra = GoRouterState.of(context).extra;
    if (extra is Map) {
      final words = extra['words'];
      if (words is List && words.isNotEmpty && words.first is String) {
        _englishWords = words.cast<String>();
      } else {
        _englishWords = [];
      }
      _inputLanguage = (extra['language'] as Bip39WordlistLanguage?) ??
          Bip39WordlistLanguage.english;
      _entropyHex = (extra['entropyHex'] as String?) ?? '';
    } else {
      _englishWords = [];
      _inputLanguage = Bip39WordlistLanguage.english;
      _entropyHex = '';
    }
    _displayLanguage = Bip39WordlistLanguage.english;
    _displayWords = List.from(_englishWords);
  }

  void _computeSeed() {
    final phrase = _englishWords.join(' ');
    final seedHex = bridge.CryptoBridge.mnemonicToSeed(phrase);
    if (seedHex != null) {
      _seedHex = seedHex;
    }
  }

  void _onDisplayLanguageChanged(Bip39WordlistLanguage newLang) {
    try {
      final words = mnemonicFromEntropy(
        _entropyHex,
        language: newLang,
      );
      setState(() {
        _displayLanguage = newLang;
        _displayWords = words;
      });
    } catch (_) {
      // If conversion fails (e.g., invalid wordlist), keep current display.
    }
  }

  String _localizedLanguageName(Bip39WordlistLanguage lang) {
    final l10n = AppLocalizations.of(context)!;
    switch (lang) {
      case Bip39WordlistLanguage.english:
        return l10n.languageEnglish;
      case Bip39WordlistLanguage.chineseSimplified:
        return l10n.languageChinese;
    }
  }

  @override
  void dispose() {
    _passphraseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = isDark ? ColorTokens.dark : ColorTokens.light;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/enigma');
      },
      child: Scaffold(
        backgroundColor: c.bg,
        appBar: AppBar(
          title: const Text('Enigma Mnemonic'),
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: c.text),
            onPressed: () => context.go('/enigma'),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Header ──────────────────────────────────────────
                Icon(Icons.shield_outlined, size: 56, color: c.primary),
                const SizedBox(height: 20),
                Text(
                  AppLocalizations.of(context)!.yourEnigmaSeedPhrase,
                  style: TextStyle(
                    color: c.text,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  AppLocalizations.of(context)!.writeDown24Words,
                  style: TextStyle(
                    color: c.text.withAlpha(160),
                    fontSize: 14,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 20),

                // ── Warning Banner ──────────────────────────────────
                WarningBanner(
                  message: AppLocalizations.of(context)!.neverShareSeed,
                  bold: true,
                ),

                const SizedBox(height: 24),

                // ── Language Selector (interactive) ─────────────────
                Row(
                  children: [
                    Text(
                      AppLocalizations.of(context)!.displayLanguage,
                      style: TextStyle(
                        color: c.text.withAlpha(160),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 0,
                        ),
                        decoration: BoxDecoration(
                          color: c.surface,
                          borderRadius: BorderRadius.circular(R.sm),
                          border: Border.all(color: c.border),
                        ),
                        child: DropdownButton<Bip39WordlistLanguage>(
                          value: _displayLanguage,
                          isExpanded: true,
                          underline: const SizedBox.shrink(),
                          dropdownColor: c.surface,
                          style: TextStyle(color: c.text, fontSize: 13),
                          icon: Icon(Icons.arrow_drop_down,
                              size: 18, color: c.text.withAlpha(120)),
                          items: Bip39WordlistLanguage.values.map((lang) {
                            return DropdownMenuItem(
                              value: lang,
                              child: Text(_localizedLanguageName(lang)),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              _onDisplayLanguageChanged(value);
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // ── Word Grid (4 columns × 6 rows for 24 words) ────
                if (_displayWords.isNotEmpty)
                  MnemonicWordGrid(
                    words: _displayWords,
                    columns: 4,
                    fontSize: 12,
                    childAspectRatio: 2.0,
                    cellSpacing: 6.0,
                  )
                else
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Column(
                      children: [
                        Icon(Icons.error_outline,
                            size: 40, color: c.text.withAlpha(80)),
                        const SizedBox(height: 12),
                        Text(
                          AppLocalizations.of(context)!.noMnemonicGenerated,
                          style: TextStyle(
                            color: c.text.withAlpha(120),
                            fontSize: 14,
                            height: 1.4,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 20),

                // ── Seed Hex Display ────────────────────────────────
                if (_seedHex != null)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: c.surface,
                      borderRadius: BorderRadius.circular(R.lg),
                      border: Border.all(color: c.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.vpn_key_outlined,
                                size: 16, color: c.primary),
                            const SizedBox(width: 8),
                            Text(
                              'BIP-39 Seed (hex)',
                              style: TextStyle(
                                color: c.text.withAlpha(180),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        SelectableText(
                          _seedHex!,
                          style: TextStyle(
                            color: c.text.withAlpha(140),
                            fontSize: 11,
                            fontFamily: 'monospace',
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          AppLocalizations.of(context)!.seedDerivedFromEnglish,
                          style: TextStyle(
                            color: c.text.withAlpha(70),
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 20),

                // ── Instructions ────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(R.lg),
                    border: Border.all(color: c.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.check_circle_outline,
                              size: 18, color: c.primary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'I have written down my seed phrase',
                              style: TextStyle(
                                color: c.text,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.check_circle_outline,
                              size: 18, color: c.primary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'I understand that losing these words '
                              'means losing access to my funds',
                              style: TextStyle(
                                color: c.text.withAlpha(160),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // ── Passphrase Input ─────────────────────────────────
                Text(
                  AppLocalizations.of(context)!.passphraseOptional,
                  style: TextStyle(
                    color: c.text.withAlpha(150),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  AppLocalizations.of(context)!.bip39PassphraseExplanation,
                  style: TextStyle(
                    color: c.text.withAlpha(100),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(R.lg),
                    border: Border.all(color: c.border),
                  ),
                  child: TextField(
                    key: const Key('passphrase-input'),
                    controller: _passphraseController,
                    obscureText: _obscurePassphrase,
                    style: TextStyle(
                      color: c.text,
                      fontSize: 15,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Enter passphrase (optional)',
                      hintStyle: TextStyle(
                        color: c.text.withAlpha(80),
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassphrase
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: c.text.withAlpha(150),
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassphrase = !_obscurePassphrase;
                          });
                        },
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // ── Continue Button ─────────────────────────────────
                PrimaryButton(
                  label: AppLocalizations.of(context)!.continueToSetPin,
                  onTap: _englishWords.isNotEmpty
                      ? () {
                          try {
                            context.go('/set-pin', extra: {
                              'mnemonic': _englishWords.join(' '),
                              'passphrase': _passphraseController.text.trim(),
                            });
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Navigation failed: $e'),
                                backgroundColor: c.error,
                              ),
                            );
                          }
                        }
                      : null,
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
