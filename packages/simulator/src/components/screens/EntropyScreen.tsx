'use client';
import { useCallback, useRef, useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { entropyToMnemonic } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

const TARGET_POINTS = 100;

export default function EntropyScreen() {
  const { go, goBack } = useNav();
  const { setGeneratedWords, setMnemonicEntropy, setMnemonicLang } = useApp();
  const [dots, setDots] = useState(0);
  const touchBytesRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);

  const progress = Math.min(dots / TARGET_POINTS, 1);
  const isComplete = progress >= 1;

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
    setDots(d => Math.min(d + 1, TARGET_POINTS));
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

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Generate Entropy" onBack={goBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-center space-y-2">
          <h2 className="font-headline font-bold text-2xl tracking-tight" style={{ color: 'var(--c-on-surface)' }}>
            Draw to Seed Randomness
          </h2>
          <p className="text-sm font-body" style={{ color: 'var(--c-on-surface-variant)', maxWidth: 280 }}>
            Move your cursor inside the box to collect entropy for your seed phrase.
          </p>
        </div>

        <div
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-full max-w-[280px] h-[180px] rounded-2xl border-2 select-none touch-none cursor-crosshair relative overflow-hidden"
          style={{
            borderColor: isComplete ? 'var(--c-primary)' : 'var(--c-outline)',
            background: 'var(--c-surface-container)',
          }}
        >
          {!isComplete && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: dots === 0 ? 1 : Math.max(0, 1 - dots / 20) }}
            >
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">gesture</span>
            </div>
          )}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
            </div>
          )}
          <div
            className="absolute bottom-0 left-0 h-1 transition-all duration-150"
            style={{
              width: `${pct}%`,
              background: 'var(--c-primary)',
              opacity: isComplete ? 0 : 1,
            }}
          />
        </div>

        <p className="font-label text-xs uppercase tracking-widest" style={{ color: isComplete ? 'var(--c-primary)' : 'var(--c-on-surface-variant)' }}>
          {isComplete ? 'Entropy collected ✓' : `${pct}% — keep drawing`}
        </p>

        <Button variant="primary" icon="bolt" onClick={handleContinue} disabled={!isComplete}>
          Continue
        </Button>
      </div>
    </div>
  );
}
