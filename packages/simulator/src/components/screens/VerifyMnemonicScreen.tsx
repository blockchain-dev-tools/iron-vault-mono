'use client';
import { useState, useMemo } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import SectionLabel from '../ui/SectionLabel';

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5); }

const POSITIONS = [2, 6, 10];

export default function VerifyMnemonicScreen() {
  const { go } = useNav();
  const { generatedWords } = useApp();
  const words = generatedWords;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongError, setWrongError] = useState(false);

  const groups = useMemo(() =>
    POSITIONS.map(pos => ({
      pos,
      correct: words[pos] ?? '',
      opts: words.length > 0
        ? shuffle([words[pos], ...shuffle(words.filter((_, j) => j !== pos)).slice(0, 3)])
        : [],
    })), [words]);

  const pick = (pos: number, word: string) => {
    if (wrongError) return;
    const next = { ...answers, [pos]: word };
    setAnswers(next);
    if (Object.keys(next).length === POSITIONS.length) {
      const allCorrect = POSITIONS.every(p => words[p] === next[p]);
      if (allCorrect) {
        setTimeout(() => go('SetPin'), 400);
      } else {
        setWrongError(true);
        setTimeout(() => {
          setAnswers({});
          setWrongError(false);
        }, 1200);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Verify Phrase" onBack={() => go('GenerateMnemonic')} />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-6">
        {wrongError && (
          <div
            className="rounded-xl p-3 border flex items-center justify-center"
            style={{ background: 'var(--c-error-container)', borderColor: 'var(--c-error)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--c-error)' }}>
              Incorrect — please try again
            </p>
          </div>
        )}

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
                    className="rounded-xl px-4 font-headline font-medium text-sm border transition-all active:scale-95"
                    style={{
                      paddingTop: 12,
                      paddingBottom: 12,
                      borderColor: isCorrect ? 'var(--c-primary)' : isWrong ? 'var(--c-error)' : 'var(--c-outline)',
                      background: isCorrect ? 'var(--c-primary-container)' : isWrong ? 'var(--c-error-container)' : 'var(--c-surface-container)',
                      color: isCorrect ? 'var(--c-primary)' : isWrong ? 'var(--c-error)' : 'var(--c-on-surface)',
                      borderWidth: isCorrect || isWrong ? 2 : 1,
                    }}
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
          className="w-full text-center text-xs py-4 font-label uppercase tracking-widest"
          style={{ color: 'var(--c-on-surface-variant)', textDecoration: 'underline' }}
        >
          Skip verification (not recommended)
        </button>
      </div>
    </div>
  );
}
