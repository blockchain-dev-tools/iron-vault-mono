import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sha256 } from '@noble/hashes/sha2';
import { entropyToMnemonic, BIP39_WORDLISTS } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import LangPicker from '../../components/ui/LangPicker';
import PassphraseBox from '../../components/ui/PassphraseBox';
import Icon from '../../components/ui/Icon';
import { Fonts } from '../../lib/fonts';

// CJK languages: each character is its own BIP-39 word
const CJK_LANGS = new Set<Bip39Language>(['zh-Hans', 'zh-Hant', 'ja']);

// Module-level cache: build word→index Map once per language
const _wordIndexCache = new Map<Bip39Language, Map<string, number>>();
function getWordIndex(lang: Bip39Language): Map<string, number> {
  if (!_wordIndexCache.has(lang)) {
    _wordIndexCache.set(lang, new Map(BIP39_WORDLISTS[lang].map((w, i) => [w, i])));
  }
  return _wordIndexCache.get(lang)!;
}

function tokenize(text: string, lang: Bip39Language): string[] {
  if (CJK_LANGS.has(lang)) {
    return text.split('').filter(c => c.trim() !== '');
  }
  // Word-based: split on whitespace
  return text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Each index is zero-padded to 4 hex chars (indices 0–2047 = 0x0000–0x07ff).
// 16 indices × 4 chars = exactly 64 hex chars (32 bytes) — no truncation ambiguity.
const HEX_CAP = 64;
const HEX_PER_WORD = 4;

function deriveEntropy(text: string, lang: Bip39Language, salt: string): Uint8Array {
  const wordIndex = getWordIndex(lang);
  const tokens = tokenize(text, lang);

  let entropyHex = '';
  for (const token of tokens) {
    if (entropyHex.length >= HEX_CAP) break;
    const index = wordIndex.get(token);
    if (index !== undefined) {
      entropyHex += index.toString(16).padStart(HEX_PER_WORD, '0');
    }
  }

  // Pad to exactly 64 hex chars (32 bytes) if fewer than 16 words matched
  entropyHex = entropyHex.padEnd(HEX_CAP, '0');

  // sha256(entropy bytes) → sha256(entropy_hash ‖ sha256(salt))
  const entropyHash = sha256(hexToBytes(entropyHex));
  const saltHash = sha256(new TextEncoder().encode(salt));
  const combined = new Uint8Array(64);
  combined.set(entropyHash, 0);
  combined.set(saltHash, 32);
  return sha256(combined); // 32 bytes → 24-word mnemonic
}

// Count only words that actually contribute to entropy (max 16)
function countMatches(text: string, lang: Bip39Language): number {
  const wordIndex = getWordIndex(lang);
  const tokens = tokenize(text, lang);
  let count = 0;
  let hexLen = 0;
  for (const token of tokens) {
    if (hexLen >= HEX_CAP) break;
    if (wordIndex.has(token)) {
      count++;
      hexLen += HEX_PER_WORD;
    }
  }
  return count;
}

export default function EnigmaScreen() {
  const { go, goBack, setGeneratedWords, setMnemonicLang, setPassphrase } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const [lang, setLang] = useState<Bip39Language>('en');
  const [text, setText] = useState('');
  const [salt, setSalt] = useState('');
  const [showSalt, setShowSalt] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');

  const matchCount = useMemo(
    () => (text.trim() ? countMatches(text, lang) : 0),
    [text, lang],
  );

  const canGenerate = text.trim().length > 0 && salt.trim().length > 0 && matchCount > 0;

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    const finalEntropy = deriveEntropy(text, lang, salt);
    const mnemonic = entropyToMnemonic(finalEntropy, 'en');
    setGeneratedWords(mnemonic.split(' '));
    setMnemonicLang('en');
    setPassphrase(passphraseInput);
    go('EnigmaMnemonic');
  }, [canGenerate, text, lang, salt, passphraseInput, go, setGeneratedWords, setMnemonicLang, setPassphrase]);

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <TopBar title={t.enigma.title} onBack={goBack} />
      <ScrollView style={s.scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.sub}>{t.enigma.sub}</Text>

        <LangPicker value={lang} onChange={setLang} />

        {/* Riddle text */}
        <Text style={s.label}>{t.enigma.textLabel}</Text>
        <TextInput
          style={s.textarea}
          value={text}
          onChangeText={setText}
          placeholder={t.enigma.textPlaceholder}
          placeholderTextColor={C.textDisabled}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />

        {/* Match feedback */}
        {text.trim().length > 0 && (
          <View style={s.matchRow}>
            <Icon
              name={matchCount > 0 ? 'check-circle' : 'error'}
              size={14}
              color={matchCount > 0 ? C.primary : C.error}
            />
            <Text style={[s.matchText, { color: matchCount > 0 ? C.primary : C.error }]}>
              {matchCount > 0 ? t.enigma.matchCount(matchCount) : t.enigma.noMatch}
            </Text>
          </View>
        )}

        {/* Salt (required) */}
        <Text style={s.label}>{t.enigma.saltLabel}</Text>
        <View style={s.saltRow}>
          <TextInput
            style={s.saltInput}
            value={salt}
            onChangeText={setSalt}
            placeholder={t.enigma.saltPlaceholder}
            placeholderTextColor={C.textDisabled}
            secureTextEntry={!showSalt}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowSalt(v => !v)} activeOpacity={0.7}>
            <Icon name={showSalt ? 'visibility-off' : 'visibility'} size={20} color={C.text2} />
          </TouchableOpacity>
        </View>
        {salt.length > 0 && <Text style={s.saltHint}>{t.enigma.saltHint}</Text>}

        {/* BIP-39 Passphrase (optional) */}
        <PassphraseBox
          value={passphraseInput}
          onChange={setPassphraseInput}
          toggleLabel={t.enigma.advanced}
          label={t.enigma.passphraseLabel}
          description={t.enigma.passphraseDesc}
          placeholder={t.enigma.passphrasePlaceholder}
          hint={t.enigma.passphraseHint}
        />

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={s.footer}>
        <Button
          variant="primary"
          icon="arrow_forward"
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          {t.enigma.generate}
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
    sub: {
      fontFamily: Fonts.manrope.regular,
      fontSize: 14,
      color: C.text2,
      lineHeight: 20,
      marginBottom: 4,
    },
    label: {
      fontFamily: Fonts.spaceGrotesk.semiBold,
      fontSize: 13,
      color: C.text2,
      marginTop: 20,
      marginBottom: 8,
    },
    textarea: {
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: R.xl,
      color: C.text,
      fontSize: 14,
      fontFamily: Fonts.manrope.regular,
      padding: 14,
      minHeight: 120,
      lineHeight: 22,
    },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    matchText: {
      fontFamily: Fonts.spaceGrotesk.semiBold,
      fontSize: 12,
    },
    saltRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    saltInput: {
      flex: 1,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: R.lg,
      color: C.text,
      fontSize: 14,
      fontFamily: Fonts.manrope.regular,
      padding: 12,
    },
    eyeBtn: { padding: 8 },
    saltHint: {
      fontFamily: Fonts.manrope.regular,
      fontSize: 11,
      color: C.error,
      lineHeight: 16,
      marginTop: 6,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 0,
    },
  });
