import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, Pattern, Line } from 'react-native-svg';
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

function BgLines({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} opacity={0.025}>
      <Defs>
        <Pattern id="diag" x="0" y="0" width="57" height="57" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2="57" stroke={color} strokeWidth="1" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#diag)" />
    </Svg>
  );
}

function ShieldLogo({ primary }: { primary: string }) {
  return (
    <Svg width={88} height={100} viewBox="0 0 80 92" fill="none">
      <Path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V58Q52 62 48 62H32Q28 62 28 58V36Q28 32 32 32Z"
        fill={primary}
      />
      <Rect x="33" y="24" width="14" height="12" rx="7" stroke={primary} strokeWidth="3" fill="none" />
      <Circle cx="40" cy="47" r="3" fill={primary} />
      <Rect x="39" y="49" width="2" height="6" rx="1" fill={primary} />
    </Svg>
  );
}

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
      <View style={s.hero}>
        <View style={s.logoWrap}>
          <ShieldLogo primary={C.primary} />
        </View>

        {/* Title block */}
        <View style={s.titleBlock}>
          <Text style={s.titleIron}>IRON</Text>
          <Text style={s.titleVault}>VAULT</Text>
        </View>

        {/* Subtitle */}
        <Text style={s.sub}>{t.welcome.sub}</Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Actions */}
      <View style={s.actions}>
        <Button variant="primary" icon="arrow_forward" onPress={handleCreate}>{t.welcome.createWallet}</Button>
        <View style={{ height: 12 }} />
        <Button variant="secondary" icon="upload" onPress={() => go('ImportMnemonic')}>{t.welcome.importWallet}</Button>
      </View>

      {/* Security info */}
      <View style={s.secRow}>
        <Icon name="verified_user" size={20} color={C.primary} />
        <View style={{ marginLeft: 10 }}>
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
  logoWrap: { marginBottom: 40 },
  titleBlock: { alignSelf: 'center' },
  titleIron: {
    fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 44, textAlign: 'center',
    color: C.text,
  },
  titleVault: {
    fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 44, textAlign: 'center',
    color: C.primary, marginBottom: 20,
  },
  sub: {
    color: C.text2, fontSize: 15, textAlign: 'center', lineHeight: 22,
    maxWidth: 240, marginTop: 20,
  },
  actions: { width: '100%', marginBottom: 16 },
  secRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 20,
  },
  secTitle: { color: C.primary, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  secSub: { color: C.text2, fontSize: 12, marginTop: 2 },
});