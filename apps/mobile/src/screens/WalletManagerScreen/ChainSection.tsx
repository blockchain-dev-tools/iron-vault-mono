import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme, useLocale } from '../../store/AppContext';
import Icon from '../../components/ui/Icon';
import { Fonts } from '../../lib/fonts';

export default function ChainSection({ label, sub, iconNode, accounts, connectLabel, accountLabel, addLabel, onConnect, onAccountClick, onAddAccount }: {
  label: string; sub: string; iconNode: React.ReactNode;
  accounts: { short: string; full: string; path: string; custom: boolean }[];
  connectLabel: string;
  accountLabel: (n: number) => string;
  addLabel: string;
  onConnect: () => void;
  onAccountClick: (idx: number) => void;
  onAddAccount: () => void;
}) {
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const MAX_VISIBLE = 3;
  const [collapsed, setCollapsed] = useState(true);
  const visible = collapsed ? accounts.slice(0, MAX_VISIBLE) : accounts;
  const hiddenCount = accounts.length - MAX_VISIBLE;
  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={s.chainLeft}>
          <View style={s.chainIconWrap}>{iconNode}</View>
          <View>
            <Text style={s.chainLabel}>{label}</Text>
            <Text style={s.chainSub}>{sub}</Text>
          </View>
        </View>
        <View style={s.btnRow}>
          <TouchableOpacity style={s.connectBtn} onPress={onConnect} activeOpacity={0.8}>
            <Icon name="link" size={14} color={C.onPrimary} />
            <Text style={s.connectText}>{connectLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {visible.map((a, i) => (
        <TouchableOpacity key={i} style={s.acctCard} onPress={() => onAccountClick(i)} activeOpacity={0.8}>
          <View style={s.acctMeta}>
            <Text style={s.acctNum}>{accountLabel(i + 1)}</Text>
            <View style={s.acctPathRow}>
              {a.custom && <View style={s.customBadge}><Text style={s.customBadgeText}>{t.vault.pathCustom}</Text></View>}
              <Text style={s.acctPath}>{a.path}</Text>
            </View>
          </View>
          <Text style={s.acctAddr} numberOfLines={1} ellipsizeMode="middle">{a.full}</Text>
        </TouchableOpacity>
      ))}
      {accounts.length > MAX_VISIBLE && (
        <TouchableOpacity style={s.toggleRow} onPress={() => setCollapsed(c => !c)} activeOpacity={0.7}>
          <Icon name={collapsed ? 'expand-more' : 'expand-less'} size={16} color={C.text2} />
          <Text style={s.toggleText}>
            {collapsed ? t.vault.showMoreAccounts(hiddenCount) : t.vault.collapseAccounts}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={s.addRow} onPress={onAddAccount} activeOpacity={0.7}>
        <Text style={s.addRowText}>+ {addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chainLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chainIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  chainLabel: { color: C.text, fontSize: 20, fontFamily: Fonts.spaceGrotesk.bold },
  chainSub: { color: C.text2, fontSize: 12, fontFamily: 'monospace' },
  btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  connectBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectText: { color: C.onPrimary, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold, letterSpacing: 1 },
  acctCard: {
    backgroundColor: C.surfaceContainer,
    borderTopRightRadius: R.md, borderBottomRightRadius: R.md,
    padding: 16,
    borderLeftWidth: 3, borderLeftColor: C.primary,
    flexDirection: 'column', gap: 6,
  },
  acctMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  acctPathRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acctNum: { color: C.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  acctAddr: { color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: '600' },
  acctPath: { color: C.text2, fontSize: 10, fontFamily: 'monospace' },
  customBadge: { backgroundColor: C.primary15, paddingHorizontal: 5, paddingVertical: 1, borderRadius: R.sm },
  customBadgeText: { color: C.primary, fontSize: 9, fontFamily: Fonts.spaceGrotesk.bold, letterSpacing: 0.5 },
  toggleRow: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  toggleText: { color: C.text2, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold },
  addRow: { paddingVertical: 14, alignItems: 'center', borderRadius: R.xl, borderWidth: 1.5, borderColor: C.primary },
  addRowText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
});
