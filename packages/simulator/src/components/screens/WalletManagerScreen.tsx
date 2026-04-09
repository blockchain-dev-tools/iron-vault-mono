'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import BottomNav from '../ui/BottomNav';
import Button from '../ui/Button';

interface AccountRow {
  full: string;
  short: string;
  path: string;
  chain: string;
}

function EthIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ethGradP06" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path d="M12 2L4.5 14L12 18V2Z" fill="url(#ethGradP06)" />
      <path d="M12 2L19.5 14L12 18V2Z" fill="url(#ethGradP06)" opacity="0.6" />
      <path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="url(#ethGradP06)" />
      <path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="url(#ethGradP06)" opacity="0.6" />
    </svg>
  );
}

function SolIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 101 88" fill="none">
      <defs>
        <linearGradient id="solGradP06" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
          <stop offset="0.08" stopColor="#9945FF" />
          <stop offset="0.3" stopColor="#8752F3" />
          <stop offset="0.5" stopColor="#5497D5" />
          <stop offset="0.6" stopColor="#43B4CA" />
          <stop offset="0.72" stopColor="#28E0B9" />
          <stop offset="0.97" stopColor="#19FB9B" />
        </linearGradient>
      </defs>
      <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#solGradP06)" />
    </svg>
  );
}

export default function P06() {
  const { go } = useNav();
  const { setCurrentAcct, accounts } = useApp();
  const [sheet, setSheet] = useState<null | 'eth' | 'sol'>(null);

  const ethAccounts = accounts?.eth ?? [];
  const solAccounts = accounts?.sol ?? [];

  const openAcct = (chain: 'eth' | 'sol', idx: number) => {
    setCurrentAcct({ chain, idx });
    go('AccountDetail');
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="flex-1 px-5 pt-5 space-y-6 overflow-y-auto">
        {/* Hero */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight">Main Wallet</h2>
            <p className="text-on-surface-variant text-sm font-body mt-1">Secure master seed • HD</p>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-1 rounded">HD</span>
        </div>

        {/* ETH Section */}
        <ChainSection
          name="Ethereum"
          sub="ERC-20 & Layer 2s"
          icon={<EthIcon />}
          accounts={ethAccounts.map(a => ({ ...a, chain: 'eth' }))}
          onConnect={() => setSheet('eth')}
          onAccountClick={(idx) => openAcct('eth', idx)}
        />

        {/* SOL Section */}
        <ChainSection
          name="Solana"
          sub="High Performance"
          icon={<SolIcon />}
          accounts={solAccounts.map(a => ({ ...a, chain: 'sol' }))}
          onConnect={() => setSheet('sol')}
          onAccountClick={(idx) => openAcct('sol', idx)}
        />

        <div className="h-4" />
      </div>

      <BottomNav />

      {/* Connect Sheet */}
      {sheet && (
        <div className="absolute inset-0 bg-background/70 flex items-end z-50" onClick={() => setSheet(null)}>
          <div className="bg-surface rounded-t-2xl p-6 w-full border-t border-outline/30 max-h-[75%] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-lg uppercase tracking-tight mb-4">Connect OKX</h3>
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <div>
                <div className="font-headline font-bold text-sm">Broadcasting...</div>
                <div className="text-xs text-on-surface-variant font-body mt-0.5">Waiting for OKX to connect</div>
              </div>
            </div>
            {[
              "In OKX, tap 「Wallet」→「Add Wallet」",
              "Select 「Hardware Wallet」→「Ledger」",
              ,
              'Find device "Nano X" and tap Connect',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 mb-4 text-sm font-body">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold font-label flex-shrink-0">{i + 1}</div>
                <span className="text-on-surface-variant">{step}</span>
              </div>
            ))}
            <div className="h-4" />
            <Button variant="outline-danger" onClick={() => setSheet(null)}>Stop / Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChainSection({ name, sub, icon, accounts, onConnect, onAccountClick }: {
  name: string; sub: string; icon: React.ReactNode;
  accounts: AccountRow[];
  onConnect: () => void;
  onAccountClick: (idx: number) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-headline font-bold text-xl">{name}</h3>
            <p className="text-xs text-on-surface-variant font-mono">{sub}</p>
          </div>
        </div>
        <button
          onClick={onConnect}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-widest flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">link</span>
          Connect
        </button>
      </div>
      {accounts.map((a, i) => (
        <div
          key={i}
          onClick={() => onAccountClick(i)}
          className="bg-surface-container p-4 border-l-[3px] border-primary cursor-pointer hover:bg-surface-container-high transition-colors"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest block">Account {i + 1}</span>
              <code className="font-mono text-sm text-on-surface">{a.short}</code>
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant opacity-60">{a.path}</span>
          </div>
        </div>
      ))}
      <button className="w-full py-3.5 border border-dashed border-outline rounded-none text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 group text-sm font-label font-medium uppercase tracking-wider">
        + Add {name} Account
      </button>
    </section>
  );
}