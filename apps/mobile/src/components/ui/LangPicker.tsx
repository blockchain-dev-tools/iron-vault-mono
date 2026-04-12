import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import type { Bip39Language } from '@iron-vault/wallet';
import { useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { Fonts } from '../../lib/fonts';
import Icon from './Icon';

export const BIP39_LANGS: Bip39Language[] = [
  'en', 'zh-Hans', 'zh-Hant', 'cs', 'fr', 'it', 'ja', 'ko', 'pt', 'es',
];

const SHEET_HEIGHT = 480;

interface Props {
  value: Bip39Language;
  onChange: (lang: Bip39Language) => void;
}

export default function LangPicker({ value, onChange }: Props) {
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [open, setOpen] = useState(false);
  const slideY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(slideY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  const close = (cb?: () => void) => {
    Animated.timing(slideY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      slideY.setValue(SHEET_HEIGHT);
      cb?.();
    });
  };

  const select = (lang: Bip39Language) => {
    close(() => onChange(lang));
  };

  return (
    <>
      {/* Trigger row */}
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Icon name="mci:translate" size={16} color={C.text2} />
        <Text style={s.triggerLabel}>{t.languages.selectorLabel}</Text>
        <Text style={s.triggerValue}>{t.languages[value]}</Text>
        <Icon name="expand_more" size={18} color={C.text2} />
      </TouchableOpacity>

      {/* Modal: fade for backdrop, Animated for sheet */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => close()}>
        <Pressable style={s.backdrop} onPress={() => close()} />
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{t.languages.selectorLabel}</Text>
            <TouchableOpacity onPress={() => close()} hitSlop={12}>
              <Icon name="close" size={20} color={C.text2} />
            </TouchableOpacity>
          </View>

          {BIP39_LANGS.map((lang, i) => {
            const active = lang === value;
            return (
              <TouchableOpacity
                key={lang}
                style={[s.row, i < BIP39_LANGS.length - 1 && s.rowBorder]}
                onPress={() => select(lang)}
                activeOpacity={0.7}>
                <Text style={[s.rowText, active && s.rowTextActive]}>
                  {t.languages[lang]}
                </Text>
                {active && <Icon name="check" size={18} color={C.primary} />}
              </TouchableOpacity>
            );
          })}

          <View style={s.sheetBottom} />
          {/* Overflow buffer — covers the gap exposed when sheet slides off screen */}
          <View style={s.sheetOverflow} />
        </Animated.View>
      </Modal>
    </>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  trigger: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.borderVariant,
    borderRadius: R.xl,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  triggerLabel: {
    flex: 1,
    color: C.text2,
    fontSize: 13,
    fontFamily: Fonts.spaceGrotesk.semiBold,
  },
  triggerValue: {
    color: C.text,
    fontSize: 13,
    fontFamily: Fonts.spaceGrotesk.semiBold,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderVariant,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontFamily: Fonts.spaceGrotesk.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderVariant,
  },
  rowText: {
    flex: 1,
    color: C.text2,
    fontSize: 15,
    fontFamily: Fonts.spaceGrotesk.semiBold,
  },
  rowTextActive: {
    color: C.primary,
  },
  sheetBottom: { height: 24 },
  sheetOverflow: { height: 300, backgroundColor: C.surface },
});
