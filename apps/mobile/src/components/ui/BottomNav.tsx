import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import type { ScreenName } from '../../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import Icon from './Icon';
import { Fonts } from '../../lib/fonts';

export default function BottomNav() {
  const { current, go } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const ITEMS = useMemo((): { label: string; screen: ScreenName; icon: string }[] => [
    { label: t.nav.vault,    screen: 'Vault', icon: 'mci:wallet-outline' },
    { label: t.nav.settings, screen: 'Settings', icon: 'mci:cog-outline' },
  ], [t]);

  return (
    <View style={[s.nav, { paddingBottom: insets.bottom + 4 }]}>
      {ITEMS.map(item => {
        const active = current.name === item.screen;
        return (
          <TouchableOpacity
            key={item.screen}
            onPress={() => {
              if (!active) {
                const curIdx = ITEMS.findIndex(i => i.screen === current.name);
                const dir = ITEMS.indexOf(item) < curIdx ? 'back' : 'forward';
                go(item.screen, dir);
              }
            }}
            style={[s.item, active && s.itemActive]}
            activeOpacity={0.7}>
            <Icon name={item.icon} size={24} color={active ? C.primary : C.textDisabled} />
            <Text style={[s.label, active && s.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  nav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 4, paddingHorizontal: 16,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2, borderRadius: 12 },
  itemActive: { backgroundColor: C.primary12 },
  label: { color: C.textDisabled, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: Fonts.spaceGrotesk.semiBold },
  labelActive: { color: C.primary },
});
