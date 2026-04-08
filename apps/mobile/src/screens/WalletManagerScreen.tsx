import React, { useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Alert, Animated, Modal,
  ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
  ActivityIndicator,
} from 'react-native';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useBleSession } from '../hooks/useBleSession';
import type { BleState } from '../store/AppContext';

const PATH_RE = /^m(\/\d+'?)+$/;

export default function WalletManagerScreen() {
  const { go, accounts, addAccount, removeAccount, setCurrentAccount, currentChain, currentAcctIdx, bleState, setBleState } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [connectSheet, setConnectSheet] = useState<null | 'eth' | 'sol'>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [addSheet, setAddSheet] = useState<null | 'eth' | 'sol'>(null);
  const [inputPath, setInputPath] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  const ethAccts = accounts.eth;
  const solAccts = accounts.sol;

  const sheetChain = connectSheet ?? currentChain;
  const acctList = sheetChain === 'eth' ? accounts.eth : accounts.sol;
  const acct = acctList[currentAcctIdx] ?? acctList[0] ?? { short: '—', full: '—', path: '—' };

  const { logs, clearLogs, startBle, stopBle } = useBleSession(connectSheet, acct);

  const openDetail = () => {
    setShowDetail(true);
    Animated.timing(slideAnim, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  };

  const closeDetail = () => {
    Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => setShowDetail(false));
  };

  const openAccount = (chain: 'eth' | 'sol', idx: number) => {
    setCurrentAccount(chain, idx);
    go('AccountDetail');
  };

  const openConnectSheet = async (chain: 'eth' | 'sol') => {
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
    setShowDetail(false);
    slideAnim.setValue(0);
  };

  const handleRemoveAccount = (chain: 'eth' | 'sol', path: string) => {
    const list = chain === 'eth' ? accounts.eth : accounts.sol;
    if (list.length <= 1) return;
    Alert.alert(
      t.vault.removeAccountTitle,
      t.vault.removeAccountMsg(path),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.vault.removeAccountConfirm, style: 'destructive', onPress: () => removeAccount(chain, path) },
      ],
    );
  };

  const defaultPath = (chain: 'eth' | 'sol') =>
    chain === 'eth'
      ? `m/44'/60'/0'/0/${accounts.eth.length}`
      : `m/44'/501'/${accounts.sol.length}'/0'`;

  const openAddSheet = (chain: 'eth' | 'sol') => {
    setInputPath(defaultPath(chain));
    setShowAdvanced(false);
    setAddSheet(chain);
  };

  const closeAddSheet = () => setAddSheet(null);

  const pathValid = PATH_RE.test(inputPath);
  const canConfirm = !showAdvanced || pathValid;
  const effectivePath = showAdvanced ? inputPath : (addSheet ? defaultPath(addSheet) : '');

  const confirmAddAccount = async () => {
    if (!addSheet) return;
    setAdding(true);
    try {
      await addAccount(addSheet, effectivePath);
      closeAddSheet();
    } finally {
      setAdding(false);
    }
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
          icon="toll"
          accounts={ethAccts}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('eth')}
          onAccountClick={idx => openAccount('eth', idx)}
          onAddAccount={() => openAddSheet('eth')}
          onLongPressAccount={idx => handleRemoveAccount('eth', accounts.eth[idx]?.path)}
        />

        <ChainSection
          label={t.vault.solLabel} sub={t.vault.solSub}
          icon="flash_on"
          accounts={solAccts}
          connectLabel={t.vault.connect}
          accountLabel={t.vault.account}
          addLabel={t.vault.addAccount}
          onConnect={() => openConnectSheet('sol')}
          onAccountClick={idx => openAccount('sol', idx)}
          onAddAccount={() => openAddSheet('sol')}
          onLongPressAccount={idx => handleRemoveAccount('sol', accounts.sol[idx]?.path)}
        />

        <View style={{ height: 100 }} />
      </ScrollView>


      {/* ── Connect sheet ── */}
      <Modal visible={!!connectSheet} transparent animationType="slide" onRequestClose={closeConnectSheet}>
        <View style={s.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeConnectSheet} />

          <View style={s.sheet}>
            <View style={s.slideClip}>
              <Animated.View style={[s.slideRow, { width: screenWidth * 2, transform: [{ translateX }] }]}>

                {/* ── Panel 1: Connect steps ── */}
                <View style={[s.panel, { width: screenWidth }]}>
                  <View style={s.sheetHeader}>
                    <Text style={s.sheetTitle}>{t.vault.connectWallet}</Text>
                    <TouchableOpacity onPress={openDetail} style={s.detailBtn}>
                      <Text style={s.detailBtnText}>{t.common.detail}</Text>
                    </TouchableOpacity>
                  </View>

                  <BleStatusRow state={bleState} />

                  {[
                    t.vault.okxStep1,
                    t.vault.okxStep2,
                    t.vault.okxStep3(connectSheet === 'eth' ? 'Ethereum' : 'Solana'),
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

                {/* ── Panel 2: BLE activity log ── */}
                <View style={[s.panel, { width: screenWidth }]}>
                  <View style={s.sheetHeader}>
                    <TouchableOpacity onPress={closeDetail} style={s.backBtn}>
                      <Text style={s.backBtnText}>{t.vault.backBtn}</Text>
                    </TouchableOpacity>
                    <Text style={s.sheetTitle}>{t.vault.activityLog}</Text>
                    <TouchableOpacity onPress={clearLogs} style={s.clearBtn}>
                      <Text style={s.clearBtnText}>{t.common.clear}</Text>
                    </TouchableOpacity>
                  </View>

                  <BleStatusRow state={bleState} />

                  <View style={s.logBox}>
                    <ScrollView
                      ref={logScrollRef}
                      onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
                      style={{ flex: 1 }}
                      showsVerticalScrollIndicator={false}>
                      {logs.length === 0 ? (
                        <Text style={s.logEmpty}>{t.vault.waitingBle}</Text>
                      ) : (
                        logs.map((l, i) => (
                          <Text key={i} style={s.logLine}>
                            <Text style={s.logTime}>{l.time} </Text>{l.msg}
                          </Text>
                        ))
                      )}
                    </ScrollView>
                  </View>
                  <View style={{ height: 12 }} />
                  <Button variant="outline-danger" onPress={closeConnectSheet}>{t.vault.stopClose}</Button>
                </View>

              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Account sheet ── */}
      <Modal visible={!!addSheet} transparent animationType="slide" onRequestClose={closeAddSheet}>
        <View style={s.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAddSheet} />
          <View style={s.sheet}>
            <View style={s.panel}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>{t.vault.addAccount}</Text>
                <TouchableOpacity onPress={closeAddSheet} style={s.detailBtn}>
                  <Text style={s.detailBtnText}>{t.common.cancel}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setShowAdvanced(v => !v)} style={s.advToggle}>
                <Text style={s.advToggleText}>{showAdvanced ? t.vault.advancedHide : t.vault.advancedShow}</Text>
              </TouchableOpacity>
              {showAdvanced && (
                <>
                  <Text style={s.pathLabel}>{t.vault.addAccountPath}</Text>
                  <TextInput
                    style={[s.pathInput, !pathValid && inputPath.length > 0 && s.pathInputError]}
                    value={inputPath}
                    onChangeText={setInputPath}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    placeholder="m/44'/60'/0'/0/1"
                    placeholderTextColor={s.pathPlaceholder.color}
                  />
                  {!pathValid && inputPath.length > 0 && (
                    <Text style={s.pathError}>{t.vault.addAccountInvalidPath}</Text>
                  )}
                  <View style={{ height: 12 }} />
                </>
              )}

              <View style={{ height: 20 }} />
              <Button
                variant="primary"
                onPress={confirmAddAccount}
                disabled={!canConfirm || adding}>
                {adding ? t.vault.addAccountAdding : t.vault.addAccountConfirm}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BleStatusRow({ state }: { state: BleState }) {
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeBleStatusStyles(C), [C]);
  const isConnected = state === 'connected';
  const isBroadcasting = state === 'broadcasting';
  const title = isConnected ? t.vault.bleConnected : isBroadcasting ? t.vault.bleBroadcasting : t.vault.bleStarting;
  const sub = isConnected ? t.vault.bleConnectedSub : isBroadcasting ? t.vault.bleBroadcastingSub : t.vault.bleStartingSub;
  return (
    <View style={s.row}>
      {state === 'idle'
        ? <ActivityIndicator size="small" color={C.primary} />
        : <View style={[s.dot, isConnected && s.dotConnected]} />}
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const makeBleStatusStyles = (C: ColorTokens) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.primary8, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.primary25, marginBottom: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary, flexShrink: 0 },
  dotConnected: { backgroundColor: '#4caf50' },
  title: { color: C.text, fontSize: 14, fontWeight: '700' },
  sub: { color: C.text2, fontSize: 12, marginTop: 2 },
});

