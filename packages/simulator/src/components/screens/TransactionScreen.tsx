'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionLabel from '../ui/SectionLabel';
import AlertBanner from '../ui/AlertBanner';

const DEMO_RAW = '0xa9059cbb000000000000000000000000b38553a5ee906bea5b8a0195b7725b58b3f89c23880000000000000000000000000000000000000000000000008ac7230489e80000';

export default function TransactionScreen() {
  const { goBack } = useNav();
  const { pendingTx, setPendingTx, currentChain, currentAcctIdx, accounts } = useApp();
  const [rawOpen, setRawOpen] = useState(false);
  const [done, setDone] = useState(false);

  const acct = accounts[currentChain]?.[currentAcctIdx];
  const chain = pendingTx?.chain ?? currentChain;
  const from = pendingTx?.from ?? acct?.short ?? '—';
  const to = pendingTx?.to ?? '0xb385...5b8a';
  const amount = pendingTx?.amount ?? '10.000000 USDC';
  const gas = pendingTx?.gas ?? '≈ 0.0003 ETH';
  const rawHex = pendingTx?.rawHex ?? DEMO_RAW;
  const network = pendingTx?.network ?? (chain === 'eth' ? 'Ethereum' : 'Solana');
  const type = pendingTx?.type ?? 'ERC-20 Transfer';

  const handleReject = () => {
    pendingTx?.reject();
    setPendingTx(null);
    goBack();
  };

  const handleSign = () => {
    if (pendingTx) {
      const sig = pendingTx.sign();
      pendingTx.resolve(sig);
      setPendingTx(null);
    }
    setDone(true);
  };

  const handleReturn = () => { setDone(false); setRawOpen(false); goBack(); };

  if (done) return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center"
         style={{ background: 'var(--c-background)' }}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--c-surface-container)', border: '2px solid var(--c-primary)' }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--c-primary)' }}>check_circle</span>
      </div>
      <h2 className="font-headline font-bold text-3xl tracking-tighter mb-2" style={{ color: 'var(--c-on-surface)' }}>Signed</h2>
      <p className="font-body mb-8" style={{ color: 'var(--c-on-surface-variant)' }}>Transaction sent back to OKX.</p>
      <Button variant="primary" onClick={handleReturn} icon="arrow_back">Return</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--c-background)' }}>
      <TopBar title="Sign Request" hideBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-4">
        <div className="flex flex-col items-center text-center mb-2">
          <div
            className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center"
            style={{ background: 'var(--c-surface-container-high)', border: '1px solid var(--c-outline-variant)' }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--c-primary)', fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          </div>
          <SectionLabel>Origin</SectionLabel>
          <h2 className="font-headline font-bold text-xl" style={{ color: 'var(--c-on-surface)' }}>From OKX Wallet</h2>
        </div>

        <Card>
          {[
            ['Network', network],
            ['Action', type],
            ['From', from],
            ['To', to],
            ['Amount', amount],
            ['Gas', gas],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-start py-3 last:border-none"
                 style={{ borderBottom: '1px solid var(--c-outline-variant)' }}>
              <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-on-surface-variant)' }}>{label}</span>
              <span
                className="font-headline font-medium text-right max-w-[55%]"
                style={{ color: label === 'Amount' ? 'var(--c-primary)' : 'var(--c-on-surface)', fontSize: label === 'Amount' ? '1rem' : '0.875rem' }}
              >{value}</span>
            </div>
          ))}
        </Card>

        <div>
          <button
            onClick={() => setRawOpen(r => !r)}
            className="w-full flex items-center justify-between py-3 transition-colors"
            style={{ borderTop: '1px solid var(--c-outline-variant)', paddingTop: 16, color: 'var(--c-on-surface-variant)', fontSize: 10, fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <span className="font-label">Raw Hex Data</span>
            <span className={`material-symbols-outlined text-sm transition-transform ${rawOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {rawOpen && (
            <div className="p-3 rounded-xl mt-2" style={{ background: 'var(--c-surface-container-low)', border: '1px solid var(--c-outline-variant)' }}>
              <pre className="font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap max-h-24 overflow-y-auto" style={{ color: 'var(--c-on-surface-variant)' }}>{rawHex}</pre>
            </div>
          )}
        </div>

        <AlertBanner icon={<span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--c-error)' }}>warning</span>}>
          <p className="text-xs leading-relaxed font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
            <span className="font-bold" style={{ color: 'var(--c-error)' }}>Double-check recipient.</span>{' '}
            Signed transactions are permanent and cannot be reversed.
          </p>
        </AlertBanner>
      </div>

      <div className="flex-shrink-0 px-6 pb-6 pt-4 space-y-3" style={{ borderTop: '1px solid var(--c-outline-variant)', background: 'var(--c-background)' }}>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth={false} className="flex-1" onClick={handleReject}>Reject</Button>
          <Button variant="primary" fullWidth={false} className="flex-[2]" onClick={handleSign}>Confirm &amp; Sign</Button>
        </div>
        <div className="flex items-center justify-center gap-2" style={{ opacity: 0.4 }}>
          <span className="material-symbols-outlined text-xs" style={{ color: 'var(--c-on-surface-variant)' }}>lock</span>
          <p className="font-label text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--c-on-surface-variant)' }}>Encrypted Session Secure</p>
        </div>
      </div>
    </div>
  );
}
