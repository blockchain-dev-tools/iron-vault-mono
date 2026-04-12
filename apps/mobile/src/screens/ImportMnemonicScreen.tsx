import React, { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { BIP39_WORDLISTS, validateMnemonicWithWordlist } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import LangPicker from '../components/ui/LangPicker';
import { Fonts } from '../lib/fonts';

export default function ImportMnemonicScreen() {
  const { go, setGeneratedWords, setPassphrase } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [input, setInput] = useState('');
  const [selectedLang, setSelectedLang] = useState<Bip39Language>('en');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const words = input.trim().split(/[\s\u3000]+/).filter(Boolean);
  const isValid = words.length === 12 && validateMnemonicWithWordlist(input.trim(), selectedLang);

  const lastPartial = useMemo(() => {
    if (!input || input.match(/[\s\u3000]$/)) return '';
    const parts = input.split(/[\s\u3000]/);
    return parts[parts.length - 1].toLowerCase();
  }, [input]);

  const suggestions = useMemo(() => {
    if (lastPartial.length < 2) return [];
    return BIP39_WORDLISTS[selectedLang].filter(w => w.startsWith(lastPartial)).slice(0, 5);
  }, [lastPartial, selectedLang]);

  const applySuggestion = (word: string) => {
    const sep = selectedLang === 'ja' ? '\u3000' : ' ';
    const parts = input.split(/[\s\u3000]/);
    parts[parts.length - 1] = word;
    setInput(parts.join(sep) + sep);
  };

  const handleLangChange = (lang: Bip39Language) => {
    setSelectedLang(lang);
    setInput('');
  };

  const statusText = () => {
    if (!input.trim()) return '';
    if (words.length > 12) return t.importMnemonic.tooManyWords;
    if (words.length < 12) return t.importMnemonic.wordsOf(words.length);
    if (!isValid) return t.importMnemonic.invalid;
    return t.importMnemonic.valid;
  };

  const handleConfirm = () => {
    if (!isValid) return;
    setGeneratedWords(input.trim().split(/[\s\u3000]+/));
    setPassphrase(passphraseInput);
    go('SetPin');
  };

  return (
    <View style={s.root}>
      <TopBar title={t.importMnemonic.title} onBack={() => go('Welcome')} />
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Text style={s.sub}>{t.importMnemonic.sub}</Text>

        <LangPicker value={selectedLang} onChange={handleLangChange} />

        <TextInput
          style={[s.input, !!lastPartial && suggestions.length > 0 && s.inputActive]}
          value={input}
          onChangeText={setInput}
          multiline
          placeholder={t.importMnemonic.placeholder}
          placeholderTextColor={C.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={selectedLang === 'en'}
          spellCheck={false}
        />

        {suggestions.length > 0 && (
          <View style={s.suggestRow}>
            {suggestions.map(w => (
              <TouchableOpacity
                key={w}
                style={[s.suggestChip, w === lastPartial && s.suggestChipExact]}
                onPress={() => applySuggestion(w)}
                activeOpacity={0.7}>
                <Text style={[s.suggestText, w === lastPartial && s.suggestTextExact]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!statusText() && (
          <Text style={[s.status, isValid ? s.statusValid : s.statusInvalid]}>
            {statusText()}
          </Text>
        )}

        <TouchableOpacity
          style={s.advancedToggle}
          onPress={() => setShowAdvanced(v => !v)}
          activeOpacity={0.7}>
          <Text style={s.advancedToggleText}>
            {showAdvanced ? '▾' : '▸'} {t.importMnemonic.advanced}
          </Text>
          {passphraseInput.length > 0 && !showAdvanced && (
            <View style={s.activeDot} />
          )}
        </TouchableOpacity>

        {showAdvanced && (
          <View style={s.advancedBox}>
            <Text style={s.advancedLabel}>{t.importMnemonic.passphraseLabel}</Text>
            <Text style={s.advancedDesc}>{t.importMnemonic.passphraseDesc}</Text>
            <View style={s.passphraseRow}>
              <TextInput
                style={s.passphraseInput}
                value={passphraseInput}
                onChangeText={setPassphraseInput}
                placeholder={t.importMnemonic.passphrasePlaceholder}
                placeholderTextColor={C.textDisabled}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPassphrase(v => !v)}
                activeOpacity={0.7}>
                <Text style={s.eyeIcon}>{showPassphrase ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {passphraseInput.length > 0 && (
              <Text style={s.passphraseHint}>{t.importMnemonic.passphraseHint}</Text>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
        <Button variant="primary" disabled={!isValid} onPress={handleConfirm}>
          {t.importMnemonic.confirmImport}
        </Button>
        {isValid && <Text style={s.hint}>{t.importMnemonic.pinHint}</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sub: { color: C.text2, fontSize: 14, marginBottom: 14, lineHeight: 20 },
  input: {
    marginTop: 12,
    backgroundColor: C.surfaceContainerLow, borderWidth: 1.5, borderColor: C.border,
    borderRadius: R.xl, color: C.text, fontSize: 14, lineHeight: 21,
    padding: 16, minHeight: 120, textAlignVertical: 'top',
  },
  inputActive: { borderColor: C.primary },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 2 },
  suggestChip: { backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 7 },
  suggestChipExact: { backgroundColor: C.primary15, borderColor: C.primary },
  suggestText: { color: C.text2, fontSize: 13, fontFamily: 'monospace' },
  suggestTextExact: { color: C.primary, fontFamily: Fonts.spaceGrotesk.bold },
  status: { fontSize: 12, marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
  statusValid: { color: C.primary },
  statusInvalid: { color: C.error },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 8, gap: 8 },
  advancedToggleText: { color: C.text2, fontSize: 13, fontFamily: Fonts.spaceGrotesk.semiBold },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  advancedBox: {
    backgroundColor: C.surfaceContainer, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.borderVariant,
    padding: 16, gap: 10,
  },
  advancedLabel: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.bold },
  advancedDesc: { color: C.text2, fontSize: 12, lineHeight: 18 },
  passphraseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passphraseInput: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: R.lg, color: C.text, fontSize: 14, padding: 12,
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 20 },
  passphraseHint: { color: C.error, fontSize: 11, lineHeight: 16 },
  hint: { color: C.text2, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
