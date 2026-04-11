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
import LogViewer from '../components/ui/LogViewer';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useBleSession } from '../hooks/useBleSession';
import type { BleState } from '../store/AppContext';
import { Fonts } from '../lib/fonts';

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
          iconNode={<EthIcon size={22} />}
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
          iconNode={<SolIcon size={22} />}
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

                  <LogViewer logs={logs} emptyText={t.vault.waitingBle} height={200} />
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
  title: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.bold },
  sub: { color: C.text2, fontSize: 12, marginTop: 2 },
});


function EthIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="ethGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#3B82F6" />
        </LinearGradient>
      </Defs>
      <Path d="M12 2L4.5 14L12 18V2Z" fill="url(#ethGrad)" />
      <Path d="M12 2L19.5 14L12 18V2Z" fill="url(#ethGrad)" opacity="0.6" />
      <Path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="url(#ethGrad)" />
      <Path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="url(#ethGrad)" opacity="0.6" />
    </Svg>
  );
}

function SolIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 101 88" fill="none">
      <Defs>
        <LinearGradient id="solGrad" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
          <Stop offset="0.08" stopColor="#9945FF" />
          <Stop offset="0.3" stopColor="#8752F3" />
          <Stop offset="0.5" stopColor="#5497D5" />
          <Stop offset="0.6" stopColor="#43B4CA" />
          <Stop offset="0.72" stopColor="#28E0B9" />
          <Stop offset="0.97" stopColor="#19FB9B" />
        </LinearGradient>
      </Defs>
      <Path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#solGrad)" />
    </Svg>
  );
}

function ChainSection({ label, sub, iconNode, accounts, connectLabel, accountLabel, addLabel, onConnect, onAccountClick, onAddAccount, onLongPressAccount }: {
  label: string; sub: string; iconNode: React.ReactNode;
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
            {iconNode}
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
  chainLabel: { color: C.text, fontSize: 20, fontFamily: Fonts.spaceGrotesk.bold },
  chainSub: { color: C.text2, fontSize: 12, fontFamily: 'monospace' },
  btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  connectBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectText: { color: C.onPrimary, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold, letterSpacing: 1 },
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
  addRowText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
});

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: C.text, fontSize: 28, fontFamily: Fonts.spaceGrotesk.bold },
  heroSub: { color: C.text2, fontSize: 13, marginTop: 4 },
  badge: { backgroundColor: C.primary15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.sm },
  badgeText: { color: C.primary, fontSize: 11, fontFamily: Fonts.spaceGrotesk.bold },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '80%' },
  slideClip: { overflow: 'hidden' },
  slideRow: { flexDirection: 'row' },
  panel: { padding: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: C.text, fontSize: 18, fontFamily: Fonts.spaceGrotesk.bold },
  detailBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  detailBtnText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
  backBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  backBtnText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.lg, backgroundColor: C.surfaceContainer },
  clearBtnText: { color: C.text2, fontSize: 12 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: C.onPrimary, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold },
  stepText: { color: C.text2, fontSize: 13, flex: 1, lineHeight: 18 },
  // Add account sheet
  advToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: R.lg, backgroundColor: C.surfaceContainer, marginBottom: 4 },
  advToggleText: { color: C.primary, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold },
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
