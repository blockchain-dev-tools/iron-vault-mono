'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { unlockWallet, clearWallet } from '@iron-vault/wallet';
import PinPad from '../ui/PinPad';

const MAX_ATTEMPTS = 5;

function ShieldLogo() {
  return (
    <svg width="88" height="100" viewBox="0 0 80 92" fill="none">
      <path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V58Q52 62 48 62H32Q28 62 28 58V36Q28 32 32 32Z M33 32Q33 24 40 24Q47 24 47 32Z M36 32Q36 27 40 27Q44 27 44 32Z"
        fill="var(--c-primary)"
      />
      <circle cx="40" cy="47" r="3" fill="var(--c-primary)" />
      <rect x="39" y="49" width="2" height="6" rx="1" fill="var(--c-primary)" />
    </svg>
  );
}

export default function PinUnlockScreen() {
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

  const handleResetWallet = async () => {
    if (!confirm('Reset wallet? All data will be deleted.')) return;
    await clearWallet(storage);
    setAccounts({ eth: [], sol: [] });
    go('Welcome');
  };

  return (
    <div
      className="flex flex-col min-h-full px-6 relative overflow-hidden"
      style={{ paddingTop: 56, paddingBottom: 24, background: 'var(--c-background)' }}
    >
      {/* Geometric background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, var(--c-primary) 40px, var(--c-primary) 41px)' }}
        />
      </div>

      <div className="flex-1" />

      {/* Hero */}
      <div className="flex flex-col items-center z-10">
        <div className="mb-10">
          <ShieldLogo />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-on-surface)', margin: 0 }}>
            IRON
          </h1>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-primary)', marginBottom: 20 }}>
            VAULT
          </h1>
        </div>
        <p style={{ color: 'var(--c-on-surface-variant)', fontSize: 15, maxWidth: 240, lineHeight: 1.6, marginTop: 20, textAlign: 'center' }}>
          {locked ? 'Too many attempts — wallet locked' : 'Enter your PIN to unlock'}
        </p>
      </div>

      {!locked && (
        <div className="z-10 mt-6">
          <PinPad onComplete={handleComplete} error={error} />
        </div>
      )}
      {failCount > 0 && !locked && (
        <p className="text-center z-10 mt-2" style={{ fontSize: 12, color: 'var(--c-error)' }}>
          {MAX_ATTEMPTS - failCount} attempt{MAX_ATTEMPTS - failCount !== 1 ? 's' : ''} remaining
        </p>
      )}
      {locked && (
        <div className="z-10 flex justify-center mt-8">
          <button
            onClick={handleResetWallet}
            className="px-10 py-3 rounded-xl border font-bold"
            style={{ borderColor: 'var(--c-error)', color: 'var(--c-error)', fontSize: 15 }}
          >
            Reset Wallet
          </button>
        </div>
      )}

      <div className="flex-1" />

      {!locked && (
        <button
          onClick={handleResetWallet}
          className="text-center pb-2 z-10"
          style={{ fontSize: 12, color: 'var(--c-on-surface-variant)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Forgot PIN? Reset wallet
        </button>
      )}
    </div>
  );
}
