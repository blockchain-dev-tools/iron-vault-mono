'use client';
import { useRef, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { setupWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import PinPad from '../ui/PinPad';
import SectionLabel from '../ui/SectionLabel';

export default function SetPinScreen() {
  const { reset: navReset, goBack } = useNav();
  const { generatedWords, setAccounts, setGeneratedWords, storage, passphrase, mnemonicLang } = useApp();
  const isChangingPin = generatedWords.length === 0;
  const [phase, setPhase] = useState<1 | 2>(1);
  const [error, setError] = useState(false);
  const firstPin = useRef('');

  const label = error
    ? 'Mismatch — try again'
    : phase === 1
    ? isChangingPin ? 'Enter new 6-digit PIN' : 'Set a 6-digit PIN'
    : 'Confirm your PIN';

  const handleComplete = async (pin: string, resetPad: () => void) => {
    if (phase === 1) {
      firstPin.current = pin;
      setPhase(2);
      setError(false);
      resetPad();
    } else {
      if (pin === firstPin.current) {
        const sep = mnemonicLang === 'ja' ? '\u3000' : ' ';
        const mnemonic = generatedWords.join(sep);
        const result = await setupWallet(storage, mnemonic, pin, passphrase || undefined);
        setAccounts(result);
        setGeneratedWords([]);
        navReset('Vault');
      } else {
        setError(true);
        resetPad();
        setTimeout(() => {
          setPhase(1);
          firstPin.current = '';
          setError(false);
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title={isChangingPin ? 'Change PIN' : 'Set PIN'} onBack={goBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <SectionLabel error={error}>{label}</SectionLabel>
        <PinPad onComplete={handleComplete} error={error} />
      </div>
    </div>
  );
}
