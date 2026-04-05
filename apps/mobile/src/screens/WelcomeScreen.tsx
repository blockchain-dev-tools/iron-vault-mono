import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateMnemonic } from '@iron-vault/wallet';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { LocaleMode, ThemeMode } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

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
  const { go, setGeneratedWords, localeMode, setLocaleMode, themeMode, setThemeMode } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const handleCreate = () => {
    const m = generateMnemonic(128);
    setGeneratedWords(m.split(' '));
    go('GenerateMnemonic');
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
      {/* Top controls: theme + language */}
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
      <View style={s.hero}>
        <View style={s.logoBox}>
          <Icon name="lock" size={52} color={C.primary} />
          <View style={s.pingDot} />
        </View>
        <Text style={s.title}>{t.welcome.title}</Text>
        <Text style={s.sub}>{t.welcome.sub}</Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Actions */}
      <View style={s.actions}>
        <Button variant="primary" icon="arrow_forward" onPress={handleCreate}>{t.welcome.createWallet}</Button>
        <View style={{ height: 12 }} />
        <Button variant="secondary" icon="upload" onPress={() => go('ImportMnemonic')}>{t.welcome.importWallet}</Button>
      </View>

      {/* Security card */}
      <View style={s.secCard}>
        <View style={s.secIconWrap}>
          <Icon name="verified_user" size={22} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.secTitle}>{t.welcome.airGapped}</Text>
          <Text style={s.secSub}>{t.welcome.airGappedSub}</Text>
        </View>
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
  langBtnText: { color: C.text2, fontSize: 12, fontWeight: '700' },
  hero: { alignItems: 'center' },
  logoBox: { position: 'relative', width: 100, height: 100, backgroundColor: C.surface, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  pingDot: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: C.primary, borderWidth: 2, borderColor: C.bg },
  title: { color: C.text, fontSize: 40, fontWeight: '800', textAlign: 'center', lineHeight: 46, marginBottom: 12 },
  titleAccent: { color: C.primary },
  sub: { color: C.text2, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 260 },
  actions: { width: '100%', marginBottom: 16 },
  secCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: C.surface, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border, marginTop: 8,
  },
  secIconWrap: { backgroundColor: C.primary12, padding: 8, borderRadius: R.lg },
  secTitle: { color: C.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  secSub: { color: C.text2, fontSize: 12, marginTop: 2 },
});
