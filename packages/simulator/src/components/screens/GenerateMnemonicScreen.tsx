'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { reencodeMnemonic } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import AlertBanner from '../ui/AlertBanner';

const LANGS: { id: Bip39Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'zh-Hans', label: '中' },
  { id: 'ja', label: '日' },
  { id: 'ko', label: '한' },
];

export default function GenerateMnemonicScreen() {
  const { go, goBack } = useNav();
  const { generatedWords, setGeneratedWords, mnemonicLang, setMnemonicLang, passphrase, setPassphrase } = useApp();
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleLangChange = (newLang: Bip39Language) => {
    if (newLang === mnemonicLang || generatedWords.length === 0) return;
    const sep = mnemonicLang === 'ja' ? '\u3000' : ' ';
    const reencoded = reencodeMnemonic(generatedWords.join(sep), mnemonicLang, newLang);
    setGeneratedWords(reencoded.split(/[\s\u3000]+/));
    setMnemonicLang(newLang);
  };

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Your Seed Phrase" onBack={goBack} />
      <div className="flex-1 px-6 pt-4 flex flex-col gap-4">
        <AlertBanner icon={<span className="material-symbols-outlined text-error flex-shrink-0">warning</span>}>
          <p className="text-xs text-on-surface-variant leading-relaxed font-body">
            <span className="font-bold text-on-surface">Write these 12 words on paper.</span>{' '}
            This is the only way to recover your wallet. Never screenshot or share.
          </p>
        </AlertBanner>

        <div className="flex gap-2">
          {LANGS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleLangChange(id)}
              className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
              style={{
                borderColor: mnemonicLang === id ? 'var(--c-primary)' : 'var(--c-outline-variant)',
                color: mnemonicLang === id ? 'var(--c-primary)' : 'var(--c-on-surface-variant)',
                background: mnemonicLang === id ? 'var(--c-primary-container)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {generatedWords.map((w, i) => (
            <div key={i} className="bg-surface-container rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="font-label text-[10px] text-on-surface-variant min-w-[18px] uppercase">{i + 1}</span>
              <span className="font-headline font-medium text-on-surface">{w}</span>
            </div>
          ))}
        </div>

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
        <Button variant="primary" icon="check" onClick={() => go('VerifyMnemonic')} disabled={generatedWords.length === 0}>
          I&apos;ve Written It Down
        </Button>
      </div>
    </div>
  );
}
