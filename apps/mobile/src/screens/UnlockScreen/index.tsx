import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { unlockWallet, verifyPin, clearWallet, getPinAttempts, incrementPinAttempts, resetPinAttempts } from '@iron-vault/wallet';
import { walletStorage } from '../../lib/storage';
import { useApp, useTheme, useLocale, EMPTY_ACCOUNTS } from '../../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import PinPad from '../../components/ui/PinPad';
import PinLoadingSpinner from '../../components/ui/PinLoadingSpinner';
import BgLines from '../../components/ui/BgLines';
import IronVaultHero from '../../components/ui/IronVaultHero';
import { Fonts } from '../../lib/fonts';
import { R } from '@iron-vault/theme';

const MAX_ATTEMPTS = 5;

export default function UnlockScreen() {
  const { reset: navReset, setAccounts, setPassphrase, storePassphraseEnabled } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'pin' | 'passphrase'>('pin');
  const [passphraseInput, setPassphraseInput] = useState('');
  const verifiedPin = useRef('');
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

  const finishUnlock = useCallback(async (pin: string, passphrase: string) => {
    setLoading(true);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      const result = await unlockWallet(walletStorage, pin, passphrase || undefined);
      if (result) {
        await resetPinAttempts(walletStorage);
        setAccounts(result);
        setPassphrase(passphrase);
        navReset('Vault');
      } else {
        const n = await incrementPinAttempts(walletStorage);
        setLoading(false);
        setAttempts(n);
        setError(true);
        setPhase('pin');
        setPassphraseInput('');
        setTimeout(() => setError(false), 900);
      }
    } catch {
      const n = await incrementPinAttempts(walletStorage);
      setLoading(false);
      setAttempts(n);
      setError(true);
      setPhase('pin');
      setPassphraseInput('');
      setTimeout(() => setError(false), 900);
    }
  }, [setAccounts, setPassphrase, navReset]);

  const handleComplete = useCallback(async (entered: string, reset: () => void) => {
    if (locked) return;
    verifiedPin.current = entered;

    if (!storePassphraseEnabled) {
      // Verify PIN first without deriving accounts, then ask for passphrase
      setLoading(true);
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const valid = await verifyPin(walletStorage, entered);
      setLoading(false);
      if (valid) {
        await resetPinAttempts(walletStorage);
        setPhase('passphrase');
      } else {
        const n = await incrementPinAttempts(walletStorage);
        setAttempts(n);
        setError(true);
        reset();
        setTimeout(() => setError(false), 900);
      }
    } else {
      await finishUnlock(entered, '');
      reset();
    }
  }, [locked, storePassphraseEnabled, finishUnlock]);

  const handlePassphraseConfirm = useCallback(() => {
    finishUnlock(verifiedPin.current, passphraseInput);
  }, [passphraseInput, finishUnlock]);

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
          {locked
            ? t.pinUnlock.locked
            : loading
            ? t.pinUnlock.verifying
            : phase === 'passphrase'
            ? t.pinUnlock.passphraseTitle
            : t.pinUnlock.enterPin}
        </Text>

        {phase === 'passphrase' && !locked && !loading && (
          <View style={s.passphraseArea}>
            <Text style={s.passphraseSub}>{t.pinUnlock.passphraseSubtitle}</Text>
            <TextInput
              style={s.passphraseInput}
              value={passphraseInput}
              onChangeText={setPassphraseInput}
              placeholder={t.pinUnlock.passphrasePlaceholder}
              placeholderTextColor={C.textDisabled}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.confirmBtn} onPress={handlePassphraseConfirm} activeOpacity={0.7}>
              <Text style={s.confirmBtnText}>{t.pinUnlock.passphraseConfirm}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'pin' && !locked && (
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

        {attempts > 0 && !locked && !loading && phase === 'pin' && (
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
  passphraseArea: { width: '100%', marginTop: 8, gap: 12 },
  passphraseSub: { color: C.text2, fontSize: 13, textAlign: 'center' },
  passphraseInput: {
    backgroundColor: C.surfaceContainer,
    borderRadius: R.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  confirmBtn: {
    backgroundColor: C.primary,
    borderRadius: R.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.spaceGrotesk.bold },
});
