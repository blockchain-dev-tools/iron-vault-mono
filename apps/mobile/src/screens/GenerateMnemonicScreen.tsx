import React, { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { reencodeMnemonic } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import AlertBanner from '../components/ui/AlertBanner';
import LangPicker from '../components/ui/LangPicker';
import { Fonts } from '../lib/fonts';

export default function GenerateMnemonicScreen() {
  const { go, goBack, generatedWords, setGeneratedWords, mnemonicLang, setMnemonicLang, setPassphrase } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleLangChange = (newLang: Bip39Language) => {
    if (newLang === mnemonicLang) return;
    const sep = mnemonicLang === 'ja' ? '\u3000' : ' ';
    const newMnemonic = reencodeMnemonic(generatedWords.join(sep), mnemonicLang, newLang);
    setGeneratedWords(newMnemonic.split(/[\s\u3000]+/));
    setMnemonicLang(newLang);
  };

  const handleContinue = () => {
    setPassphrase(passphraseInput);
    go('VerifyMnemonic');
  };

  return (
    <View style={s.root}>
      <TopBar title={t.generateMnemonic.title} onBack={goBack} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <AlertBanner icon={<Text style={s.warnIcon}>⚠️</Text>}>
          <Text style={s.warnText}>
            <Text style={{ color: C.text, fontFamily: Fonts.spaceGrotesk.bold }}>{t.generateMnemonic.warning}</Text>
            {t.generateMnemonic.warningSub}
          </Text>
        </AlertBanner>

        <LangPicker value={mnemonicLang} onChange={handleLangChange} />

        <View style={s.grid}>
          {generatedWords.map((w, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipNum}>{i + 1}</Text>
              <Text style={s.chipWord}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Advanced passphrase */}
        <TouchableOpacity
          style={s.advancedToggle}
          onPress={() => setShowAdvanced(v => !v)}
          activeOpacity={0.7}>
          <Text style={s.advancedToggleText}>
            {showAdvanced ? '▾' : '▸'} {t.generateMnemonic.advanced}
          </Text>
          {passphraseInput.length > 0 && !showAdvanced && (
            <View style={s.activeDot} />
          )}
        </TouchableOpacity>

        {showAdvanced && (
          <View style={s.advancedBox}>
            <Text style={s.advancedLabel}>{t.generateMnemonic.passphraseLabel}</Text>
            <Text style={s.advancedDesc}>{t.generateMnemonic.passphraseDesc}</Text>
            <View style={s.passphraseRow}>
              <TextInput
                style={s.passphraseInput}
                value={passphraseInput}
                onChangeText={setPassphraseInput}
                placeholder={t.generateMnemonic.passphrasePlaceholder}
                placeholderTextColor={C.textDisabled}
                secureTextEntry={!showPassphrase}
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
              <Text style={s.passphraseHint}>{t.generateMnemonic.passphraseHint}</Text>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
        <Button variant="primary" onPress={handleContinue}>{t.generateMnemonic.writtenDown}</Button>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  warnIcon: { fontSize: 18, flexShrink: 0 },
  warnText: { color: C.text2, fontSize: 13, lineHeight: 19, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  chip: {
    width: '47%', backgroundColor: C.surfaceContainerLow, borderRadius: R.lg,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  chipNum: { color: C.text2, fontSize: 11, minWidth: 18 },
  chipWord: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.semiBold },
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
});
