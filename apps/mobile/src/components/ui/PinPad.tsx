import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';
import PinDots from './PinDots';

interface PinPadProps {
  onComplete: (pin: string, reset: () => void) => void;
  error?: boolean;
}

const ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [null, 0, 'DEL'],
] as const;

// Spring config for key press/release
const PRESS_SPRING   = { damping: 14, mass: 0.5, stiffness: 350, useNativeDriver: true } as const;
const RELEASE_SPRING = { damping: 12, mass: 0.4, stiffness: 300, useNativeDriver: true } as const;

export default function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState('');
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  // One Animated.Value per key slot (row-major order, matches ROWS)
  const scales = useRef(ROWS.flat().map(() => new Animated.Value(1))).current;

  const reset = () => setPin('');

  const handleKey = (k: number | 'DEL' | null) => {
    if (k === null) return;
    setPin(prev => {
      if (k === 'DEL') return prev.slice(0, -1);
      if (prev.length >= 6) return prev;
      return prev + String(k);
    });
  };

  const pressIn = (i: number) => {
    Animated.spring(scales[i], { toValue: 0.82, ...PRESS_SPRING }).start();
  };

  const pressOut = (i: number) => {
    Animated.spring(scales[i], { toValue: 1, ...RELEASE_SPRING }).start();
  };

  useEffect(() => {
    if (pin.length === 6) {
      const timer = setTimeout(() => onComplete(pin, reset), 150);
      return () => clearTimeout(timer);
    }
  // onComplete is intentionally excluded: callers must memoize with useCallback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <View>
      <PinDots length={pin.length} error={error} />
      <View style={s.pad}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((k, ci) => {
              const i = ri * 3 + ci;
              if (k === null) {
                return <View key={ci} style={[s.key, s.keyEmpty]} />;
              }
              return (
                <TouchableWithoutFeedback
                  key={ci}
                  onPress={() => handleKey(k)}
                  onPressIn={() => pressIn(i)}
                  onPressOut={() => pressOut(i)}>
                  <Animated.View style={[s.key, { transform: [{ scale: scales[i] }] }]}>
                    <Text style={s.keyText}>{k === 'DEL' ? '⌫' : k}</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  pad: { alignSelf: 'center', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    width: 72, height: 56, borderRadius: R.lg,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: { color: C.text, fontSize: 24, fontWeight: '500' },
});