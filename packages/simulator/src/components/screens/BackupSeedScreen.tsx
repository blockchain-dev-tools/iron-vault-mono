'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { revealMnemonic, reencodeMnemonic, validateMnemonicWithWordlist } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import PinPad from '../ui/PinPad';
import AlertBanner from '../ui/AlertBanner';

const LANGS: { id: Bip39Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'zh-Hans', label: '中' },
  { id: 'ja', label: '日' },
  { id: 'ko', label: '한' },
];

function detectLang(mnemonic: string): Bip39Language {
  for (const { id } of LANGS) {
    if (validateMnemonicWithWordlist(mnemonic, id)) return id;
  }
  return 'en';
}

export default function BackupSeedScreen() {
  const { goBack } = useNav();
  const { storage } = useApp();
  const [words, setWords] = useState<string[] | null>(null);
  const [lang, setLang] = useState<Bip39Language>('en');
  const [error, setError] = useState(false);

  const handlePin = async (pin: string, reset: () => void) => {
    const mnemonic = await revealMnemonic(storage, pin);
    if (mnemonic) {
      const detected = detectLang(mnemonic);
      setLang(detected);
      setWords(mnemonic.split(/[\s\u3000]+/));
    } else {
      setError(true);
      reset();
      setTimeout(() => setError(false), 900);
    }
  };

  const handleLangChange = (newLang: Bip39Language) => {
    if (!words || newLang === lang) return;
    const sep = lang === 'ja' ? '\u3000' : ' ';
    const reencoded = reencodeMnemonic(words.join(sep), lang, newLang);
    setWords(reencoded.split(/[\s\u3000]+/));
    setLang(newLang);
  };

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Backup Seed Phrase" onBack={goBack} />
      <div className="flex-1 px-6 pt-6 flex flex-col gap-4">
        <AlertBanner icon={<span className="material-symbols-outlined text-error flex-shrink-0">warning</span>}>
          <p className="text-xs text-on-surface-variant leading-relaxed font-body">
            <span className="font-bold text-on-surface">Never share your seed phrase.</span>{' '}
            Anyone who has it can access your wallet.
          </p>
        </AlertBanner>

        {words ? (
          <>
            <div className="flex gap-2 flex-wrap">
              {LANGS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleLangChange(id)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
                  style={{
                    borderColor: lang === id ? 'var(--c-primary)' : 'var(--c-outline-variant)',
                    color: lang === id ? 'var(--c-primary)' : 'var(--c-on-surface-variant)',
                    background: lang === id ? 'var(--c-primary-container)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {words.map((w, i) => (
                <div key={i} className="bg-surface-container rounded-lg px-4 py-3 flex items-center gap-3">
                  <span className="font-label text-[10px] text-on-surface-variant min-w-[18px] uppercase">{i + 1}</span>
                  <span className="font-headline font-medium text-on-surface">{w}</span>
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="primary" icon="check" onClick={goBack}>Done</Button>
          </>
        ) : (
          <div className="flex flex-col items-center mt-8 gap-4">
            <p className="text-xs uppercase tracking-widest font-label" style={{ color: 'var(--c-on-surface-variant)' }}>
              Enter PIN to reveal
            </p>
            <PinPad onComplete={handlePin} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
