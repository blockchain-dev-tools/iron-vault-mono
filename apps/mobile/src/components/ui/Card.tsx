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
  const content = <View style={s.inner}>{children}</View>;
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.card, style]}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[s.card, accent && s.cardAccent, style]}>{content}</View>;
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: R.xl, overflow: 'hidden',
  },
  cardAccent: {
    backgroundColor: C.primary12,
    borderWidth: 1,
    borderColor: C.primary25,
  },
  inner: { padding: 20 },
});
