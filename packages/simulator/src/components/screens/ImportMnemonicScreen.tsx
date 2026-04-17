'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { validateMnemonicWithWordlist } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import LangPicker from '../ui/LangPicker';
import PassphraseBox from '../ui/PassphraseBox';

export default function ImportMnemonicScreen() {
  const { go, goBack } = useNav();
  const { setGeneratedWords, setMnemonicLang, passphrase, setPassphrase } = useApp();
  const [val, setVal] = useState('');
  const [selectedLang, setSelectedLang] = useState<Bip39Language>('en');

  const sep = selectedLang === 'ja' ? /[\s\u3000]+/ : /\s+/;
  const words = val.trim().split(sep).filter(Boolean);
  const valid = words.length === 12 && validateMnemonicWithWordlist(val.trim(), selectedLang);
  const msg = !val ? '' : valid ? '✓ Valid seed phrase' : words.length < 12 ? `${words.length} / 12 words` : words.length > 12 ? 'Too many words' : 'Invalid phrase';

  const handleLangChange = (lang: Bip39Language) => {
    setSelectedLang(lang);
    setVal('');
  };

  const confirm = () => {
    if (!valid) return;
    setGeneratedWords(val.trim().split(sep));
    setMnemonicLang(selectedLang);
    go('SetPin');
  };

  return (
    <div className="relative flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Import Wallet" onBack={goBack} />
      <div className="flex-1 px-6 pt-6 flex flex-col gap-4">
        <p className="text-sm font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
          Enter your 12-word BIP-39 seed phrase, separated by spaces.
        </p>

        <LangPicker value={selectedLang} onChange={handleLangChange} />

        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="abandon cherry dial eagle fabric galaxy habit ivory jazz kayak labor magic"
          className="w-full min-h-[120px] p-4 rounded-xl text-sm font-mono leading-relaxed resize-none outline-none transition-colors"
          style={{
            background: 'var(--c-surface-container)',
            border: '1px solid var(--c-outline)',
            color: 'var(--c-on-surface)',
          }}
        />

        {val && (
          <p
            className="text-xs font-label uppercase tracking-widest"
            style={{ color: valid ? 'var(--c-primary)' : 'var(--c-error)' }}
          >
            {msg}
          </p>
        )}

        <PassphraseBox value={passphrase} onChange={setPassphrase} />

        <div className="flex-1" />
        <Button variant="primary" disabled={!valid} icon="arrow_forward" onClick={confirm}>
          Confirm Import
        </Button>
        <p className="text-xs text-center font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
          You&apos;ll set a PIN on the next screen
        </p>
      </div>
    </div>
  );
}
