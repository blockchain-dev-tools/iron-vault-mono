import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import ShieldLogo from './ShieldLogo';
import { Fonts } from '../../lib/fonts';

export default function IronVaultHero() {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.hero}>
      <View style={s.logoWrap}>
        <ShieldLogo primary={C.primary} />
      </View>
      <View style={s.titleBlock}>
        <Text style={s.titleIron}>IRON</Text>
        <Text style={s.titleVault}>VAULT</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  hero: { alignItems: 'center' },
  logoWrap: { marginBottom: 40 },
  titleBlock: { alignSelf: 'center' },
  titleIron: {
    fontFamily: Fonts.spaceGrotesk.bold,
    fontSize: 52, letterSpacing: -2, lineHeight: 44,
    textAlign: 'center', color: C.text,
  },
  titleVault: {
    fontFamily: Fonts.spaceGrotesk.bold,
    fontSize: 52, letterSpacing: -2, lineHeight: 44,
    textAlign: 'center', color: C.primary, marginBottom: 20,
  },
});