'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { unlockWallet, clearWallet } from '@iron-vault/wallet';
import PinPad from '../ui/PinPad';
import ShieldLogo from '../ui/ShieldLogo';

const MAX_ATTEMPTS = 5;

export default function PinUnlockScreen() {
  const { reset: navReset } = useNav();
  const { setAccounts, storage } = useApp();
  const [failCount, setFailCount] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const locked = failCount >= MAX_ATTEMPTS;

  const handleComplete = async (pin: string, resetPad: () => void) => {
    if (locked) return;
    setLoading(true);
    await new Promise<void>(r => setTimeout(r, 32));
    const result = await unlockWallet(storage, pin);
    if (result) {
      setAccounts(result);
      navReset('Vault');
    } else {
      setLoading(false);
      setError(true);
      setFailCount(c => c + 1);
      resetPad();
      setTimeout(() => setError(false), 700);
    }
  };

  const handleResetWallet = async () => {
    if (!confirm('Reset wallet? All data will be deleted.')) return;
    await clearWallet(storage);
    setAccounts({ eth: [], sol: [] });
    navReset('Welcome');
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-on-surface)', margin: 0 }}>
            IRON<br />
            <span style={{ color: 'var(--c-primary)' }}>VAULT</span>
          </h1>
        </div>
        <p style={{ color: 'var(--c-on-surface-variant)', fontSize: 15, maxWidth: 240, lineHeight: 1.6, marginTop: 24, textAlign: 'center' }}>
          {locked ? 'Too many attempts — wallet locked' : 'Enter your PIN to unlock'}
        </p>
      </div>

      {!locked && (
        <div className="z-10 mt-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : (
            <PinPad onComplete={handleComplete} error={error} />
          )}
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
