'use client';
import { useRef, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { setupWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import PinPad from '../ui/PinPad';

export default function SetPinScreen() {
  const { reset: navReset, goBack } = useNav();
  const { generatedWords, setAccounts, setGeneratedWords, storage, passphrase, mnemonicLang } = useApp();
  const isChangingPin = generatedWords.length === 0;
  const [phase, setPhase] = useState<1 | 2>(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const firstPin = useRef('');

  const label = error
    ? 'Mismatch — try again'
    : loading
    ? 'Setting up…'
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
        setLoading(true);
        await new Promise<void>(r => setTimeout(r, 32));
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
    <div className="flex flex-col h-full">
      <TopBar title={isChangingPin ? 'Change PIN' : 'Set PIN'} onBack={goBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p
          className="text-xs uppercase tracking-widest font-label mb-4 text-center"
          style={{ color: error ? 'var(--c-error)' : 'var(--c-on-surface-variant)', letterSpacing: '0.12em' }}
        >
          {label}
        </p>
        {loading ? (
          <div className="mt-8">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <PinPad onComplete={handleComplete} error={error} />
        )}
      </div>
    </div>
  );
}
