'use client';
import { useEffect, useState } from 'react';
import PinDots from './PinDots';

interface PinPadProps {
  onComplete: (pin: string, reset: () => void) => void;
  error?: boolean;
}

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'DEL'] as const;

export default function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState('');

  const reset = () => setPin('');

  const handleKey = (k: number | 'DEL' | null) => {
    if (k === null) return;
    setPin(prev => {
      if (k === 'DEL') return prev.slice(0, -1);
      if (prev.length >= 6) return prev;
      return prev + String(k);
    });
  };

  useEffect(() => {
    if (pin.length === 6) {
      const timer = setTimeout(() => onComplete(pin, reset), 150);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  return (
    <div className="flex flex-col items-center gap-4">
      <PinDots length={pin.length} error={error} />
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => handleKey(k)}
            className={`h-14 rounded-xl font-headline text-2xl font-medium flex items-center justify-center transition-all active:scale-90
              ${k === null ? 'bg-transparent pointer-events-none' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
          >
            {k === 'DEL'
              ? <span className="material-symbols-outlined text-xl">backspace</span>
              : k ?? ''}
          </button>
        ))}
      </div>
    </div>
  );
}
