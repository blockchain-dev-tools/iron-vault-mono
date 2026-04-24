import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { unlockWallet, clearWallet, getPinAttempts, incrementPinAttempts, resetPinAttempts } from '@iron-vault/wallet';
import { walletStorage } from '../../lib/storage';
import { useApp, useTheme, useLocale, EMPTY_ACCOUNTS } from '../../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import PinPad from '../../components/ui/PinPad';
import PinDots from '../../components/ui/PinDots';
import PinLoadingSpinner from '../../components/ui/PinLoadingSpinner';
import BgLines from '../../components/ui/BgLines';
import IronVaultHero from '../../components/ui/IronVaultHero';
import { Fonts } from '../../lib/fonts';

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

  // Load persisted attempt count on mount so it survives app restarts
  useEffect(() => {
    getPinAttempts(walletStorage).then(n => setAttempts(n));
  }, []);

  // Animated values for cross-fade between PinPad and loading dots
  const padOpacity = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(padOpacity, { toValue: loading ? 0 : 1, duration: 200, useNativeDriver: true }),
      Animated.timing(dotOpacity, { toValue: loading ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [loading, padOpacity, dotOpacity]);

  const handleComplete = useCallback(async (entered: string, reset: () => void) => {
    if (locked) return;
    setLoading(true);
    // Yield 2 frames so React can re-render + start animations before PBKDF2 blocks the JS thread
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      const result = await unlockWallet(walletStorage, entered);
      if (result) {
        await resetPinAttempts(walletStorage);
        setAccounts(result);
        navReset('Vault');
      } else {
        const n = await incrementPinAttempts(walletStorage);
        setLoading(false);
        setAttempts(n);
        setError(true);
        reset();
        setTimeout(() => setError(false), 900);
      }
    } catch (e: any) {
      const n = await incrementPinAttempts(walletStorage);
      setLoading(false);
      setAttempts(n);
      setError(true);
      reset();
      setTimeout(() => setError(false), 900);
    }
  }, [locked, setAccounts, navReset]);

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
            setAccounts(EMPTY_ACCOUNTS);
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

        <Text style={s.sub}>
          {locked ? t.pinUnlock.locked : loading ? t.pinUnlock.verifying : t.pinUnlock.enterPin}
        </Text>

        {!locked && (
          <View style={s.pinArea}>
            {/* Loading dots — fades in, absolutely overlays PinPad */}
            <Animated.View
              style={[s.loadingOverlay, { opacity: dotOpacity }]}
              pointerEvents="none">
              <PinLoadingSpinner color={C.primary} />
            </Animated.View>

            {/* PinPad — fades out when loading */}
            <Animated.View style={{ opacity: padOpacity }}>
              <PinPad onComplete={handleComplete} error={error} />
            </Animated.View>
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
  pinArea: { alignItems: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  warning: { color: C.error, fontSize: 12, marginTop: 8 },
  resetBtnLarge: {
    marginTop: 32, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.error,
  },
  resetBtnLargeText: { color: C.error, fontSize: 15, fontFamily: Fonts.spaceGrotesk.bold },
  resetLink: { alignItems: 'center', paddingVertical: 12 },
  resetLinkText: { color: C.textDisabled, fontSize: 12, textDecorationLine: 'underline' },
});
