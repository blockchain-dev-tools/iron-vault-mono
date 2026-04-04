import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import SectionLabel from '../components/ui/SectionLabel';

const POSITIONS = [2, 6, 10];
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default function VerifyMnemonicScreen() {
  const { go, generatedWords } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongError, setWrongError] = useState(false);

  const groups = useMemo(() =>
    POSITIONS.map(pos => ({
      pos, correct: generatedWords[pos],
      opts: shuffle([generatedWords[pos], ...shuffle(generatedWords.filter((_, j) => j !== pos)).slice(0, 3)]),
    })), [generatedWords]);

  const pick = (pos: number, word: string) => {
    const next = { ...answers, [pos]: word };
    setAnswers(next);

    if (Object.keys(next).length === POSITIONS.length) {
      const allCorrect = POSITIONS.every(p => generatedWords[p] === next[p]);
      if (allCorrect) {
        setTimeout(() => go('SetPin'), 400);
      } else {
        setWrongError(true);
        setTimeout(() => {
          setAnswers({});
          setWrongError(false);
        }, 1200);
      }
    }
  };

  return (
    <View style={s.root}>
      <TopBar title={t.verifyMnemonic.title} onBack={() => go('GenerateMnemonic')} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {wrongError && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{t.verifyMnemonic.incorrect}</Text>
          </View>
        )}
        {groups.map(({ pos, correct, opts }) => (
          <View key={pos} style={s.group}>
            <SectionLabel>{t.verifyMnemonic.wordLabel(pos + 1)}</SectionLabel>
            <View style={s.opts}>
              {opts.map(o => {
                const picked = answers[pos];
                const isCorrect = picked === o && o === correct;
                const isWrong = picked === o && o !== correct;
                return (
                  <TouchableOpacity
                    key={o}
                    style={[s.opt, isCorrect && s.optCorrect, isWrong && s.optWrong]}
                    onPress={() => !wrongError && pick(pos, o)}
                    activeOpacity={0.7}>
                    <Text style={[s.optText, isCorrect && s.optTextCorrect, isWrong && s.optTextWrong]}>{o}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <TouchableOpacity style={s.skip} onPress={() => go('SetPin')}>
          <Text style={s.skipText}>{t.verifyMnemonic.skip}</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  errorBanner: { backgroundColor: C.errorContainer, borderWidth: 1, borderColor: C.error, borderRadius: R.lg, padding: 12, marginBottom: 16, alignItems: 'center' },
  errorText: { color: C.error, fontSize: 13, fontWeight: '700' },
  group: { marginBottom: 24 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opt: {
    width: '47%', backgroundColor: C.surfaceContainer,
    borderWidth: 2, borderColor: 'transparent',
    borderRadius: R.lg, paddingVertical: 14, alignItems: 'center',
  },
  optCorrect: { borderColor: C.primary, backgroundColor: C.primary12 },
  optWrong: { borderColor: C.error, backgroundColor: C.errorContainer },
  optText: { color: C.text, fontSize: 14 },
  optTextCorrect: { color: C.primary },
  optTextWrong: { color: C.error },
  skip: { alignSelf: 'center', marginTop: 8, paddingVertical: 12 },
  skipText: { color: C.text2, fontSize: 12, textDecorationLine: 'underline' },
});
