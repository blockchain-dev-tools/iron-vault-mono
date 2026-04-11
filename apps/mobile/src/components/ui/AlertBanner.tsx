import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

export default function AlertBanner({ icon, children }: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.banner}>
      {icon}
      {children}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  banner: {
    flexDirection: 'row', gap: 10,
    backgroundColor: C.errorContainer, borderWidth: 1, borderColor: C.error,
    borderRadius: R.xl, padding: 14, alignItems: 'flex-start',
  },
});
