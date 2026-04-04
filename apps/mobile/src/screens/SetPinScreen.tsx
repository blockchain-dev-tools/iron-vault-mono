import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { setupWallet } from '@iron-vault/wallet';
import { walletStorage } from '../lib/storage';
import { useApp, useTheme, useLocale } from '../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import TopBar from '../components/ui/TopBar';
import PinPad from '../components/ui/PinPad';

export default function SetPinScreen() {
  const { reset: navReset, goBack, generatedWords, passphrase, setAccounts, setGeneratedWords, setPassphrase } = useApp();
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const firstPin = useRef('');

  const isChangingPin = generatedWords.length === 0;

  const label = error
    ? t.setPin.mismatch
    : phase === 1
    ? t.setPin.labelSet
    : t.setPin.labelConfirm;

  const handleComplete = async (pin: string, reset: () => void) => {
    if (phase === 1) {
      firstPin.current = pin;
      setPhase(2);
      setError(false);
      reset();
    } else {
      if (pin === firstPin.current) {
        setLoading(true);
        await new Promise<void>(resolve => setTimeout(resolve, 32));
        try {
          const mnemonic = isChangingPin
            ? (await walletStorage.getItem('wallet.mnemonic')) ?? ''
            : generatedWords.join(' ');
          const accts = await setupWallet(walletStorage, mnemonic, pin, passphrase);
          setAccounts(accts);
          if (isChangingPin) {
            goBack();
          } else {
            setGeneratedWords([]);
            setPassphrase('');
            navReset('Vault');
          }
        } catch (e: any) {
          console.error('[SetPin] setupWallet error:', e?.message ?? String(e));
          setLoading(false);
        }
      } else {
        setError(true);
        reset();
        setTimeout(() => {
          setPhase(1);
          firstPin.current = '';
          setError(false);
        }, 900);
      }
    }
  };

  return (
    <View style={s.root}>
      <TopBar title={isChangingPin ? t.setPin.titleChange : t.setPin.titleSet} onBack={goBack} />
      <View style={s.body}>
        <Text style={[s.label, error && s.labelError]}>
          {loading ? t.setPin.settingUp : label}
        </Text>
        {loading
          ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 32 }} />
          : <PinPad onComplete={handleComplete} error={error} />}
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  label: { color: C.text2, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  labelError: { color: C.error },
});
