'use client';
import React, { useState } from 'react';
import { EthIcon as EthE, SolIcon as SolOfficial } from '@iron-vault/assets';

/* ─── Ethereum variants ─────────────────────────────────────────────────── */

const EthA = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4.5 14L12 18V2Z" fill="#627EEA" />
    <path d="M12 2L19.5 14L12 18V2Z" fill="#627EEA" opacity="0.6" />
    <path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="#627EEA" />
    <path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="#627EEA" opacity="0.6" />
  </svg>
);

const EthB = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 13.5L12 17.5L20 13.5L12 2Z" fill="#627EEA" />
    <path d="M12 19.5L4 15L12 22L20 15L12 19.5Z" fill="#627EEA" opacity="0.75" />
  </svg>
);

const EthC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4.5 14L12 18V2Z" fill="white" />
    <path d="M12 2L19.5 14L12 18V2Z" fill="white" opacity="0.55" />
    <path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="white" />
    <path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="white" opacity="0.55" />
  </svg>
);

const EthD = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4.5 14L12 18V2Z" fill="#8FC322" />
    <path d="M12 2L19.5 14L12 18V2Z" fill="#8FC322" opacity="0.55" />
    <path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="#8FC322" />
    <path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="#8FC322" opacity="0.55" />
  </svg>
);

/* ─── Solana variants ───────────────────────────────────────────────────── */

const SolA = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 5.5H17.5L21 8H6.5L3 5.5Z" fill="#9945FF" />
    <path d="M3 11H17.5L21 13.5H6.5L3 11Z" fill="#AB5BE8" />
    <path d="M3 16.5H17.5L21 19H6.5L3 16.5Z" fill="#14F195" />
  </svg>
);

const SolB = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="3.5" rx="1.75" fill="#9945FF" />
    <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" fill="#AB5BE8" />
    <rect x="3" y="15.5" width="18" height="3.5" rx="1.75" fill="#14F195" />
  </svg>
);

const SolC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="solgrad" x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
    </defs>
    <path d="M3 5.5H17.5L21 8H6.5L3 5.5Z" fill="url(#solgrad)" />
    <path d="M3 11H17.5L21 13.5H6.5L3 11Z" fill="url(#solgrad)" />
    <path d="M3 16.5H17.5L21 19H6.5L3 16.5Z" fill="url(#solgrad)" />
  </svg>
);

const SolD = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 5.5H17.5L21 8H6.5L3 5.5Z" fill="white" />
    <path d="M3 11H17.5L21 13.5H6.5L3 11Z" fill="white" opacity="0.65" />
    <path d="M3 16.5H17.5L21 19H6.5L3 16.5Z" fill="white" opacity="0.35" />
  </svg>
);

const SolE = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 5.5H17.5L21 8H6.5L3 5.5Z" fill="#8FC322" />
    <path d="M3 11H17.5L21 13.5H6.5L3 11Z" fill="#8FC322" opacity="0.7" />
    <path d="M3 16.5H17.5L21 19H6.5L3 16.5Z" fill="#8FC322" opacity="0.4" />
  </svg>
);

/* ─── Helper components ─────────────────────────────────────────────────── */

function IconWrap({ children, bg, border, label, active, onClick }: {
  children: React.ReactNode;
  bg: string; border: string; label: string;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
      style={{ outline: active ? '2px solid #8FC322' : 'none', outlineOffset: 2 }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
        {children}
      </div>
      <span className="text-xs font-mono" style={{ color: '#9AA0A6' }}>{label}</span>
    </button>
  );
}

function Section({ title, icons, bg, border, textColor, selected, onSelect }: {
  title: string;
  icons: { label: string; node: React.ReactNode }[];
  bg: string; border: string; textColor: string;
  selected: string; onSelect: (l: string) => void;
}) {
  return (
    <div className="p-6 rounded-2xl" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: textColor }}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {icons.map(ic => (
          <IconWrap key={ic.label} bg={bg === '#1A1A1A' ? '#242424' : '#E8F0D0'} border={border} label={ic.label}
            active={selected === ic.label} onClick={() => onSelect(ic.label)}>
            {ic.node}
          </IconWrap>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

const ETH_ICONS = [
  { label: 'A · Blue', node: <EthA /> },
  { label: 'B · Flat', node: <EthB /> },
  { label: 'C · White', node: <EthC /> },
  { label: 'D · Green', node: <EthD /> },
  { label: 'E · Gradient', node: <EthE /> },
];

const SOL_ICONS = [
  { label: 'Official', node: <SolOfficial /> },
  { label: 'A · Brand', node: <SolA /> },
  { label: 'B · Rounded', node: <SolB /> },
  { label: 'C · Gradient', node: <SolC /> },
  { label: 'D · White', node: <SolD /> },
  { label: 'E · Green', node: <SolE /> },
];

export default function IconPickerPage() {
  const [ethPick, setEthPick] = useState('A · Blue');
  const [solPick, setSolPick] = useState('Official');

  return (
    <div className="min-h-screen p-10" style={{ backgroundColor: '#0F0F0F', fontFamily: 'monospace' }}>
      <h1 className="text-2xl font-black text-white mb-1">Chain Icon Picker</h1>
      <p className="text-sm mb-8" style={{ color: '#9AA0A6' }}>Click to select. Current picks shown with green outline.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* ETH dark */}
        <Section title="Ethereum — dark" icons={ETH_ICONS} bg="#1A1A1A" border="#2A2A2A"
          textColor="#9AA0A6" selected={ethPick} onSelect={setEthPick} />
        {/* ETH light */}
        <Section title="Ethereum — light" icons={ETH_ICONS.map(ic => ({ ...ic }))} bg="#FFFFFF" border="#C8D8A0"
          textColor="#5A6640" selected={ethPick} onSelect={setEthPick} />
        {/* SOL dark */}
        <Section title="Solana — dark" icons={SOL_ICONS} bg="#1A1A1A" border="#2A2A2A"
          textColor="#9AA0A6" selected={solPick} onSelect={setSolPick} />
        {/* SOL light */}
        <Section title="Solana — light" icons={SOL_ICONS.map(ic => ({ ...ic }))} bg="#FFFFFF" border="#C8D8A0"
          textColor="#5A6640" selected={solPick} onSelect={setSolPick} />
      </div>

      <div className="mt-8 p-4 rounded-xl max-w-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
        <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#9AA0A6' }}>Selection</p>
        <p className="text-white font-bold">ETH: <span style={{ color: '#8FC322' }}>{ethPick}</span></p>
        <p className="text-white font-bold mt-1">SOL: <span style={{ color: '#8FC322' }}>{solPick}</span></p>
      </div>
    </div>
  );
}