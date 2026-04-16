import React, { useMemo } from 'react';
import {
  Alert, ScrollView, StyleSheet, View,
} from 'react-native';
import { clearWallet } from '@iron-vault/wallet';
import { walletStorage } from '../lib/storage';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { ThemeMode, LocaleMode } from '../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';
import Dropdown from '../components/ui/Dropdown';
import type { DropdownOption } from '../components/ui/Dropdown';
import SettingRow from '../components/ui/SettingRow';
import SegmentedControl from '../components/ui/SegmentedControl';

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

  const LOCALE_OPTIONS: DropdownOption<LocaleMode>[] = [
    { value: 'system', label: t.settings.langSystem },
    { value: 'en',     label: t.settings.langEn },
    { value: 'zh',     label: t.settings.langZh },
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

        {/* Appearance */}
        <SectionLabel>{t.settings.appearance}</SectionLabel>
        <SegmentedControl<ThemeMode>
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={setThemeMode}
        />

        {/* Language */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.language}</SectionLabel>
        <Dropdown<LocaleMode>
          value={localeMode}
          options={LOCALE_OPTIONS}
          onChange={setLocaleMode}
        />

        {/* Security */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.security}</SectionLabel>
        <SettingRow label={t.settings.changePin} onPress={() => go('SetPin')} />
        <SettingRow label={t.settings.backupSeed} onPress={() => go('GenerateMnemonic')} />
        <SettingRow label={t.settings.autoLock} value={t.settings.autoLockValue} />

        {/* Bluetooth */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.bluetooth}</SectionLabel>
        <SettingRow label={t.settings.deviceName} value={t.settings.deviceNameValue} />

        {/* About */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.about}</SectionLabel>
        <SettingRow label={t.settings.version} value={t.settings.versionValue} />

        <View style={{ height: 32 }} />
        <Button variant="danger" onPress={handleReset}>{t.settings.resetWallet}</Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20 },
});
