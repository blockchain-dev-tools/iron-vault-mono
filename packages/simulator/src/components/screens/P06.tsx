'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import BottomNav from '../ui/BottomNav';
import Button from '../ui/Button';

interface AccountRow {
  full: string;
  short: string;
  path: string;
  chain: string;
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
    <div className="flex flex-col min-h-full pt-16 pb-24">
      <TopBar
        title="Vault"
        hideBack
        right={
          <button onClick={() => go('Settings')} className="p-2 text-on-surface hover:bg-white/10 rounded-xl transition-colors active:scale-95">
            <span className="material-symbols-outlined">settings</span>
          </button>
        }
      />

      <div className="flex-1 px-6 pt-6 pb-4 space-y-8">
        {/* Hero */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-headline text-4xl font-bold tracking-tight">Main Wallet</h2>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-1 rounded">HD Wallet</span>
          </div>
          <p className="text-on-surface-variant text-sm font-body">Secure master seed managed by hardware vault.</p>
        </div>

        {/* ETH Section */}
        <ChainSection
          name="Ethereum"
          sub="ERC-20 & Layer 2s"
          icon="token"
          accounts={ethAccounts.map(a => ({ ...a, chain: 'eth' }))}
          onConnect={() => setSheet('eth')}
          onAccountClick={(idx) => openAcct('eth', idx)}
        />

        {/* SOL Section */}
        <ChainSection
          name="Solana"
          sub="High Performance"
          icon="bolt"
          accounts={solAccounts.map(a => ({ ...a, chain: 'sol' }))}
          onConnect={() => setSheet('sol')}
          onAccountClick={(idx) => openAcct('sol', idx)}
        />

        {/* BLE status */}
        <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-primary rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-primary rounded-full" style={{ animation: 'ping 2s ease-in-out infinite', opacity: 0.75 }} />
            </div>
            <div>
              <p className="text-sm font-bold font-headline">Hardware Vault Linked</p>
              <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">Bluetooth Active • Encrypted</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary">verified_user</span>
        </div>
      </div>

      <BottomNav />

      {/* Connect OKX Sheet */}
      {sheet && (
        <div className="absolute inset-0 bg-background/70 flex items-end z-50 fade-in" onClick={() => setSheet(null)}>
          <div className="bg-surface rounded-t-2xl p-6 w-full slide-up border-t border-outline/30 max-h-[75%] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-lg uppercase tracking-tight mb-4">Connect OKX</h3>
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary opacity-75" style={{ animation: 'ping 1.5s ease-in-out infinite' }} />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div>
                <div className="font-headline font-bold text-sm">Broadcasting...</div>
                <div className="text-xs text-on-surface-variant font-body mt-0.5">Waiting for OKX to connect</div>
              </div>
            </div>
            {[
              "In OKX, tap「Wallet」→「Add Wallet」",
              "Select「Hardware Wallet」→「Ledger」",
              `Select ${sheet === 'eth' ? 'Ethereum' : 'Solana'} chain`,
              'Find device "Nano X" and tap Connect',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 mb-4 text-sm font-body">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold font-label flex-shrink-0">{i + 1}</div>
                <span className="text-on-surface-variant">{step}</span>
              </div>
            ))}
            <div className="bg-surface-container rounded-xl p-3 text-xs font-mono text-on-surface-variant leading-relaxed mb-5">
              {(sheet === 'eth' ? ethAccounts : solAccounts).map((a, i) => (
                <div key={i}>Account {i + 1}: {a.short}<br /><span className="text-outline-variant">{a.path}</span></div>
              ))}
            </div>
            <Button variant="outline-danger" onClick={() => setSheet(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChainSection({ name, sub, icon, accounts, onConnect, onAccountClick }: {
  name: string; sub: string; icon: string;
  accounts: AccountRow[];
  onConnect: () => void;
  onAccountClick: (idx: number) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-xl">{name}</h3>
            <p className="text-xs text-on-surface-variant font-mono">{sub}</p>
          </div>
        </div>
        <button
          onClick={onConnect}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">link</span>
          Connect
        </button>
      </div>
      <div className="space-y-2">
        {accounts.map((a, i) => (
          <div
            key={i}
            onClick={() => onAccountClick(i)}
            className="bg-surface-container rounded-xl p-4 border-l-2 border-primary cursor-pointer hover:bg-surface-container-high transition-colors active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest block mb-1">Account {i + 1}</span>
                <code className="font-mono text-sm text-on-surface tracking-tighter">{a.short}</code>
              </div>
              <div className="flex gap-2">
                <button className="text-on-surface-variant hover:text-primary transition-colors p-1">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-outline/20">
              <span className="font-mono text-[10px] text-on-surface-variant opacity-60">{a.path}</span>
              <span className="text-xs font-mono text-on-surface-variant italic uppercase tracking-tight">Offline</span>
            </div>
          </div>
        ))}
        <button className="w-full py-4 border border-dashed border-outline rounded-xl text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
          <span className="text-sm font-label font-medium uppercase tracking-wider">Add {name} Account</span>
        </button>
      </div>
    </section>
  );
}
