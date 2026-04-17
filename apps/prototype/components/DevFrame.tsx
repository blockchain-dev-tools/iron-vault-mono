'use client';
import { useState, useEffect } from 'react';
import { WalletSimulator } from '@iron-vault/simulator';
import type { ScreenId } from '@iron-vault/simulator';
import { useApp } from '@/lib/app-context';
import { hasWallet } from '@iron-vault/wallet';
import { walletStorage } from '@/lib/storage';

function LiveTime() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

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

          <div
            className="border-2 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,.8),0_0_0_1px_#111] bg-[#121212] border-[#2a2a2a] flex flex-col"
            style={{
              width: frameW,
              height: frameH,
              borderRadius: 44,
              flexShrink: 0,
              transform: 'translateZ(0)',
            }}
          >
            <div
              className="relative flex-shrink-0 flex items-end justify-between px-6 pb-1 bg-black"
              style={{ height: 54 }}
            >
              <span
                className="font-label font-semibold text-white z-10 pointer-events-none"
                style={{ fontSize: 13, letterSpacing: '-0.01em', lineHeight: 1 }}
              >
                <LiveTime />
              </span>

              <div
                className="absolute left-1/2 top-0 -translate-x-1/2 bg-[#121212]"
                style={{ width: 126, height: 34, borderRadius: '0 0 20px 20px' }}
              />

              <div className="flex items-center gap-1.5 z-10 pointer-events-none">
                <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
                  <rect x="0"  y="6" width="3" height="6" rx="0.5" opacity="1"   />
                  <rect x="4"  y="4" width="3" height="8" rx="0.5" opacity="1"   />
                  <rect x="8"  y="2" width="3" height="10" rx="0.5" opacity="1"  />
                  <rect x="12" y="0" width="3" height="12" rx="0.5" opacity="0.3"/>
                </svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                  <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/>
                  <path d="M8 6.5C9.9 6.5 11.6 7.3 12.8 8.6l1.4-1.4A8 8 0 0 0 8 4.5a8 8 0 0 0-6.2 2.7l1.4 1.4C4.4 7.3 6.1 6.5 8 6.5Z"/>
                  <path d="M8 3.5c2.8 0 5.3 1.1 7.1 3L16.5 5C14.3 2.8 11.3 1.5 8 1.5S1.7 2.8-.5 5l1.4 1.5A9.9 9.9 0 0 1 8 3.5Z" opacity="0.4"/>
                </svg>
                <div className="relative" style={{ width: 25, height: 12 }}>
                  <div className="absolute inset-0 rounded-[3px] border border-white" style={{ opacity: 0.35 }} />
                  <div className="absolute inset-[2px] rounded-[2px] bg-white" style={{ right: 6 }} />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[5px] rounded-r-sm bg-white" style={{ opacity: 0.4 }} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
              {initialScreen && (
                <WalletSimulator
                  storage={walletStorage}
                  initialScreen={initialScreen}
                  lightTheme={appLight}
                />
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-center bg-black" style={{ height: 24 }}>
              <div className="rounded-full bg-white" style={{ width: 120, height: 4, opacity: 0.3 }} />
            </div>
          </div>

          {/* Bottom bar indicator */}
          <div className="w-32 h-1 rounded-full" style={{ background: dt.border }} />
        </div>
      </div>
    </div>
  );
}
