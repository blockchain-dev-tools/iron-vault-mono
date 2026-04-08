'use client';
import { useEffect, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { generateMnemonic } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

export default function P02() {
  const { go } = useNav();
  const { setGeneratedMnemonic } = useApp();
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    const mnemonic = generateMnemonic();
    const arr = mnemonic.split(' ');
    setWords(arr);
    setGeneratedMnemonic(arr);
  }, []);

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Backup Seed Phrase" />
      <div className="flex-1 px-6 pt-6 flex flex-col">
        <div className="flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl mb-6">
          <span className="material-symbols-outlined text-error flex-shrink-0">warning</span>
          <p className="text-xs text-on-surface-variant leading-relaxed font-body">
            <span className="font-bold text-on-surface">Write these 12 words on paper.</span>{' '}
            This is the only way to recover your wallet. Never screenshot or share.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {words.map((w, i) => (
            <div key={i} className="bg-surface-container rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="font-label text-[10px] text-on-surface-variant min-w-[18px] uppercase">{i + 1}</span>
              <span className="font-headline font-medium text-on-surface">{w}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />
        <Button variant="primary" icon="check" onClick={() => go('VerifyMnemonic')} disabled={words.length === 0}>
          I&apos;ve Written It Down
        </Button>
      </div>
    </div>
  );
}
