'use client';
import React, { useState } from 'react';

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

const EthE = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ethgrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M12 2L4.5 14L12 18V2Z" fill="url(#ethgrad)" />
    <path d="M12 2L19.5 14L12 18V2Z" fill="url(#ethgrad)" opacity="0.6" />
    <path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="url(#ethgrad)" />
    <path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="url(#ethgrad)" opacity="0.6" />
  </svg>
);

/* ─── Solana variants ───────────────────────────────────────────────────── */

const SolOfficial = () => (<svg width="24" height="24" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="solOfficial" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
        <stop offset="0.08" stopColor="#9945FF"/>
        <stop offset="0.3" stopColor="#8752F3"/>
        <stop offset="0.5" stopColor="#5497D5"/>
        <stop offset="0.6" stopColor="#43B4CA"/>
        <stop offset="0.72" stopColor="#28E0B9"/>
        <stop offset="0.97" stopColor="#19FB9B"/>
      </linearGradient>
    </defs>
    <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#solOfficial)" />
  </svg>
);

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