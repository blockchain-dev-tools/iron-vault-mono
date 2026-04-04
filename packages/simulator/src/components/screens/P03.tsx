'use client';
import { useState, useMemo } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import SectionLabel from '../ui/SectionLabel';

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5); }

const VERIFY_POSITIONS = [2, 6, 10];

export default function P03() {
  const { go } = useNav();
  const { generatedMnemonic } = useApp();
  const words = generatedMnemonic ?? [];
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const groups = useMemo(() =>
    VERIFY_POSITIONS.map(pos => ({
      pos,
      correct: words[pos] ?? '',
      opts: words.length > 0
        ? shuffle([words[pos], ...shuffle(words.filter((_, j) => j !== pos)).slice(0, 3)])
        : [],
    })), [words]);

  const pick = (pos: number, word: string) => {
    const next = { ...answers, [pos]: word };
    setAnswers(next);
    if (Object.keys(next).length === 3 && VERIFY_POSITIONS.every(p => words[p] === next[p])) {
      setTimeout(() => go('SetPin'), 400);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-16 pb-8">
      <TopBar title="Verify Phrase" />
      <div className="flex-1 px-6 pt-6 space-y-6">
        {groups.map(({ pos, correct, opts }) => (
          <div key={pos}>
            <SectionLabel>Word #{pos + 1}</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {opts.map(o => {
                const picked = answers[pos];
                const isCorrect = picked === o && o === correct;
                const isWrong = picked === o && o !== correct;
                return (
                  <button
                    key={o}
                    onClick={() => !picked && pick(pos, o)}
                    className={`rounded-xl py-3 px-4 font-headline font-medium text-sm border transition-all active:scale-95
                      ${isCorrect ? 'border-primary bg-primary/10 text-primary' :
                        isWrong ? 'border-error bg-error/10 text-error' :
                        'border-outline bg-surface-container text-on-surface hover:border-primary/50'}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button
          onClick={() => go('SetPin')}
          className="w-full text-center text-xs text-on-surface-variant underline decoration-outline py-4 font-label uppercase tracking-widest"
        >
          Skip verification (not recommended)
        </button>
      </div>
    </div>
  );
}
