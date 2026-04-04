'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { unlockWallet } from '@iron-vault/wallet';
import PinPad from '../ui/PinPad';

const MAX_ATTEMPTS = 5;

export default function P09() {
  const { go } = useNav();
  const { setAccounts, storage } = useApp();
  const [failCount, setFailCount] = useState(0);
  const [error, setError] = useState(false);
  const locked = failCount >= MAX_ATTEMPTS;

  const handleComplete = async (pin: string, reset: () => void) => {
    if (locked) return;
    const result = await unlockWallet(storage, pin);
    if (result) {
      setAccounts(result);
      go('Vault');
    } else {
      setError(true);
      setFailCount(c => c + 1);
      reset();
      setTimeout(() => setError(false), 700);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 blur-[120px] rounded-full" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <span className="material-symbols-outlined text-primary mb-4 filled" style={{ fontVariationSettings: "'FILL' 1", fontSize: '80px' }}>lock</span>
        <h1 className="font-headline font-bold text-3xl tracking-tighter mb-1">OldPhone Wallet</h1>
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
          {locked ? 'Too many attempts — locked' : 'Enter PIN to unlock'}
        </p>
        {failCount > 0 && !locked && (
          <p className="text-xs text-error font-label mb-2">{MAX_ATTEMPTS - failCount} attempt{MAX_ATTEMPTS - failCount !== 1 ? 's' : ''} remaining</p>
        )}
        {!locked && (
          <PinPad onComplete={handleComplete} error={error} />
        )}
        {locked && (
          <div className="mt-6 bg-error/10 border border-error/30 rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-error text-3xl block mb-2">lock_clock</span>
            <p className="text-sm text-error font-label">Wallet locked</p>
            <p className="text-xs text-on-surface-variant font-body mt-1">Restart the app to try again</p>
          </div>
        )}
      </div>
      <p className="text-center text-[10px] text-on-surface-variant font-label uppercase tracking-widest pb-8">5 wrong attempts = lockout</p>
    </div>
  );
}
