import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';
import Icon from './Icon';

export default function SettingRow({ label, value, onPress, switchValue, onSwitchChange, last }: {
  label: string;
  value?: string;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  last?: boolean;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const pressable = !!onPress;
  const hasSwitch = switchValue !== undefined;

  const inner = (
    <>
      <Text style={s.label}>{label}</Text>
      {hasSwitch
        ? <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            thumbColor={switchValue ? C.primary : C.textDisabled}
            trackColor={{ false: C.borderVariant, true: C.primary + '66' }}
          />
        : pressable
          ? <Icon name="chevron-right" size={18} color={C.text2} />
          : <Text style={s.value}>{value}</Text>
      }
    </>
  );

  if (hasSwitch) {
    return (
      <View style={[s.row, !last && s.rowBorder]}>
        {inner}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[s.row, !last && s.rowBorder]}
      onPress={onPress}
      disabled={!pressable}
      activeOpacity={pressable ? 0.6 : 1}
    >
      {inner}
    </TouchableOpacity>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderVariant },
  label: { color: C.text, fontSize: 15 },
  value: { color: C.text2, fontSize: 14 },
});
