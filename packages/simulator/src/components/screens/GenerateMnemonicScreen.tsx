'use client';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { reencodeMnemonic } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import AlertBanner from '../ui/AlertBanner';
import LangPicker from '../ui/LangPicker';
import PassphraseBox from '../ui/PassphraseBox';

export default function GenerateMnemonicScreen() {
  const { go, goBack } = useNav();
  const { generatedWords, setGeneratedWords, mnemonicLang, setMnemonicLang, passphrase, setPassphrase } = useApp();

  const handleLangChange = (newLang: Bip39Language) => {
    if (newLang === mnemonicLang || generatedWords.length === 0) return;
    const sep = mnemonicLang === 'ja' ? '\u3000' : ' ';
    const reencoded = reencodeMnemonic(generatedWords.join(sep), mnemonicLang, newLang);
    setGeneratedWords(reencoded.split(/[\s\u3000]+/));
    setMnemonicLang(newLang);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Your Seed Phrase" onBack={goBack} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-4">
        <AlertBanner icon={<span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--c-error)' }}>warning</span>}>
          <p className="text-xs leading-relaxed font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
            <span className="font-bold" style={{ color: 'var(--c-on-surface)' }}>Write these 12 words on paper.</span>{' '}
            This is the only way to recover your wallet. Never screenshot or share.
          </p>
        </AlertBanner>

        <LangPicker value={mnemonicLang} onChange={handleLangChange} />

        <div className="grid grid-cols-2 gap-2">
          {generatedWords.map((w, i) => (
            <div key={i} className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: 'var(--c-surface-container)' }}>
              <span className="font-label text-[10px] min-w-[18px] uppercase" style={{ color: 'var(--c-on-surface-variant)' }}>{i + 1}</span>
              <span className="font-headline font-medium" style={{ color: 'var(--c-on-surface)' }}>{w}</span>
            </div>
          ))}
        </div>

        <PassphraseBox value={passphrase} onChange={setPassphrase} />

        <div className="flex-1" />
        <Button variant="primary" icon="arrow_forward" onClick={() => go('VerifyMnemonic')} disabled={generatedWords.length === 0}>
          I&apos;ve Written It Down
        </Button>
      </div>
    </div>
  );
}
