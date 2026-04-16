import React, { useMemo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

interface PinDotsProps {
  length: number;
  error?: boolean;
  loading?: boolean;
}

export default function PinDots({ length, error, loading }: PinDotsProps) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  // One animated value per dot, drives scan animation
  const scanAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  // backgroundColor cannot use native driver — animate only opacity + scale (native-driver safe)
  const interpolations = useRef(
    scanAnims.map(anim => ({
      scale:   anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }),
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
    }))
  ).current;

  useEffect(() => {
    if (!loading) {
      scanAnims.forEach(a => {
        a.stopAnimation();
        a.setValue(0);
      });
      return;
    }

    // Each dot: delay(i*150ms) peak(200ms) fall(300ms) rest
    // Total cycle = 1400ms so dot 5 fits: 750+200+300+150 = 1400
    const loops = scanAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(1400 - i * 150 - 500),
        ])
      )
    );

    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <View style={s.row}>
      {Array.from({ length: 6 }).map((_, i) => {
        if (loading) {
          const { scale, opacity } = interpolations[i];
          return (
            <Animated.View
              key={i}
              style={[s.dot, s.dotFilled, { opacity, transform: [{ scale }] }]}
            />
          );
        }
        return (
          <View
            key={i}
            style={[s.dot, i < length && (error ? s.dotError : s.dotFilled)]}
          />
        );
      })}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 28 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.border },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  dotError: { backgroundColor: C.error, borderColor: C.error },
});