function ChainSection({ label, sub, icon, accounts, connectLabel, accountLabel, addLabel, onConnect, onAccountClick, onAddAccount, onLongPressAccount }: {
  label: string; sub: string; icon: string;
  accounts: { short: string; full: string; path: string }[];
  connectLabel: string;
  accountLabel: (n: number) => string;
  addLabel: string;
  onConnect: () => void;
  onAccountClick: (idx: number) => void;
  onAddAccount: () => void;
  onLongPressAccount: (idx: number) => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeChainStyles(C), [C]);
  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={s.chainLeft}>
          <View style={s.chainIconWrap}>
            <Icon name={icon} size={22} color={C.text} />
          </View>
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
      {accounts.map((a, i) => (
        <TouchableOpacity key={i} style={s.acctCard} onPress={() => onAccountClick(i)} onLongPress={() => onLongPressAccount(i)} activeOpacity={0.8}>
          <View style={s.acctLeft}>
            <Text style={s.acctNum}>{accountLabel(i + 1)}</Text>
            <Text style={s.acctAddr}>{a.short}</Text>
          </View>
          <Text style={s.acctPath}>{a.path}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.addRow} onPress={onAddAccount} activeOpacity={0.7}>
        <Text style={s.addRowText}>+ {addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeChainStyles = (C: ColorTokens) => StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chainLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chainIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  chainLabel: { color: C.text, fontSize: 20, fontWeight: '800' },
  chainSub: { color: C.text2, fontSize: 12, fontFamily: 'monospace' },
  btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  connectBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectText: { color: C.onPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  acctCard: {
    backgroundColor: C.surfaceContainer, borderRadius: 0, padding: 16,
    borderLeftWidth: 3, borderLeftColor: C.primary,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  acctLeft: { gap: 4 },
  acctNum: { color: C.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  acctAddr: { color: C.text, fontSize: 14, fontFamily: 'monospace', fontWeight: '600' },
  acctPath: { color: C.text2, fontSize: 10, fontFamily: 'monospace' },
  addRow: { paddingVertical: 14, alignItems: 'center', borderRadius: R.xl, borderWidth: 1.5, borderColor: C.primary, borderStyle: 'dashed' },
  addRowText: { color: C.primary, fontSize: 13, fontWeight: '700' },
});

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: C.text, fontSize: 28, fontWeight: '800' },
  heroSub: { color: C.text2, fontSize: 13, marginTop: 4 },
  badge: { backgroundColor: C.primary15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.sm },
  badgeText: { color: C.primary, fontSize: 11, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '80%' },
  slideClip: { overflow: 'hidden' },
  slideRow: { flexDirection: 'row' },
  panel: { padding: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  detailBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  detailBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  backBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  clearBtnText: { color: C.text2, fontSize: 12 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: C.onPrimary, fontSize: 12, fontWeight: '800' },
  stepText: { color: C.text2, fontSize: 13, flex: 1, lineHeight: 18 },
  logBox: { backgroundColor: C.surfaceContainer, borderRadius: R.lg, padding: 12, height: 200 },
  logLine: { color: C.text2, fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  logTime: { color: C.textDisabled },
  logEmpty: { color: C.textDisabled, fontSize: 12, textAlign: 'center', marginTop: 16 },
  // Add account sheet
  advToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: R.lg, backgroundColor: C.surfaceContainer, marginBottom: 4 },
  advToggleText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  pathLabel: { color: C.text2, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  pathInput: {
    backgroundColor: C.surfaceContainer, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.borderVariant,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 14, fontFamily: 'monospace',
  },
  pathInputError: { borderColor: C.error },
  pathError: { color: C.error, fontSize: 12, marginTop: 6 },
  pathPlaceholder: { color: C.textDisabled },
});
