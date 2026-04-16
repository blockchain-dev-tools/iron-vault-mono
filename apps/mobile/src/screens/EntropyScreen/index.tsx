import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sha256 } from '@noble/hashes/sha2';
import { randomBytes } from '@noble/hashes/utils';
import { entropyToMnemonic } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import { Fonts } from '../../lib/fonts';

const TARGET_POINTS = 200;

type Dot = { x: number; y: number };

export default function EntropyScreen() {
  const { go, goBack, setMnemonicEntropy, setMnemonicLang, setGeneratedWords } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const [dots, setDots] = useState<Dot[]>([]);
  const touchBytesRef = useRef<number[]>([]);

  const progress = Math.min(dots.length / TARGET_POINTS, 1);
  const isComplete = progress >= 1;
  const progressPct = Math.round(progress * 100);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: evt => {
          const { locationX, locationY } = evt.nativeEvent;
          const ts = Date.now();
          touchBytesRef.current.push(
            Math.round(locationX) & 0xff,
            (Math.round(locationX) >> 8) & 0xff,
            Math.round(locationY) & 0xff,
            (Math.round(locationY) >> 8) & 0xff,
            ts & 0xff,
            (ts >> 8) & 0xff,
          );
          setDots(prev =>
            prev.length < TARGET_POINTS
              ? [...prev, { x: locationX, y: locationY }]
              : prev,
          );
        },
      }),
    [],
  );

  const handleContinue = useCallback(() => {
    if (!isComplete) return;
    const touchU8 = new Uint8Array(touchBytesRef.current);
    const base = randomBytes(16);
    const combined = new Uint8Array(touchU8.length + base.length);
    combined.set(touchU8, 0);
    combined.set(base, touchU8.length);
    const hash = sha256(combined);
    const entropy = hash.slice(0, 16); // 128-bit
    const mnemonic = entropyToMnemonic(entropy, 'en');
    setMnemonicEntropy(entropy);
    setMnemonicLang('en');
    setGeneratedWords(mnemonic.split(/[\s\u3000]+/));
    go('GenerateMnemonic');
  }, [isComplete, go, setMnemonicEntropy, setMnemonicLang, setGeneratedWords]);

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <TopBar title={t.collectEntropy.title} onBack={goBack} />
      <View style={s.body}>
        <Text style={s.hint}>
          {isComplete
            ? t.collectEntropy.hintDone
            : t.collectEntropy.hint}
        </Text>

        {/* Touch canvas */}
        <View style={s.canvasWrap} {...panResponder.panHandlers}>
          {dots.map((d, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  left: d.x - 3,
                  top: d.y - 3,
                  backgroundColor: C.primary,
                  opacity: 0.3 + 0.7 * (i / Math.max(dots.length - 1, 1)),
                },
              ]}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
          </View>
          <Text style={s.progressLabel}>{progressPct}%</Text>
        </View>
      </View>

      <View style={s.footer}>
        <Button
          variant={isComplete ? 'primary' : 'secondary'}
          icon="arrow_forward"
          onPress={handleContinue}
          disabled={!isComplete}
        >
          {t.collectEntropy.continue}
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    body: {
      flex: 1,
      paddingTop: 12,
      paddingHorizontal: 24,
    },
    hint: {
      fontFamily: Fonts.manrope.regular,
      fontSize: 14,
      color: C.text2,
      textAlign: 'center',
      marginBottom: 16,
    },
    canvasWrap: {
      flex: 1,
      backgroundColor: C.surface,
      borderRadius: R.xl,
      borderWidth: 1,
      borderColor: C.borderVariant,
      overflow: 'hidden',
    },
    dot: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      marginBottom: 20,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: C.surfaceContainer,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: C.primary,
      borderRadius: 3,
    },
    progressLabel: {
      fontFamily: Fonts.spaceGrotesk.semiBold,
      fontSize: 13,
      color: C.primary,
      width: 36,
      textAlign: 'right',
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 0,
    },
  });
