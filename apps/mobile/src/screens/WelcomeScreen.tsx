import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { LocaleMode, ThemeMode } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import BgLines from '../components/ui/BgLines';
import IronVaultHero from '../components/ui/IronVaultHero';
import { Fonts } from '../lib/fonts';

const LOCALE_CYCLE: LocaleMode[] = ['en', 'zh', 'system'];
const LOCALE_LABEL: Record<LocaleMode, string> = {
  en: 'EN',
  zh: '中文',
  system: 'Auto',
};

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_ICON: Record<ThemeMode, string> = {
  light: 'light-mode',
  dark: 'dark-mode',
  system: 'brightness-auto',
};

export default function WelcomeScreen() {
  const { go, localeMode, setLocaleMode, themeMode, setThemeMode } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const handleCreate = () => {
    go('Entropy');
  };

  const cycleLocale = () => {
    const idx = LOCALE_CYCLE.indexOf(localeMode);
    setLocaleMode(LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]);
  };

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(themeMode);
    setThemeMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <BgLines color={C.primary} />

      {/* Top controls */}
      <View style={s.topRow}>
        <TouchableOpacity style={s.themeBtn} onPress={cycleTheme} activeOpacity={0.7}>
          <Icon name={THEME_ICON[themeMode]} size={18} color={C.text2} />
        </TouchableOpacity>
        <TouchableOpacity style={s.langBtn} onPress={cycleLocale} activeOpacity={0.7}>
          <Text style={s.langBtnText}>{LOCALE_LABEL[localeMode]}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Hero */}
      <View style={{ alignItems: 'center' }}>
        <IronVaultHero />
        <Text style={s.sub}>{t.welcome.sub}</Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Actions */}
      <View style={s.actions}>
        <Button variant="primary" icon="arrow_forward" onPress={handleCreate}>{t.welcome.createWallet}</Button>
        <View style={{ height: 12 }} />
        <Button variant="secondary" icon="mci:tray-arrow-down" onPress={() => go('ImportMnemonic')}>{t.welcome.importWallet}</Button>
      </View>

      {/* Security info */}
      <View style={s.secRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="verified_user" size={18} color={C.primary} />
            <Text style={s.secTitle}>{t.welcome.airGapped}</Text>
          </View>
          <Text style={s.secSub}>{t.welcome.airGappedSub}</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  topRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
  },
  themeBtn: {
    width: 32, height: 32, borderRadius: R.lg,
    backgroundColor: C.surfaceContainer, borderWidth: 1, borderColor: C.borderVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: R.lg, backgroundColor: C.surfaceContainer,
    borderWidth: 1, borderColor: C.borderVariant,
  },
  langBtnText: { fontFamily: Fonts.spaceGrotesk.semiBold, color: C.text2, fontSize: 12 },
  sub: {
    fontFamily: Fonts.manrope.regular,
    color: C.text2, fontSize: 15, textAlign: 'center', lineHeight: 22,
    maxWidth: 240, marginTop: 20,
  },
  actions: { width: '100%', marginBottom: 16 },
  secRow: {
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', marginTop: 20,
  },
  secTitle: { fontFamily: Fonts.spaceGrotesk.semiBold, color: C.primary, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  secSub: { fontFamily: Fonts.manrope.regular, color: C.text2, fontSize: 12, marginTop: 2 },
});