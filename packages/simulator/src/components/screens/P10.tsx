'use client';
import { useState, useEffect, useRef } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import BottomNav from '../ui/BottomNav';
import BleStatus, { type BleState } from '../ui/BleStatus';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionLabel from '../ui/SectionLabel';

interface Log { time: string; icon: string; msg: string; }

export default function P10() {
  const { goBack, go } = useNav();
  const { currentAcct, accounts } = useApp();
  const { chain, idx } = currentAcct;
  const acct = accounts?.[chain]?.[idx];
  const isEth = chain === 'eth';
  const [ble, setBle] = useState<BleState>('idle');
  const [log, setLog] = useState<Log[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = (icon: string, msg: string) => {
    const t = new Date().toTimeString().slice(0, 5);
    setLog(l => [...l, { time: t, icon, msg }]);
  };

  const toggle = () => {
    if (ble === 'idle') {
      setBle('broadcasting');
      addLog('sensors', 'BLE broadcast started "Nano X"');
      timer.current = setTimeout(() => {
        setBle('connected');
        addLog('check_circle', 'Connected: OKX');
        addLog('smartphone', isEth ? 'Ethereum App detected' : 'Solana App detected');
        addLog('key', `Querying address #${idx + 1}`);
        timer.current = setTimeout(() => {
          addLog('draw', 'Sign request received!');
          setTimeout(() => go('Transaction'), 500);
        }, 2000);
      }, 2000);
    } else {
      timer.current && clearTimeout(timer.current);
      setBle('idle');
      setLog([]);
    }
  };

  useEffect(() => () => { timer.current && clearTimeout(timer.current); }, []);

  if (!acct) {
    return (
      <div className="flex flex-col min-h-full pt-16 pb-24">
        <TopBar title="Account" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant text-sm font-body">No account selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pt-16 pb-24">
      <TopBar title={`${isEth ? 'Ethereum' : 'Solana'} Account ${idx + 1}`} bleState={ble} />

      <div className="flex-1 px-6 pt-6 space-y-4">
        <Card accent>
          <div className="flex justify-between items-start mb-4">
            <div>
              <SectionLabel>Public Address</SectionLabel>
              <h3 className="font-headline font-semibold text-lg">{isEth ? 'Ethereum Mainnet' : 'Solana Mainnet'}</h3>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(acct.full)}
              className="p-2 bg-surface-container-high rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline/10">
            <code className="font-mono text-primary text-sm break-all leading-relaxed tracking-wider">{acct.full}</code>
          </div>
          <div className="mt-3 pt-3 border-t border-outline/20">
            <span className="font-mono text-[10px] text-on-surface-variant">{acct.path}</span>
          </div>
        </Card>

        <BleStatus state={ble} />

        {log.length > 0 && (
          <div>
            <SectionLabel>Activity Log</SectionLabel>
            <div className="bg-surface-container rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
              {log.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-body">
                  <span className="text-outline-variant font-mono min-w-[38px]">{l.time}</span>
                  <span className="material-symbols-outlined text-primary text-sm">{l.icon}</span>
                  <span className="text-on-surface-variant">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ble === 'idle' && (
          <p className="text-center text-xs text-on-surface-variant font-body">
            Tap below — this device will act as a Ledger hardware wallet and accept signing requests from OKX.
          </p>
        )}
        {ble === 'broadcasting' && (
          <p className="text-center text-xs text-on-surface-variant font-body">
            In OKX, tap「Connect Hardware Wallet」→「Ledger」
          </p>
        )}
        {ble === 'connected' && (
          <p className="text-center text-xs text-on-surface-variant font-body">Waiting for signing request...</p>
        )}
      </div>

      <div className="px-6 pb-4 pt-2">
        <Button
          variant={ble === 'idle' ? 'primary' : 'danger'}
          icon={ble === 'idle' ? 'input' : 'stop_circle'}
          onClick={toggle}
        >
          {ble === 'idle' ? 'Start Accepting Transactions' : 'Stop'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
