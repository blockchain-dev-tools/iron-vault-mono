import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import AlertBanner from '../components/ui/AlertBanner';

export default function GenerateMnemonicScreen() {
  const { go, goBack, generatedWords } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.root}>
      <TopBar title={t.generateMnemonic.title} onBack={goBack} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <AlertBanner icon={<Text style={s.warnIcon}>⚠️</Text>}>
          <Text style={s.warnText}>
            <Text style={{ color: C.text, fontWeight: '700' }}>{t.generateMnemonic.warning}</Text>
            {t.generateMnemonic.warningSub}
          </Text>
        </AlertBanner>

        <View style={s.grid}>
          {generatedWords.map((w, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipNum}>{i + 1}</Text>
              <Text style={s.chipWord}>{w}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
        <Button variant="primary" onPress={() => go('VerifyMnemonic')}>{t.generateMnemonic.writtenDown}</Button>
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
    width: '47%', backgroundColor: C.surfaceContainer, borderRadius: R.lg,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  chipNum: { color: C.text2, fontSize: 11, minWidth: 18 },
  chipWord: { color: C.text, fontSize: 14, fontWeight: '600' },
});
