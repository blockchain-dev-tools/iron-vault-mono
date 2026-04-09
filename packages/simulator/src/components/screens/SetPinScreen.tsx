'use client';
import { useRef, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { setupWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import PinPad from '../ui/PinPad';
import SectionLabel from '../ui/SectionLabel';

export default function P04() {
  const { go } = useNav();
  const { generatedMnemonic, setAccounts, setGeneratedMnemonic, storage } = useApp();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [error, setError] = useState(false);
  const firstPin = useRef('');

  const label = error
    ? 'Mismatch — try again'
    : phase === 1
    ? 'Set a 6-digit PIN'
    : 'Confirm your PIN';

  const handleComplete = async (pin: string, reset: () => void) => {
    if (phase === 1) {
      firstPin.current = pin;
      setPhase(2);
      setError(false);
      reset();
    } else {
      if (pin === firstPin.current) {
        const mnemonic = (generatedMnemonic ?? []).join(' ');
        const result = await setupWallet(storage, mnemonic, pin);
        setAccounts(result);
        setGeneratedMnemonic(null);
        go('Vault');
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
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Set PIN" />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <SectionLabel error={error}>{label}</SectionLabel>
        <PinPad onComplete={handleComplete} error={error} />
      </div>
    </div>
  );
}
