import React, { useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../../components/ui/TopBar';
import BleStatus from '../../components/ui/BleStatus';
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
  const isEth = currentChain === 'eth';
  const accts = isEth ? accounts.eth : accounts.sol;
  const acct = accts[currentAcctIdx] ?? { short: '—', full: '—', path: '—', custom: false };
  const canDelete = accts.length > 1;

  const { logs, startBle, stopBle } = useBleSession(currentChain, acct);

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
  const btnIcon = bleState === 'idle' || bleState === 'error' ? 'input' : 'stop_circle';
  const btnLabel =
    bleState === 'error' ? t.accountDetail.retryBle :
    bleState === 'idle'  ? t.accountDetail.startAccepting :
                           t.accountDetail.stop;

  return (
    <View style={s.root}>
      <TopBar
        title={`${isEth ? 'Ethereum' : 'Solana'} #${currentAcctIdx + 1}`}
        onBack={goBack}
        right={<>
          {bleState !== 'idle' && (
            <View style={s.bleBadge}>
              <Icon name="sensors" size={14} color={C.primary} />
              <Text style={s.bleText}>
                {bleState === 'connected' ? 'BLE Active' : 'BLE Scan'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleRemoveAccount}
            disabled={!canDelete}
            style={s.deleteBtn}
            activeOpacity={0.7}>
            <Icon name="delete-outline" size={20} color={canDelete ? C.error : C.textDisabled} />
          </TouchableOpacity>
        </>}
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

        <BleStatus state={bleState} />

        {logs.length > 0 && (
          <View>
            <SectionLabel>{t.accountDetail.activity}</SectionLabel>
            <LogViewer logs={logs} maxHeight={140} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={s.btnWrap}>
        <Button variant={btnVariant} icon={btnIcon} onPress={toggleBle}>
          {btnLabel}
        </Button>
        {bleState === 'idle' && (
          <Text style={s.hint}>{t.accountDetail.hint}</Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  addrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  copyIconWrap: { padding: 8, backgroundColor: C.surfaceContainerLow, borderRadius: R.lg },
  addrBox: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: C.borderVariant },
  addrText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.regular, lineHeight: 20 },
  qrWrap: { alignItems: 'center', paddingVertical: 20 },
  qrInner: { padding: 12, borderRadius: R.lg },
  addrPath: { color: C.text2, fontSize: 10, fontFamily: Fonts.spaceGrotesk.regular, marginTop: 4 },
  hint: { color: C.text2, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 10 },
  btnWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  deleteBtn: { padding: 8 },
  bleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: C.surfaceContainerLow, borderRadius: R.lg,
  },
  bleText: { color: C.text2, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: Fonts.spaceGrotesk.regular },
});
