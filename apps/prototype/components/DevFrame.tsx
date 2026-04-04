'use client';
import { useState, useEffect } from 'react';
import { WalletSimulator } from '@iron-vault/simulator';
import type { ScreenId } from '@iron-vault/simulator';
import { useApp } from '@/lib/app-context';
import { hasWallet } from '@iron-vault/wallet';
import { walletStorage } from '@/lib/storage';

interface Preset {
  label: string;
  sub: string;
  w: number;
  h: number;
}

const PRESETS: Preset[] = [
  { label: 'iPhone SE',        sub: '375 × 667',  w: 375, h: 667  },
  { label: 'iPhone 14',        sub: '390 × 844',  w: 390, h: 844  },
  { label: 'iPhone 14 Pro Max',sub: '430 × 932',  w: 430, h: 932  },
  { label: 'Pixel 7',          sub: '412 × 915',  w: 412, h: 915  },
  { label: 'Custom',           sub: 'custom',     w: 0,   h: 0    },
];

export default function DevFrame() {
  const [activeIdx, setActiveIdx] = useState(1); // iPhone 14 default
  const [customW, setCustomW] = useState(360);
  const [customH, setCustomH] = useState(780);
  const [devLight, setDevLight] = useState(false);
  const [initialScreen, setInitialScreen] = useState<ScreenId | null>(null);
  const { appLight } = useApp();

  useEffect(() => {
    hasWallet(walletStorage).then(has => setInitialScreen(has ? 'Unlock' : 'Welcome'));
  }, []);

  const preset = PRESETS[activeIdx];
  const isCustom = preset.label === 'Custom';
  const frameW = isCustom ? customW : preset.w;
  const frameH = isCustom ? customH : preset.h;

  // DevFrame color tokens
  const dt = devLight
    ? { bg: '#F0F0F0', toolbar: '#E8E8E8', border: '#CCCCCC', text: '#222', textMuted: '#666', btnBorder: '#BBBBBB' }
    : { bg: '#000000', toolbar: '#0A0A0A', border: '#1A1A1A', text: '#FFF', textMuted: '#999', btnBorder: '#333' };

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: dt.bg }}>
      {/* Top toolbar */}
      <div
        className="flex items-center flex-shrink-0 h-14 min-w-0"
        style={{ background: dt.toolbar, borderBottom: `1px solid ${dt.border}` }}
      >
        {/* Left: logo */}
        <div className="flex items-center gap-2 px-4 flex-shrink-0 h-full" style={{ borderRight: `1px solid ${dt.border}` }}>
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smartphone</span>
          <span className="font-label text-xs uppercase tracking-widest font-bold" style={{ color: dt.textMuted }}>Viewport</span>
        </div>

        {/* Middle: scrollable presets */}
        <div className="flex items-center gap-1 px-3 overflow-x-auto flex-1 h-full" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setActiveIdx(i)}
              className="flex-shrink-0 flex flex-col items-start px-3 py-1.5 rounded-lg border transition-all"
              style={activeIdx === i
                ? { background: 'rgba(143,195,34,0.1)', borderColor: 'rgba(143,195,34,0.4)', color: '#8FC322' }
                : { borderColor: 'transparent', color: dt.textMuted }}
            >
              <span className="font-label text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">{p.label}</span>
              <span className="font-mono text-[9px] opacity-50 whitespace-nowrap">{p.sub}</span>
            </button>
          ))}
          {isCustom && (
            <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
              <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))}
                className="w-16 rounded-lg px-2 py-1.5 text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary"
                style={{ background: dt.bg, border: `1px solid ${dt.border}`, color: dt.text }} />
              <span style={{ color: dt.textMuted }} className="text-xs">×</span>
              <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))}
                className="w-16 rounded-lg px-2 py-1.5 text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary"
                style={{ background: dt.bg, border: `1px solid ${dt.border}`, color: dt.text }} />
            </div>
          )}
        </div>

        {/* Right: dev theme toggle + showcase */}
        <div className="flex-shrink-0 px-3 h-full flex items-center gap-2" style={{ borderLeft: `1px solid ${dt.border}` }}>
          <button
            onClick={() => setDevLight(l => !l)}
            title={devLight ? 'Tool → Dark' : 'Tool → Light'}
            className="flex items-center px-2 py-1.5 rounded-lg border transition-all"
            style={devLight
              ? { borderColor: 'rgba(143,195,34,0.4)', background: 'rgba(143,195,34,0.1)', color: '#8FC322' }
              : { borderColor: dt.btnBorder, color: dt.textMuted }}
          >
            <span className="material-symbols-outlined text-sm">{devLight ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <a href="/showcase"
            className="flex items-center px-2 py-1.5 rounded-lg border transition-all"
            style={{ borderColor: dt.btnBorder, color: dt.textMuted }}>
            <span className="material-symbols-outlined text-sm">palette</span>
          </a>
        </div>
      </div>

      {/* Frame area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-8" style={{ background: dt.bg }}>
        <div className="flex flex-col items-center gap-4">
          {/* Size label */}
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: dt.textMuted }}>
            <span style={{ color: '#8FC322' }} className="font-bold">{preset.label}</span>
            <span style={{ color: dt.border }}>—</span>
            <span style={{ color: dt.textMuted }}>{frameW} × {frameH}</span>
          </div>

          {/* Phone frame
              transform: translateZ(0) creates a new containing block so that
              position:fixed children (TopBar, BottomNav, P11 action bar) are
              contained within the frame rather than escaping to the viewport. */}
          <div
            className="relative border-2 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,.8),0_0_0_1px_#111] bg-[#121212] border-[#2a2a2a]"
            style={{
              width: frameW,
              height: frameH,
              borderRadius: 44,
              flexShrink: 0,
              transform: 'translateZ(0)',
            }}
          >
            {/* Notch */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] bg-[#121212]"
              style={{ width: 126, height: 34, borderRadius: '0 0 18px 18px' }}
            />
            {/* Status bar time */}
            <div className="absolute top-[10px] left-0 right-0 text-center text-[13px] font-semibold text-white z-[99] pointer-events-none">
              9:41
            </div>
            {/* Screen content */}
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
              {initialScreen && (
                <WalletSimulator
                  storage={walletStorage}
                  initialScreen={initialScreen}
                  lightTheme={appLight}
                />
              )}
            </div>
          </div>

          {/* Bottom bar indicator */}
          <div className="w-32 h-1 rounded-full" style={{ background: dt.border }} />
        </div>
      </div>
    </div>
  );
}
