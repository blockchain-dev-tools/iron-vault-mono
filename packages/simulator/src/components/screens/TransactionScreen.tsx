'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { ACCOUNTS } from '../../lib/default-data';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionLabel from '../ui/SectionLabel';
import AlertBanner from '../ui/AlertBanner';

const RAW = '0xa9059cbb000000000000000000000000b38553a5ee906bea5b8a0195b7725b58b3f89c23880000000000000000000000000000000000000000000000008ac7230489e80000';

export default function P11() {
  const { goBack } = useNav();
  const { currentAcct } = useApp();
  const { chain, idx } = currentAcct;
  const acct = ACCOUNTS[chain][idx];
  const [rawOpen, setRawOpen] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => { setDone(false); setRawOpen(false); goBack(); };

  if (done) return (
    <div className="flex flex-col min-h-full items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[120px] rounded-full" />
      </div>
      <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center mb-6 shadow-primary">
        <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
      </div>
      <h2 className="font-headline font-bold text-3xl tracking-tighter mb-2">Signed</h2>
      <p className="text-on-surface-variant font-body mb-8">Transaction sent back to OKX.</p>
      <Button variant="primary" onClick={reset} icon="arrow_back">Return</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pt-16 pb-32">
      <TopBar title="Sign Request" hideBack />
      <div className="flex-1 px-6 pt-6 space-y-4 overflow-y-auto">
        {/* Origin */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-14 h-14 bg-surface-container-high rounded-xl mb-3 flex items-center justify-center border border-outline/20 shadow-primary-sm">
            <span className="material-symbols-outlined text-primary text-3xl filled" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          </div>
          <SectionLabel>Origin</SectionLabel>
          <h2 className="font-headline font-bold text-xl">From OKX Wallet</h2>
        </div>

        {/* Details Card */}
        <Card accent>
          {[
            ['Network', chain === 'eth' ? 'Ethereum' : 'Solana'],
            ['Action', 'ERC-20 Transfer'],
            ['From', acct.short],
            ['To', '0xb385...5b8a'],
            ['Amount', '10.000000 USDC'],
            ['Gas', '≈ 0.0003 ETH'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-start py-3 border-b border-outline/20 last:border-none">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</span>
              <span className={`font-headline font-medium text-right max-w-[55%] ${label === 'Amount' ? 'text-primary text-base' : 'text-sm'}`}>{value}</span>
            </div>
          ))}
        </Card>

        {/* Raw data */}
        <div>
          <button
            onClick={() => setRawOpen(r => !r)}
            className="w-full flex items-center justify-between text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface py-2 transition-colors border-t border-outline/20 pt-4"
          >
            <span>Raw Hex Data</span>
            <span className={`material-symbols-outlined text-sm transition-transform ${rawOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {rawOpen && (
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline/10 mt-2">
              <pre className="font-mono text-[10px] leading-relaxed text-on-surface-variant break-all whitespace-pre-wrap max-h-24 overflow-y-auto">{RAW}</pre>
            </div>
          )}
        </div>

        {/* Warning */}
        <AlertBanner icon={<span className="material-symbols-outlined text-error flex-shrink-0">warning</span>}>
          <p className="text-xs text-on-surface-variant leading-relaxed font-body">
            <span className="font-bold text-error">Double-check recipient.</span> Signed transactions are permanent and cannot be reversed.
          </p>
        </AlertBanner>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-2xl border-t border-outline/20 p-6 space-y-3">
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth={false} className="flex-1" onClick={reset}>Reject</Button>
          <Button variant="primary" fullWidth={false} className="flex-[2]" onClick={() => setDone(true)}>Confirm &amp; Sign</Button>
        </div>
        <div className="flex items-center justify-center gap-2 opacity-40">
          <span className="material-symbols-outlined text-xs">lock</span>
          <p className="text-[9px] font-label uppercase tracking-[0.2em]">Encrypted Session Secure</p>
        </div>
      </div>
    </div>
  );
}
