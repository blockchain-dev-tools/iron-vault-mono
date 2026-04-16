import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { revealMnemonic } from '@iron-vault/wallet';
import { walletStorage } from '../../lib/storage';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import AlertBanner from '../../components/ui/AlertBanner';
import PinPad from '../../components/ui/PinPad';
import PinDots from '../../components/ui/PinDots';
import PinLoadingSpinner from '../../components/ui/PinLoadingSpinner';
import { Fonts } from '../../lib/fonts';

export default function BackupSeedScreen() {
  const { goBack } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);

  const [words, setWords] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const padOpacity = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(padOpacity, { toValue: loading ? 0 : 1, duration: 200, useNativeDriver: true }),
      Animated.timing(dotOpacity, { toValue: loading ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [loading, padOpacity, dotOpacity]);

  const handlePin = async (pin: string, reset: () => void) => {
    setLoading(true);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      const mnemonic = await revealMnemonic(walletStorage, pin);
      if (mnemonic) {
        setWords(mnemonic.split(/[\s\u3000]+/));
      } else {
        setLoading(false);
        setError(true);
        reset();
        setTimeout(() => setError(false), 900);
      }
    } catch {
      setLoading(false);
      setError(true);
      reset();
      setTimeout(() => setError(false), 900);
    }
  };

  return (
    <View style={s.root}>
      <TopBar title={t.backupSeed.title} onBack={goBack} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <AlertBanner icon={<Text style={s.warnIcon}>⚠️</Text>}>
          <Text style={s.warnText}>{t.backupSeed.warning}</Text>
        </AlertBanner>

        {words ? (
          /* ── Revealed: word grid ── */
          <>
            <View style={s.grid}>
              {words.map((w, i) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipNum}>{i + 1}</Text>
                  <Text style={s.chipWord}>{w}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 24 }} />
            <Button variant="primary" onPress={goBack}>{t.backupSeed.done}</Button>
          </>
        ) : (
          /* ── PIN entry ── */
          <View style={s.pinSection}>
            <Text style={s.pinLabel}>{t.backupSeed.enterPin}</Text>
            <View style={s.pinArea}>
              <Animated.View style={[s.loadingOverlay, { opacity: dotOpacity }]} pointerEvents="none">
                <PinLoadingSpinner color={C.primary} />
              </Animated.View>
              <Animated.View style={{ opacity: padOpacity }}>
                <PinPad onComplete={handlePin} error={error} />
              </Animated.View>
            </View>
          </View>
        )}

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
  pinSection: { alignItems: 'center', marginTop: 32 },
  pinLabel: { color: C.text2, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
  pinArea: { alignItems: 'center' },
  loadingOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  chip: {
    width: '47%', backgroundColor: C.surfaceContainerLow, borderRadius: R.lg,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  chipNum: { color: C.text2, fontSize: 11, minWidth: 18 },
  chipWord: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.semiBold },
});
