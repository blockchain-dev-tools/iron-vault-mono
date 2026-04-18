'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import BottomNav from '../ui/BottomNav';
import Button from '../ui/Button';
import BleStatus from '../ui/BleStatus';
import ChainIcon from '../ui/ChainIcon';
import BottomSheet from '../ui/BottomSheet';

interface AccountRow {
  full: string;
  short: string;
  path: string;
  chain: string;
}

const CONNECT_STEPS: Record<'eth' | 'sol', string[]> = {
  eth: [
    'In OKX, tap 「Wallet」→「Add Wallet」',
    'Select 「Hardware Wallet」→「Ledger」',
    'Find device "IRON Vault" and tap Connect',
    'Approve connection on this device',
  ],
  sol: [
    'In OKX, tap 「Wallet」→「Add Wallet」',
    'Select 「Hardware Wallet」→「Ledger」',
    'Find device "IRON Vault" and tap Connect (Solana)',
    'Approve connection on this device',
  ],
};

export default function WalletManagerScreen() {
  const { go } = useNav();
  const { setCurrentAccount, accounts, addAccount, bleState, setBleState } = useApp();
  const [connectSheet, setConnectSheet] = useState<null | 'eth' | 'sol'>(null);
  const [addSheet, setAddSheet] = useState<null | 'eth' | 'sol'>(null);
  const [addingAccount, setAddingAccount] = useState(false);

  const ethAccounts = accounts.eth ?? [];
  const solAccounts = accounts.sol ?? [];

  const openAcct = (chain: 'eth' | 'sol', idx: number) => {
    setCurrentAccount(chain, idx);
    go('AccountDetail');
  };

  const openConnect = (chain: 'eth' | 'sol') => {
    setCurrentAccount(chain, 0);
    setConnectSheet(chain);
    if (bleState === 'idle') setBleState('broadcasting');
  };

  const closeConnect = () => {
    setConnectSheet(null);
    if (bleState === 'broadcasting') setBleState('idle');
  };

  const handleAddAccount = async (chain: 'eth' | 'sol') => {
    const list = chain === 'eth' ? ethAccounts : solAccounts;
    const nextIdx = list.length;
    const path = chain === 'eth'
      ? `m/44'/60'/0'/0/${nextIdx}`
      : `m/44'/501'/${nextIdx}'/0'`;
    setAddingAccount(true);
    try { await addAccount(chain, path, false); } finally { setAddingAccount(false); }
    setAddSheet(null);
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--c-background)' }}>
      <div className="flex-1 px-4 pt-4 pb-24 space-y-6 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline text-[28px] font-bold" style={{ color: 'var(--c-on-surface)' }}>Main Wallet</h2>
            <p className="text-sm font-body mt-1" style={{ color: 'var(--c-on-surface-variant)' }}>Secure master seed • HD</p>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded" style={{ color: 'var(--c-primary)', background: 'var(--c-primary-container)' }}>HD</span>
        </div>

        <ChainSection
          name="Ethereum"
          sub="ERC-20 & Layer 2s"
          chain="eth"
          accounts={ethAccounts.map(a => ({ ...a, chain: 'eth' }))}
          onConnect={() => openConnect('eth')}
          onAddAccount={() => setAddSheet('eth')}
          onAccountClick={(idx) => openAcct('eth', idx)}
        />

        <ChainSection
          name="Solana"
          sub="High Performance"
          chain="sol"
          accounts={solAccounts.map(a => ({ ...a, chain: 'sol' }))}
          onConnect={() => openConnect('sol')}
          onAddAccount={() => setAddSheet('sol')}
          onAccountClick={(idx) => openAcct('sol', idx)}
        />

        <div className="h-4" />
      </div>

      <BottomNav />

      <BottomSheet open={!!connectSheet} onClose={closeConnect}>
        <h3 className="font-headline font-bold text-lg mb-4" style={{ color: 'var(--c-on-surface)' }}>
          Connect OKX
        </h3>
        <BleStatus state={bleState} />
        <div className="mt-4 space-y-3">
          {connectSheet && CONNECT_STEPS[connectSheet].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm font-body">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-label flex-shrink-0"
                style={{ background: 'var(--c-primary)', color: 'var(--c-on-primary)' }}
              >{i + 1}</div>
              <span style={{ color: 'var(--c-on-surface-variant)' }}>{step}</span>
            </div>
          ))}
        </div>
        <div className="h-4" />
        <Button variant="outline-danger" onClick={closeConnect}>Stop / Close</Button>
      </BottomSheet>

      <BottomSheet open={!!addSheet} onClose={() => setAddSheet(null)}>
        <h3 className="font-headline font-bold text-lg mb-2" style={{ color: 'var(--c-on-surface)' }}>
          Add {addSheet === 'eth' ? 'Ethereum' : 'Solana'} Account
        </h3>
        <p className="text-xs font-body mb-6" style={{ color: 'var(--c-on-surface-variant)' }}>
          Derives the next HD account from your master seed (index {addSheet === 'eth' ? ethAccounts.length : solAccounts.length}).
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth={false} className="flex-1" onClick={() => setAddSheet(null)}>Cancel</Button>
          <Button variant="primary" fullWidth={false} className="flex-[2]" onClick={() => handleAddAccount(addSheet!)} disabled={addingAccount}>
            {addingAccount ? 'Adding…' : 'Add Account'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function ChainSection({ name, sub, chain, accounts, onConnect, onAddAccount, onAccountClick }: {
  name: string; sub: string; chain: 'eth' | 'sol';
  accounts: AccountRow[];
  onConnect: () => void;
  onAddAccount: () => void;
  onAccountClick: (idx: number) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--c-surface-container)' }}>
            <ChainIcon chain={chain} />
          </div>
          <div>
            <h3 className="font-headline font-bold text-xl" style={{ color: 'var(--c-on-surface)' }}>{name}</h3>
            <p className="text-xs font-mono" style={{ color: 'var(--c-on-surface-variant)' }}>{sub}</p>
          </div>
        </div>
        <button
          onClick={onConnect}
          className="px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
          style={{ background: 'var(--c-primary)', color: 'var(--c-on-primary)' }}
        >
          <span className="material-symbols-outlined text-sm">link</span>
          Connect
        </button>
      </div>
      {accounts.map((a, i) => (
        <div
          key={i}
          onClick={() => onAccountClick(i)}
          className="p-4 rounded-xl cursor-pointer transition-colors"
          style={{ background: 'var(--c-surface-container)' }}
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-label uppercase tracking-widest block" style={{ color: 'var(--c-on-surface-variant)' }}>Account {i + 1}</span>
              <code className="font-mono text-sm" style={{ color: 'var(--c-on-surface)' }}>{a.short}</code>
            </div>
            <span className="font-mono text-[10px]" style={{ color: 'var(--c-on-surface-variant)', opacity: 0.6 }}>{a.path}</span>
          </div>
        </div>
      ))}
      <button
        onClick={onAddAccount}
        className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-label font-medium uppercase tracking-wider transition-all"
        style={{ borderColor: 'var(--c-outline)', color: 'var(--c-on-surface-variant)', background: 'transparent' }}
      >
        + Add {name} Account
      </button>
    </section>
  );
}