import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { Fonts } from '../../lib/fonts';

interface Props {
  value: string;
  onChange: (v: string) => void;
  toggleLabel: string;
  label: string;
  description: string;
  placeholder: string;
  hint: string;
}

export default function PassphraseBox({ value, onChange, toggleLabel, label, description, placeholder, hint }: Props) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={s.toggle}
        onPress={() => setShowAdvanced(v => !v)}
        activeOpacity={0.7}>
        <Text style={s.toggleText}>
          {showAdvanced ? '▾' : '▸'} {toggleLabel}
        </Text>
        {value.length > 0 && !showAdvanced && <View style={s.activeDot} />}
      </TouchableOpacity>

      {showAdvanced && (
        <View style={s.box}>
          <Text style={s.label}>{label}</Text>
          <Text style={s.desc}>{description}</Text>
          <View style={s.row}>
            <TextInput
              style={s.input}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={C.textDisabled}
              secureTextEntry={!showPassphrase}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassphrase(v => !v)} activeOpacity={0.7}>
              <Text style={s.eyeIcon}>{showPassphrase ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {value.length > 0 && <Text style={s.hint}>{hint}</Text>}
        </View>
      )}
    </>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 8, gap: 8 },
  toggleText: { color: C.text2, fontSize: 13, fontFamily: Fonts.spaceGrotesk.semiBold },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  box: {
    backgroundColor: C.surfaceContainer, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.borderVariant,
    padding: 16, gap: 10,
  },
  label: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.bold },
  desc: { color: C.text2, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: R.lg, color: C.text, fontSize: 14, padding: 12,
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 20 },
  hint: { color: C.error, fontSize: 11, lineHeight: 16 },
});
