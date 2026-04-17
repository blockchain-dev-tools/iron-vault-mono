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
import LangPicker from '../ui/LangPicker';

const LANGS: { id: Bip39Language }[] = [
  { id: 'en' }, { id: 'zh-Hans' }, { id: 'ja' }, { id: 'ko' },
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
  const [loading, setLoading] = useState(false);

  const handlePin = async (pin: string, reset: () => void) => {
    setLoading(true);
    await new Promise<void>(r => setTimeout(r, 32));
    const mnemonic = await revealMnemonic(storage, pin);
    setLoading(false);
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
    <div className="relative flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Backup Seed Phrase" onBack={goBack} />
      <div className="flex-1 px-6 pt-6 flex flex-col gap-4">
        <AlertBanner icon={<span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--c-error)' }}>warning</span>}>
          <p className="text-xs leading-relaxed font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
            <span className="font-bold" style={{ color: 'var(--c-on-surface)' }}>Never share your seed phrase.</span>{' '}
            Anyone who has it can access your wallet.
          </p>
        </AlertBanner>

        {words ? (
          <>
            <LangPicker value={lang} onChange={handleLangChange} />
            <div className="grid grid-cols-2 gap-2">
              {words.map((w, i) => (
                <div key={i} className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: 'var(--c-surface-container)' }}>
                  <span className="font-label text-[10px] min-w-[18px] uppercase" style={{ color: 'var(--c-on-surface-variant)' }}>{i + 1}</span>
                  <span className="font-headline font-medium" style={{ color: 'var(--c-on-surface)' }}>{w}</span>
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="primary" onClick={goBack}>Done</Button>
          </>
        ) : loading ? (
          <div className="flex flex-col items-center mt-16 gap-4">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-xs uppercase tracking-widest font-label" style={{ color: 'var(--c-on-surface-variant)' }}>
              Verifying PIN…
            </p>
          </div>
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
