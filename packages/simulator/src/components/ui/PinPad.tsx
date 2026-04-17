'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PinDots from './PinDots';

interface PinPadProps {
  onComplete: (pin: string, reset: () => void) => void;
  error?: boolean;
}

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'DEL'] as const;

export default function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [springing, setSpringing] = useState<number | null>(null);
  const springTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const reset = () => setPin('');

  const triggerSpring = useCallback((idx: number) => {
    const existing = springTimers.current.get(idx);
    if (existing) clearTimeout(existing);
    setSpringing(null);
    requestAnimationFrame(() => {
      setSpringing(idx);
      const t = setTimeout(() => {
        setSpringing(prev => (prev === idx ? null : prev));
      }, 350);
      springTimers.current.set(idx, t);
    });
  }, []);

  const handleKey = useCallback((k: number | 'DEL' | null, idx: number) => {
    if (k === null) return;
    triggerSpring(idx);
    setPin(prev => {
      if (k === 'DEL') return prev.slice(0, -1);
      if (prev.length >= 6) return prev;
      return prev + String(k);
    });
  }, [triggerSpring]);

  useEffect(() => {
    if (pin.length === 6) {
      const timer = setTimeout(() => onComplete(pin, reset), 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="flex flex-col items-center gap-4">
      <PinDots length={pin.length} error={error} />
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => handleKey(k, i)}
            className={`h-14 rounded-xl font-headline text-2xl font-medium flex items-center justify-center
              ${springing === i ? 'key-spring' : ''}
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
