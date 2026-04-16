import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';
import { Fonts } from '../../lib/fonts';
import Icon from './Icon';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

export default function Dropdown<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={s.value}>{selected?.label ?? ''}</Text>
        <Icon name="chevron-right" size={20} color={C.text2} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.menu}>
                {options.map((opt, i) => {
                  const active = opt.value === value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.item, i < options.length - 1 && s.itemBorder]}
                      onPress={() => { onChange(opt.value); setOpen(false); }}
                      activeOpacity={0.7}>
                      <Text style={[s.itemText, active && s.itemTextActive]}>{opt.label}</Text>
                      {active && <Icon name="check" size={18} color={C.primary} />}
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

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  trigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surfaceContainer, borderRadius: R.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.borderVariant,
  },
  value: { color: C.text, fontSize: 15 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40,
  },
  menu: {
    width: '100%', backgroundColor: C.surface,
    borderRadius: R.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: C.borderVariant,
  },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.borderVariant },
  itemText: { color: C.text, fontSize: 16 },
  itemTextActive: { color: C.primary, fontFamily: Fonts.spaceGrotesk.bold },
});
