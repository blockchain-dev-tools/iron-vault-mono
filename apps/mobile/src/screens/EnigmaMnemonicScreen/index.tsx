import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reencodeMnemonic } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import LangPicker from '../../components/ui/LangPicker';
import { Fonts } from '../../lib/fonts';

export default function EnigmaMnemonicScreen() {
  const { go, goBack, generatedWords, setGeneratedWords, mnemonicLang, setMnemonicLang } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const handleLangChange = (newLang: Bip39Language) => {
    if (newLang === mnemonicLang) return;
    const sep = mnemonicLang === 'ja' ? '\u3000' : ' ';
    const newMnemonic = reencodeMnemonic(generatedWords.join(sep), mnemonicLang, newLang);
    setGeneratedWords(newMnemonic.split(/[\s\u3000]+/));
    setMnemonicLang(newLang);
  };

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <TopBar title={t.enigmaMnemonic.title} onBack={goBack} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={s.infoBanner}>
          <Icon name="mci:puzzle-outline" size={18} color={C.primary} />
          <Text style={s.infoText}>{t.enigmaMnemonic.info}</Text>
        </View>

        <LangPicker value={mnemonicLang} onChange={handleLangChange} />

        {/* Word grid */}
        <View style={s.grid}>
          {generatedWords.map((w, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipNum}>{i + 1}</Text>
              <Text style={s.chipWord}>{w}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={s.footer}>
        <Button variant="primary" icon="arrow_forward" onPress={() => go('SetPin')}>
          {t.enigmaMnemonic.continue}
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.surfaceContainer,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.borderVariant,
    padding: 14,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.manrope.regular,
    fontSize: 13,
    color: C.text2,
    lineHeight: 19,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  chip: {
    width: '47%',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipNum: { color: C.text2, fontSize: 11, minWidth: 22 },
  chipWord: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.semiBold },
  footer: { paddingHorizontal: 24 },
});
