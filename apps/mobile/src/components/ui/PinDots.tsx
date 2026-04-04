import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

interface PinDotsProps {
  length: number;
  error?: boolean;
}

export default function PinDots({ length, error }: PinDotsProps) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i < length && (error ? s.dotError : s.dotFilled),
          ]}
        />
      ))}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 28 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.border },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  dotError: { backgroundColor: C.error, borderColor: C.error },
});
