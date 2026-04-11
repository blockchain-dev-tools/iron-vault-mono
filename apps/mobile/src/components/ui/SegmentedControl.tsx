import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.row}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[s.btn, active && s.btnActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}>
            <Text style={[s.label, active && s.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: R.lg, backgroundColor: C.surfaceContainer,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  btnActive: { borderColor: C.primary, backgroundColor: C.primary12 },
  label: { color: C.text, fontSize: 14, fontWeight: '700' },
  labelActive: { color: C.primary },
});
