import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Card from '../../components/ui/Card';
import SectionLabel from '../../components/ui/SectionLabel';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import AlertBanner from '../../components/ui/AlertBanner';
import { Fonts } from '../../lib/fonts';

export default function TransactionScreen() {
  const { pendingTx, setPendingTx, goBack } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [done, setDone] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  // ALL useMemo BEFORE early returns
  const rows = useMemo((): [string, string, boolean][] => {
    if (!pendingTx) return [];
    return [
      [t.transaction.network, pendingTx.network ?? ({ eth: t.transaction.ethereum, sol: t.transaction.solana, btc: 'Bitcoin', tron: 'Tron', sui: 'Sui' }[pendingTx.chain] ?? pendingTx.chain), false],
      [t.transaction.action, pendingTx.type === 'erc20_transfer' ? t.transaction.erc20Transfer : t.transaction.transfer, false],
      [t.transaction.from, pendingTx.from, false],
      [t.transaction.to, pendingTx.to, false],
      [t.transaction.amount, pendingTx.amount, true],
      [t.transaction.gas, pendingTx.gas, false],
    ];
  }, [pendingTx, t]);

  // Early returns AFTER all hooks
  if (!pendingTx && !done) return null;

  if (done) {
    return (
      <View style={s.successRoot}>
        <Icon name="check_circle" size={72} color={C.primary} />
        <Text style={s.successTitle}>{t.transaction.successTitle}</Text>
        <Text style={s.successSub}>{t.transaction.successSub}</Text>
        <View style={{ height: 32 }} />
        <Button variant="primary" onPress={() => { setDone(false); goBack(); }}>{t.transaction.return}</Button>
      </View>
    );
  }

  const handleConfirm = () => {
    if (!pendingTx) return;
    try {
      const sig = pendingTx.sign();
      pendingTx.resolve(sig);
      setPendingTx(null);
      setDone(true);
    } catch {
      pendingTx.resolve('6f00');
      setPendingTx(null);
    }
  };

  const handleReject = () => {
    pendingTx?.reject();
    setPendingTx(null);
    goBack();
  };

  return (
    <View style={s.root}>
      <TopBar title={t.transaction.title} hideBack />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Origin */}
        <View style={s.originRow}>
          <View style={s.originIconWrap}>
            <Icon name="verified_user" size={28} color={C.primary} />
          </View>
          <View>
            <SectionLabel>{t.transaction.origin}</SectionLabel>
            <Text style={s.originName}>{t.transaction.originName}</Text>
          </View>
        </View>

        {/* Details */}
        <Card accent>
          {rows.map(([label, value, isAccent]) => (
            <View key={label} style={s.row}>
              <Text style={s.rowLabel}>{label}</Text>
              <Text style={[s.rowValue, isAccent && s.rowValueAccent]}>{value}</Text>
            </View>
          ))}
        </Card>

        {/* Raw hex toggle */}
        {!!pendingTx!.rawHex && (
          <View>
            <TouchableOpacity style={s.rawToggle} onPress={() => setRawOpen(r => !r)}>
              <Text style={s.rawLabel}>{t.transaction.rawHex}</Text>
              <Text style={s.rawChevron}>{rawOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {rawOpen && (
              <View style={s.rawBox}>
                <Text style={s.rawText}>{pendingTx!.rawHex}</Text>
              </View>
            )}
          </View>
        )}

        {/* Warning */}
        <AlertBanner icon={<Icon name="warning" size={18} color={C.error} />}>
          <Text style={s.warnText}>
            <Text style={{ color: C.error, fontFamily: Fonts.spaceGrotesk.bold }}>{t.transaction.warningTitle}</Text>
            {t.transaction.warningSub}
          </Text>
        </AlertBanner>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={s.actions}>
        <View style={s.actionRow}>
          <Button variant="secondary" style={s.rejectBtn} onPress={handleReject}>{t.transaction.reject}</Button>
          <Button variant="primary" icon="draw" style={s.confirmBtn} onPress={handleConfirm}>{t.transaction.confirmSign}</Button>
        </View>
        <View style={s.secureNote}>
          <Icon name="lock" size={10} color={C.textDisabled} />
          <Text style={s.secureNoteText}>{t.transaction.secure}</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  originRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  originIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary12, alignItems: 'center', justifyContent: 'center' },
  originName: { color: C.text, fontSize: 17, fontFamily: Fonts.spaceGrotesk.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderVariant },
  rowLabel: { color: C.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  rowValue: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.regular, maxWidth: '60%', textAlign: 'right' },
  rowValueAccent: { color: C.primary, fontSize: 16, fontFamily: Fonts.spaceGrotesk.bold },
  rawToggle: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.borderVariant },
  rawLabel: { color: C.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  rawChevron: { color: C.text2, fontSize: 12 },
  rawBox: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: C.borderVariant },
  rawText: { color: C.text2, fontSize: 10, fontFamily: 'monospace', lineHeight: 16 },
  warnText: { color: C.text2, fontSize: 13, lineHeight: 18, flex: 1 },
  actions: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  rejectBtn: { flex: 1 },
  confirmBtn: { flex: 2 },
  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secureNoteText: { color: C.textDisabled, fontSize: 9, letterSpacing: 2 },
  successRoot: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  successTitle: { color: C.text, fontSize: 32, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 8, marginTop: 16 },
  successSub: { color: C.text2, fontSize: 15, textAlign: 'center' },
});
