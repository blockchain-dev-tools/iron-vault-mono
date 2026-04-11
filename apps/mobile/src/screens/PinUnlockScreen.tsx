import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, Pattern, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { unlockWallet, clearWallet } from '@iron-vault/wallet';
import { walletStorage } from '../lib/storage';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import PinPad from '../components/ui/PinPad';
import PinDots from '../components/ui/PinDots';

const MAX_ATTEMPTS = 5;

function BgLines({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} opacity={0.025}>
      <Defs>
        <Pattern id="diag" x="0" y="0" width="57" height="57" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2="57" stroke={color} strokeWidth="1" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#diag)" />
    </Svg>
  );
}

function ShieldLogo({ primary }: { primary: string }) {
  return (
    <Svg width={62} height={70} viewBox="0 0 80 92" fill="none">
      <Path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V58Q52 62 48 62H32Q28 62 28 58V36Q28 32 32 32Z"
        fill={primary}
      />
      <Rect x="33" y="24" width="14" height="12" rx="7" stroke="white" strokeWidth="3" fill="none" />
      <Circle cx="40" cy="47" r="3" fill={primary} />
      <Rect x="39" y="49" width="2" height="6" rx="1" fill={primary} />
    </Svg>
  );
}

export default function PinUnlockScreen() {
  const { reset: navReset, setAccounts } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const locked = attempts >= MAX_ATTEMPTS;

  const handleComplete = async (entered: string, reset: () => void) => {
    if (locked) return;
    setLoading(true);
    try {
      const result = await unlockWallet(walletStorage, entered);
      if (result) {
        setAccounts(result);
        navReset('Vault');
      } else {
        setLoading(false);
        setAttempts(n => n + 1);
        setError(true);
        reset();
        setTimeout(() => setError(false), 900);
      }
    } catch (e: any) {
      console.error('[PinUnlock] error:', e?.message ?? String(e));
      setLoading(false);
      setAttempts(n => n + 1);
      setError(true);
      reset();
      setTimeout(() => setError(false), 900);
    }
  };

  const handleResetWallet = () => {
    Alert.alert(
      t.pinUnlock.resetTitle,
      t.pinUnlock.resetMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.pinUnlock.resetConfirm,
          style: 'destructive',
          onPress: async () => {
            await clearWallet(walletStorage);
            setAccounts({ eth: [], sol: [] });
            navReset('Welcome');
          },
        },
      ],
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <BgLines color={C.primary} />

      <View style={{ flex: 1 }} />

      <View style={s.center}>
        {/* Hero */}
        <View style={s.logoWrap}>
          <ShieldLogo primary={C.primary} />
        </View>
        <Text style={s.title}>{'IRON '}<Text style={s.titleAccent}>VAULT</Text></Text>

        <Text style={s.sub}>{locked ? t.pinUnlock.locked : t.pinUnlock.enterPin}</Text>

        {!locked && !loading && <PinPad onComplete={handleComplete} error={error} />}
        {loading && (
          <View style={s.loadingArea}>
            <PinDots length={6} />
            <View style={s.spinner}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={s.spinnerText}>{t.pinUnlock.unlocking}</Text>
            </View>
          </View>
        )}
        {attempts > 0 && !locked && !loading && (
          <Text style={s.warning}>{t.pinUnlock.attemptsLeft(MAX_ATTEMPTS - attempts)}</Text>
        )}
        {locked && (
          <TouchableOpacity style={s.resetBtnLarge} onPress={handleResetWallet} activeOpacity={0.7}>
            <Text style={s.resetBtnLargeText}>{t.common.reset}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }} />

      {!locked && (
        <TouchableOpacity style={s.resetLink} onPress={handleResetWallet} activeOpacity={0.6}>
          <Text style={s.resetLinkText}>{t.pinUnlock.forgotPin}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface, paddingHorizontal: 24 },
  center: { alignItems: 'center' },
  logoWrap: { marginBottom: 28 },
  title: {
    fontSize: 34, fontWeight: '900', letterSpacing: -2, textAlign: 'center',
    color: C.text, marginBottom: 20,
  },
  titleAccent: { color: C.primary },
  sub: { color: C.text2, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  loadingArea: { alignItems: 'center' },
  spinner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  spinnerText: { color: C.text2, fontSize: 13, letterSpacing: 0.5 },
  warning: { color: C.error, fontSize: 12, marginTop: 8 },
  resetBtnLarge: {
    marginTop: 32, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.error,
  },
  resetBtnLargeText: { color: C.error, fontSize: 15, fontWeight: '700' },
  resetLink: { alignItems: 'center', paddingVertical: 12 },
  resetLinkText: { color: C.textDisabled, fontSize: 12, textDecorationLine: 'underline' },
});