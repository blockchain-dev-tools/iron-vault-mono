import React, { useMemo, useRef, useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { clearWallet } from '@iron-vault/wallet';
import { walletStorage } from '../lib/storage';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { ThemeMode, LocaleMode } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';

// ── Inline dropdown ───────────────────────────────────────────────────────────

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

function Dropdown<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeDropdownStyles(C), [C]);
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <TouchableOpacity
        style={s.dropdownTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}>
        <Text style={s.dropdownValue}>{selected?.label ?? ''}</Text>
        <Text style={s.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={s.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.dropdownMenu}>
                {options.map((opt, i) => {
                  const active = opt.value === value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        s.dropdownItem,
                        i < options.length - 1 && s.dropdownItemBorder,
                      ]}
                      onPress={() => { onChange(opt.value); setOpen(false); }}
                      activeOpacity={0.7}>
                      <Text style={[s.dropdownItemText, active && s.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                      {active && <Text style={s.dropdownCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({ label, value, onPress }: {
  label: string; value?: string; onPress?: () => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeRowStyles(C), [C]);
  return (
    <TouchableOpacity
      style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value ?? '›'}</Text>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const {
    go, goBack, reset: navReset,
    setAccounts, setBleState,
    themeMode, setThemeMode,
    localeMode, setLocaleMode,
  } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);

  const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
    { mode: 'system', label: t.settings.themeAuto },
    { mode: 'light',  label: t.settings.themeLight },
    { mode: 'dark',   label: t.settings.themeDark },
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
      <TopBar title={t.settings.title} onBack={goBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <SectionLabel>{t.settings.appearance}</SectionLabel>
        <View style={s.segRow}>
          {THEME_OPTIONS.map(opt => {
            const active = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                style={[s.segBtn, active && s.segBtnActive]}
                onPress={() => setThemeMode(opt.mode)}
                activeOpacity={0.7}>
                <Text style={[s.segLabel, active && s.segLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
        <Row label={t.settings.changePin} onPress={() => go('SetPin')} />
        <Row label={t.settings.backupSeed} onPress={() => go('GenerateMnemonic')} />
        <Row label={t.settings.autoLock} value={t.settings.autoLockValue} />

        {/* Bluetooth */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.bluetooth}</SectionLabel>
        <Row label={t.settings.deviceName} value={t.settings.deviceNameValue} />

        {/* About */}
        <View style={{ height: 20 }} />
        <SectionLabel>{t.settings.about}</SectionLabel>
        <Row label={t.settings.version} value={t.settings.versionValue} />

        <View style={{ height: 32 }} />
        <Button variant="danger" onPress={handleReset}>{t.settings.resetWallet}</Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeDropdownStyles = (C: ColorTokens) => StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surfaceContainer, borderRadius: R.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.borderVariant,
  },
  dropdownValue: { color: C.text, fontSize: 15 },
  dropdownChevron: { color: C.text2, fontSize: 14 },
  dropdownOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40,
  },
  dropdownMenu: {
    width: '100%', backgroundColor: C.surface,
    borderRadius: R.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: C.borderVariant,
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: C.borderVariant },
  dropdownItemText: { color: C.text, fontSize: 16 },
  dropdownItemTextActive: { color: C.primary, fontWeight: '700' },
  dropdownCheck: { color: C.primary, fontSize: 16, fontWeight: '700' },
});

const makeRowStyles = (C: ColorTokens) => StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.borderVariant },
  rowLabel: { color: C.text, fontSize: 15 },
  rowValue: { color: C.text2, fontSize: 14 },
});

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  // Segmented control (theme)
  segRow: { flexDirection: 'row', gap: 10 },
  segBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: R.lg, backgroundColor: C.surfaceContainer,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  segBtnActive: { borderColor: C.primary, backgroundColor: C.primary12 },
  segLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
  segLabelActive: { color: C.primary },
});
