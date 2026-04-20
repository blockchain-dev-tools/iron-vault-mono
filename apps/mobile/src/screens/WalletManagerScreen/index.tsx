import React, { useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useApp, useTheme, useLocale } from '../../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import type { Chain } from '@iron-vault/wallet';
import BottomSheet from '../../components/ui/BottomSheet';
import Button from '../../components/ui/Button';
import BleStatus from '../../components/ui/BleStatus';
import ChainIcon from '../../components/ui/ChainIcon';
import LogViewer from '../../components/ui/LogViewer';
import { useBleSession } from '../../hooks/useBleSession';
import { Fonts } from '../../lib/fonts';
import ChainSection from './ChainSection';
import AddAccountSheet from './AddAccountSheet';

export default function WalletManagerScreen() {
  const { go, accounts, addAccount, setCurrentAccount, currentChain, currentAcctIdx, bleState } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [connectSheet, setConnectSheet] = useState<Chain | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [addSheet, setAddSheet] = useState<Chain | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  const sheetChain = connectSheet ?? currentChain;
  const acctList = accounts[sheetChain];
  const acct = acctList[currentAcctIdx] ?? acctList[0] ?? { short: '—', full: '—', path: '—' };

  const { logs, clearLogs, startBle, stopBle } = useBleSession(connectSheet, acct);

  const openDetail = () => {
    setShowDetail(true);
    Animated.timing(slideAnim, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  };

  const closeDetail = () => {
    Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => setShowDetail(false));
  };

  const openAccount = (chain: Chain, idx: number) => {
    setCurrentAccount(chain, idx);
    go('AccountDetail');
  };

  const openConnectSheet = async (chain: Chain) => {
    clearLogs();
    setShowDetail(false);
    slideAnim.setValue(0);
    setConnectSheet(chain);
    setCurrentAccount(chain, 0);
    if (bleState !== 'idle') return;
    try { await startBle(); } catch { /* ignore */ }
  };

  const closeConnectSheet = () => {
    if (bleState !== 'idle') stopBle();
    setConnectSheet(null);
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
  });

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View>
            <Text style={s.heroTitle}>{t.vault.mainWallet}</Text>
            <Text style={s.heroSub}>{t.vault.mainWalletSub}</Text>
          </View>
          <View style={s.badge}><Text style={s.badgeText}>{t.vault.hdBadge}</Text></View>
        </View>

        <ChainSection
          label={t.vault.ethLabel} sub={t.vault.ethSub}
          iconNode={<ChainIcon chain="eth" size={22} />}
          accounts={accounts.eth}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('eth')}
          onAccountClick={idx => openAccount('eth', idx)}
          onAddAccount={() => setAddSheet('eth')}
        />

        <ChainSection
          label={t.vault.solLabel} sub={t.vault.solSub}
          iconNode={<ChainIcon chain="sol" size={22} />}
          accounts={accounts.sol}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('sol')}
          onAccountClick={idx => openAccount('sol', idx)}
          onAddAccount={() => setAddSheet('sol')}
        />

        <ChainSection
          label={t.vault.btcLabel} sub={t.vault.btcSub}
          iconNode={<ChainIcon chain="btc" size={22} />}
          accounts={accounts.btc}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('btc')}
          onAccountClick={idx => openAccount('btc', idx)}
          onAddAccount={() => setAddSheet('btc')}
        />

        <ChainSection
          label={t.vault.tronLabel} sub={t.vault.tronSub}
          iconNode={<ChainIcon chain="tron" size={22} />}
          accounts={accounts.tron}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('tron')}
          onAccountClick={idx => openAccount('tron', idx)}
          onAddAccount={() => setAddSheet('tron')}
        />

        <ChainSection
          label={t.vault.suiLabel} sub={t.vault.suiSub}
          iconNode={<ChainIcon chain="sui" size={22} />}
          accounts={accounts.sui}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('sui')}
          onAccountClick={idx => openAccount('sui', idx)}
          onAddAccount={() => setAddSheet('sui')}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Connect sheet ── */}
      <BottomSheet
        visible={!!connectSheet}
        onClose={closeConnectSheet}
        onClosed={() => { setShowDetail(false); slideAnim.setValue(0); }}
      >
        <View style={s.slideClip}>
          <Animated.View style={[s.slideRow, { width: screenWidth * 2, transform: [{ translateX }] }]}>

            {/* Panel 1: Connect steps */}
            <View style={[s.panel, { width: screenWidth }]}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>{t.vault.connectWallet}</Text>
                <TouchableOpacity onPress={openDetail} style={s.actionBtn}>
                  <Text style={s.actionBtnText}>{t.common.detail}</Text>
                </TouchableOpacity>
              </View>
              <BleStatus state={bleState} variant="row" />
              {[
                t.vault.okxStep1,
                t.vault.okxStep2,
                t.vault.okxStep3({ eth: 'Ethereum', sol: 'Solana', btc: 'Bitcoin', tron: 'Tron', sui: 'Sui' }[connectSheet ?? 'eth']),
                t.vault.okxStep4,
              ].map((step, i) => (
                <View key={i} style={s.step}>
                  <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              ))}
              <View style={{ height: 16 }} />
              <Button variant="outline-danger" onPress={closeConnectSheet}>{t.vault.stopClose}</Button>
            </View>

            {/* Panel 2: BLE activity log */}
            <View style={[s.panel, { width: screenWidth }]}>
              <View style={s.sheetHeader}>
                <TouchableOpacity onPress={closeDetail} style={s.actionBtn}>
                  <Text style={s.actionBtnText}>{t.vault.backBtn}</Text>
                </TouchableOpacity>
                <Text style={s.sheetTitle}>{t.vault.activityLog}</Text>
                <TouchableOpacity onPress={clearLogs} style={s.actionBtn}>
                  <Text style={s.actionBtnTextDim}>{t.common.clear}</Text>
                </TouchableOpacity>
              </View>
              <BleStatus state={bleState} variant="row" />
              <LogViewer logs={logs} emptyText={t.vault.waitingBle} height={200} />
              <View style={{ height: 12 }} />
              <Button variant="outline-danger" onPress={closeConnectSheet}>{t.vault.stopClose}</Button>
            </View>

          </Animated.View>
        </View>
      </BottomSheet>

      {/* ── Add Account sheet ── */}
      <BottomSheet visible={!!addSheet} onClose={() => setAddSheet(null)}>
        {addSheet && (
          <AddAccountSheet
            chain={addSheet}
            accounts={accounts}
            onClose={() => setAddSheet(null)}
            onAdd={addAccount}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: C.text, fontSize: 28, fontFamily: Fonts.spaceGrotesk.bold },
  heroSub: { color: C.text2, fontSize: 13, marginTop: 4 },
  badge: { backgroundColor: C.primary15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.sm },
  badgeText: { color: C.primary, fontSize: 11, fontFamily: Fonts.spaceGrotesk.bold },
  slideClip: { overflow: 'hidden' },
  slideRow: { flexDirection: 'row' },
  panel: { padding: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: C.text, fontSize: 18, fontFamily: Fonts.spaceGrotesk.bold },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  actionBtnText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
  actionBtnTextDim: { color: C.text2, fontSize: 12 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: C.onPrimary, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold },
  stepText: { color: C.text2, fontSize: 13, flex: 1, lineHeight: 18 },
});
