import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { unlockWallet, clearWallet } from '@iron-vault/wallet';
import { walletStorage } from '../lib/storage';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import PinPad from '../components/ui/PinPad';
import PinDots from '../components/ui/PinDots';
import BgLines from '../components/ui/BgLines';
import IronVaultHero from '../components/ui/IronVaultHero';

const MAX_ATTEMPTS = 5;

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
        <IronVaultHero />

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
