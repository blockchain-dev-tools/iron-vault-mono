import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

export default function SettingRow({ label, value, onPress }: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value ?? '›'}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.borderVariant,
  },
  label: { color: C.text, fontSize: 15 },
  value: { color: C.text2, fontSize: 14 },
});
