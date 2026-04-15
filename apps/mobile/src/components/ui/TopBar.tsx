import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';
import Icon from './Icon';
import { Fonts } from '../../lib/fonts';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: React.ReactNode;
  bleState?: 'idle' | 'broadcasting' | 'connected';
}

export default function TopBar({ title, onBack, hideBack, right, bleState }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      <View style={s.left}>
        {!hideBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Icon name="arrow_back" size={22} color={C.primary} />
          </TouchableOpacity>
        ) : hideBack ? (
          <View style={s.shieldWrap}>
            <Icon name="security" size={22} color={C.primary} />
          </View>
        ) : null}
        <Text style={s.title}>{title}</Text>
      </View>
      <View style={s.right}>
        {bleState && bleState !== 'idle' && (
          <View style={s.bleBadge}>
            <Icon name="sensors" size={14} color={C.primary} />
            <Text style={[s.bleText, s.bleTextActive]}>
              {bleState === 'connected' ? 'BLE Active' : 'BLE Scan'}
            </Text>
          </View>
        )}
        {right}
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  shieldWrap: { padding: 4 },
  title: { color: C.text, fontSize: 15, fontFamily: Fonts.spaceGrotesk.bold, letterSpacing: 0.5, textTransform: 'uppercase' },
  bleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.surfaceContainerLow, borderRadius: R.lg,
  },
  bleText: { color: C.text2, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: Fonts.spaceGrotesk.regular },
  bleTextActive: { color: C.text2 },
});
