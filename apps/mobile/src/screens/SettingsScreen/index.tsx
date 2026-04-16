import React, { useMemo } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { clearWallet } from '@iron-vault/wallet';
import { walletStorage } from '../../lib/storage';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import type { ThemeMode, LocaleMode } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import Button from '../../components/ui/Button';
import SectionLabel from '../../components/ui/SectionLabel';
import SettingRow from '../../components/ui/SettingRow';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { Fonts } from '../../lib/fonts';

export default function SettingsScreen() {
  const {
    go, reset: navReset,
    setAccounts, setBleState,
    themeMode, setThemeMode,
    localeMode, setLocaleMode,
  } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);

  const THEME_OPTIONS = [
    { value: 'system' as ThemeMode, label: t.settings.themeAuto },
    { value: 'light' as ThemeMode,  label: t.settings.themeLight },
    { value: 'dark' as ThemeMode,   label: t.settings.themeDark },
  ];

  const LOCALE_OPTIONS = [
    { value: 'system' as LocaleMode, label: t.settings.langSystem },
    { value: 'en'     as LocaleMode, label: t.settings.langEn },
    { value: 'zh'     as LocaleMode, label: t.settings.langZh },
  ];

  const handleReset = () => {
    Alert.alert(t.settings.resetTitle, t.settings.resetMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.reset, style: 'destructive',
        onPress: async () => {
          await clearWallet(walletStorage);
          setAccounts({ eth: [], sol: [] });
          setBleState('idle');
          navReset('Welcome');
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Text style={s.title}>{t.settings.title}</Text>

        {/* Appearance */}
        <SectionLabel>{t.settings.appearance}</SectionLabel>
        <SegmentedControl<ThemeMode>
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={setThemeMode}
        />

        {/* Language */}
        <SectionLabel>{t.settings.language}</SectionLabel>
        <SegmentedControl<LocaleMode>
          options={LOCALE_OPTIONS}
          value={localeMode}
          onChange={setLocaleMode}
        />

        {/* Security */}
        <SectionLabel>{t.settings.security}</SectionLabel>
        <View style={s.card}>
          <SettingRow label={t.settings.changePin} onPress={() => go('SetPin')} />
          <SettingRow label={t.settings.backupSeed} onPress={() => go('GenerateMnemonic')} />
          <SettingRow label={t.settings.autoLock} value={t.settings.autoLockValue} last />
        </View>

        {/* Bluetooth */}
        <SectionLabel>{t.settings.bluetooth}</SectionLabel>
        <View style={s.card}>
          <SettingRow label={t.settings.deviceName} value={t.settings.deviceNameValue} last />
        </View>

        {/* About */}
        <SectionLabel>{t.settings.about}</SectionLabel>
        <View style={s.card}>
          <SettingRow label={t.settings.version} value={t.settings.versionValue} last />
        </View>

        <Button variant="danger" onPress={handleReset}>{t.settings.resetWallet}</Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  title: { color: C.text, fontSize: 28, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 12 },
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: R.xl,
    overflow: 'hidden',
  },
});
