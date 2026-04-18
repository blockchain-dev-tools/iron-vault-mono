'use client';
import { useCallback, useRef, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { entropyToMnemonic } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

const TARGET_POINTS = 200;

type Dot = { x: number; y: number };

export default function EntropyScreen() {
  const { go, goBack } = useNav();
  const { setGeneratedWords, setMnemonicEntropy, setMnemonicLang } = useApp();
  const [dots, setDots] = useState<Dot[]>([]);
  const touchBytesRef = useRef<number[]>([]);
  const drawing = useRef(false);

  const progress = Math.min(dots.length / TARGET_POINTS, 1);
  const isComplete = progress >= 1;
  const pct = Math.round(progress * 100);

  const collectPoint = useCallback((x: number, y: number) => {
    const ts = Date.now();
    touchBytesRef.current.push(
      Math.round(x) & 0xff,
      (Math.round(x) >> 8) & 0xff,
      Math.round(y) & 0xff,
      (Math.round(y) >> 8) & 0xff,
      ts & 0xff,
      (ts >> 8) & 0xff,
    );
    setDots(prev => prev.length < TARGET_POINTS ? [...prev, { x, y }] : prev);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    drawing.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    collectPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    collectPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const onPointerUp = () => { drawing.current = false; };

  const handleContinue = useCallback(async () => {
    if (!isComplete) return;
    const touchU8 = new Uint8Array(touchBytesRef.current);
    const base = crypto.getRandomValues(new Uint8Array(16));
    const combined = new Uint8Array(touchU8.length + base.length);
    combined.set(touchU8, 0);
    combined.set(base, touchU8.length);
    const hashBuf = await crypto.subtle.digest('SHA-256', combined);
    const entropy = new Uint8Array(hashBuf).slice(0, 16);
    const mnemonic = entropyToMnemonic(entropy, 'en');
    setMnemonicEntropy(entropy);
    setMnemonicLang('en');
    setGeneratedWords(mnemonic.split(/[\s\u3000]+/));
    go('GenerateMnemonic');
  }, [isComplete, go, setMnemonicEntropy, setMnemonicLang, setGeneratedWords]);

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--c-background)' }}>
      <TopBar title="Generate Entropy" onBack={goBack} />
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 gap-4">
        <p className="text-sm font-body text-center" style={{ color: 'var(--c-on-surface-variant)' }}>
          {isComplete
            ? 'Entropy collected — tap Continue'
            : 'Draw freely inside the box to seed your wallet\'s randomness'}
        </p>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex-1 rounded-2xl border select-none touch-none cursor-crosshair relative overflow-hidden"
          style={{
            borderColor: isComplete ? 'var(--c-primary)' : 'var(--c-outline-variant)',
            background: 'var(--c-surface)',
            minHeight: 160,
          }}
        >
          {dots.map((d, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: d.x - 3,
                top: d.y - 3,
                width: 6,
                height: 6,
                background: 'var(--c-primary)',
                opacity: 0.3 + 0.7 * (i / Math.max(dots.length - 1, 1)),
              }}
            />
          ))}
          {dots.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--c-on-surface-variant)' }}>gesture</span>
            </div>
          )}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: 'var(--c-surface)', opacity: 0.9 }}>
              <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--c-primary)' }}>check_circle</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-surface-container)' }}>
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${pct}%`, background: 'var(--c-primary)' }}
            />
          </div>
          <span className="text-sm font-bold w-9 text-right" style={{ color: 'var(--c-primary)' }}>{pct}%</span>
        </div>

        <Button
          variant={isComplete ? 'primary' : 'secondary'}
          icon="arrow_forward"
          onClick={handleContinue}
          disabled={!isComplete}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
