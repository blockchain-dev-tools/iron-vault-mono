import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionLabel from '../../components/ui/SectionLabel';
import Icon from '../../components/ui/Icon';
import LogViewer from '../../components/ui/LogViewer';
import { useBleSession } from '../../hooks/useBleSession';
import { Fonts } from '../../lib/fonts';

export default function AccountDetailScreen() {
  const { goBack, accounts, currentChain, currentAcctIdx, bleState, removeAccount } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const accts = accounts[currentChain] ?? accounts.sol;
  const acct = accts[currentAcctIdx] ?? { short: '—', full: '—', path: '—', custom: false };
  const canDelete = accts.length > 1;

  const { logs, startBle, stopBle } = useBleSession(currentChain, acct);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (bleState === 'broadcasting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.8, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => { anim.stop(); pulse.setValue(1); };
    } else {
      pulse.setValue(1);
    }
  }, [bleState, pulse]);

  const handleRemoveAccount = () => {
    Alert.alert(
      t.vault.removeAccountTitle,
      t.vault.removeAccountMsg(acct.short),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.vault.removeAccountConfirm,
          style: 'destructive',
          onPress: () => {
            removeAccount(currentChain, acct.path);
            goBack();
          },
        },
      ],
    );
  };

  const toggleBle = async () => {
    if (bleState === 'broadcasting' || bleState === 'connected') {
      stopBle();
    } else {
      await startBle();
    }
  };

  const handleCopyAddress = async () => {
    await Share.share({ message: acct.full || acct.short });
  };

  const hasAddress = acct.full !== '—' && acct.full !== '';
  const btnVariant = bleState === 'idle' || bleState === 'error' ? 'primary' : 'danger';
  const btnIcon = bleState === 'idle' || bleState === 'error' ? 'bluetooth' : 'power_settings_new';
  const btnLabel =
    bleState === 'error' ? t.accountDetail.retryBle :
    bleState === 'idle'  ? t.accountDetail.startAccepting :
                           t.accountDetail.stop;

  return (
    <View style={s.root}>
      <TopBar
        title={`${{ eth: 'Ethereum', sol: 'Solana', btc: 'Bitcoin', tron: 'Tron', sui: 'Sui' }[currentChain]} #${currentAcctIdx + 1}`}
        onBack={goBack}
        right={
          <TouchableOpacity
            onPress={handleRemoveAccount}
            disabled={!canDelete}
            style={s.deleteBtn}
            activeOpacity={0.7}>
            <Icon name="delete-outline" size={20} color={canDelete ? C.error : C.textDisabled} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card accent>
          <View style={s.addrHeader}>
            <SectionLabel>{t.accountDetail.publicAddress}</SectionLabel>
            <TouchableOpacity style={s.copyIconWrap} onPress={handleCopyAddress} activeOpacity={0.7}>
              <Icon name="content_copy" size={16} color={C.primary} />
            </TouchableOpacity>
          </View>
          <View style={s.addrBox}>
            <Text style={s.addrText} selectable>{acct.full || acct.short}</Text>
          </View>
          {hasAddress && (
            <View style={s.qrWrap}>
              <View style={[s.qrInner, { backgroundColor: '#FFFFFF' }]}>
                <QRCode
                  value={acct.full || acct.short}
                  size={160}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
            </View>
          )}
          <Text style={s.addrPath}>{acct.path}</Text>
        </Card>

        <View>
          <SectionLabel>{t.accountDetail.activity}</SectionLabel>
          <LogViewer logs={logs} emptyText={t.accountDetail.noActivity} height={140} style={{ backgroundColor: C.primary12, borderWidth: 1, borderColor: C.primary25 }} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={s.btnWrap}>
        {bleState === 'error' && (
          <View style={s.errorTips}>
            <Text style={s.errorTipsTitle}>{t.accountDetail.troubleshootingTitle}</Text>
            {([
              t.accountDetail.troubleshootTip1,
              t.accountDetail.troubleshootTip2,
              t.accountDetail.troubleshootTip3,
              t.accountDetail.troubleshootTip4,
            ] as string[]).map((tip, i) => (
              <Text key={i} style={s.errorTipLine}>{tip}</Text>
            ))}
          </View>
        )}
        <Button variant={btnVariant} icon={btnIcon} onPress={toggleBle}>
          {btnLabel}
        </Button>
        {bleState === 'idle' && (
          <Text style={s.hint}>{t.accountDetail.hint}</Text>
        )}
        {(bleState === 'broadcasting' || bleState === 'connected') && (
          <View style={s.hintRow}>
            <View style={s.dotWrap}>
              {bleState === 'broadcasting' && (
                <Animated.View style={[s.dotPulse, { transform: [{ scale: pulse }] }]} />
              )}
              <View style={[s.dot, bleState === 'connected' && s.dotConnected]} />
            </View>
            <Text style={s.hint}>
              {bleState === 'broadcasting'
                ? t.accountDetail.broadcasting
                : t.accountDetail.connected}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 180, gap: 16 },
  addrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  copyIconWrap: { padding: 8, backgroundColor: C.surfaceContainerLow, borderRadius: R.lg },
  addrBox: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: C.borderVariant },
  addrText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.regular, lineHeight: 20 },
  qrWrap: { alignItems: 'center', paddingVertical: 20 },
  qrInner: { padding: 12, borderRadius: R.lg },
  addrPath: { color: C.text2, fontSize: 10, fontFamily: Fonts.spaceGrotesk.regular, marginTop: 4 },
  hint: { color: C.text2, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  dotConnected: { backgroundColor: '#4caf50' },
  dotPulse: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, opacity: 0.4 },
  btnWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, gap: 12,
    backgroundColor: C.bg + '80',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.borderVariant,
  },
  errorTips: {
    padding: 16, borderRadius: R.xl,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1, borderColor: C.borderVariant,
  },
  errorTipsTitle: { color: C.text, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 8, letterSpacing: 0.5 },
  errorTipLine: { color: C.text2, fontSize: 12, lineHeight: 20 },
  deleteBtn: { padding: 8 },
});
