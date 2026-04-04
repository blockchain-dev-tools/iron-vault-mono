import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

interface CardProps {
  children: React.ReactNode;
  accent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({ children, accent, onPress, style }: CardProps) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const content = (
    <>
      {accent && <View style={s.accentBar} />}
      <View style={s.inner}>{children}</View>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.card, style]}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[s.card, style]}>{content}</View>;
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: R.xl, overflow: 'hidden',
  },
  accentBar: { width: 3, position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: C.primary },
  inner: { padding: 20 },
});
