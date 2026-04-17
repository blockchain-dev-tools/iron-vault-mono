'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { validateMnemonic } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

export default function ImportMnemonicScreen() {
  const { go, goBack } = useNav();
  const { setGeneratedWords, setMnemonicLang, passphrase, setPassphrase } = useApp();
  const [val, setVal] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const words = val.trim().split(/\s+/).filter(Boolean);
  const valid = words.length === 12 && validateMnemonic(val);
  const msg = !val ? '' : valid ? '✓ Valid seed phrase' : words.length < 12 ? `${words.length} / 12 words` : words.length > 12 ? 'Too many words' : 'Invalid phrase';

  const confirm = () => {
    if (!valid) return;
    setGeneratedWords(val.trim().split(/\s+/));
    setMnemonicLang('en');
    go('SetPin');
  };

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Import Wallet" onBack={goBack} />
      <div className="flex-1 px-6 pt-6 flex flex-col gap-4">
        <p className="text-on-surface-variant text-sm font-body">Enter your 12-word BIP-39 seed phrase, separated by spaces.</p>

        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="abandon cherry dial eagle fabric galaxy habit ivory jazz kayak labor magic"
          className="w-full min-h-[120px] p-4 bg-surface-container border border-outline focus:border-primary rounded-xl text-on-surface text-sm font-mono leading-relaxed resize-none outline-none transition-colors"
        />

        {val && (
          <p className={`text-xs font-label uppercase tracking-widest ${valid ? 'text-primary' : 'text-error'}`}>{msg}</p>
        )}

        <div>
          <button
            onClick={() => setShowPassphrase(v => !v)}
            className="flex items-center gap-1 text-xs font-label uppercase tracking-widest"
            style={{ color: 'var(--c-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-sm">{showPassphrase ? 'expand_less' : 'expand_more'}</span>
            Optional Passphrase (25th word)
          </button>
          {showPassphrase && (
            <input
              type="text"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder="Enter passphrase (optional)"
              className="mt-2 w-full p-3 rounded-xl border text-sm font-mono outline-none transition-colors"
              style={{ background: 'var(--c-surface-container)', borderColor: 'var(--c-outline)', color: 'var(--c-on-surface)' }}
            />
          )}
        </div>

        <div className="flex-1" />
        <Button variant="primary" disabled={!valid} icon="check" onClick={confirm}>
          Confirm Import
        </Button>
        <p className="text-xs text-center text-on-surface-variant font-body">You&apos;ll set a PIN on the next screen</p>
      </div>
    </div>
  );
}
