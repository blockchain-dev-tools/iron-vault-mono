'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { entropyToMnemonic } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

export default function EntropyScreen() {
  const { go, goBack } = useNav();
  const { setGeneratedWords, setMnemonicEntropy, setMnemonicLang } = useApp();
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    const mnemonic = entropyToMnemonic(entropy, 'en');
    setMnemonicEntropy(entropy);
    setMnemonicLang('en');
    setGeneratedWords(mnemonic.split(' '));
    go('GenerateMnemonic');
  };

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Generate Entropy" onBack={goBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-4xl">shuffle</span>
        </div>
        <div className="text-center space-y-3">
          <h2 className="font-headline font-bold text-2xl tracking-tight" style={{ color: 'var(--c-on-surface)' }}>
            Entropy Source
          </h2>
          <p className="text-sm font-body" style={{ color: 'var(--c-on-surface-variant)', maxWidth: 280 }}>
            On a real device you would draw on screen to seed randomness. In the simulator, cryptographically secure random bytes are used directly.
          </p>
        </div>
        <Button variant="primary" icon="bolt" onClick={generate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Seed'}
        </Button>
      </div>
    </div>
  );
}
