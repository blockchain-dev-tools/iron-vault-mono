'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionLabel from '../ui/SectionLabel';


interface Log { time: string; icon: string; msg: string; }

export default function AccountDetailScreen() {
  const { goBack, go } = useNav();
  const { currentChain, currentAcctIdx, accounts, bleState, setBleState, removeAccount } = useApp();
  const chain = currentChain;
  const idx = currentAcctIdx;
  const acct = accounts[chain]?.[idx];
  const isEth = chain === 'eth';
  const accts = isEth ? accounts.eth : accounts.sol;
  const canDelete = accts.length > 1;

  const [log, setLog] = useState<Log[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = (icon: string, msg: string) => {
    const time = new Date().toTimeString().slice(0, 5);
    setLog(l => [...l, { time, icon, msg }]);
  };

  const toggle = () => {
    if (bleState === 'idle' || bleState === 'error') {
      setBleState('broadcasting');
      setLog([]);
      addLog('sensors', 'BLE broadcast started "Nano X"');
      timer.current = setTimeout(() => {
        setBleState('connected');
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
      setBleState('idle');
      setLog([]);
    }
  };

  const handleRemove = () => {
    if (!acct || !canDelete) return;
    if (!confirm(`Remove account ${acct.short}? This cannot be undone.`)) return;
    removeAccount(chain, acct.path);
    goBack();
  };

  useEffect(() => () => { timer.current && clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (acct?.full) {
      QRCode.toDataURL(acct.full, { margin: 1, color: { dark: '#000000', light: '#ffffff' }, width: 160 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [acct?.full]);

  if (!acct) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: 'var(--c-background)' }}>
        <TopBar title="Account" onBack={goBack} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant text-sm font-body">No account selected</p>
        </div>
      </div>
    );
  }

  const btnVariant = bleState === 'idle' || bleState === 'error' ? 'primary' : 'danger';
  const btnIcon    = bleState === 'idle' || bleState === 'error' ? 'bluetooth' : 'power_settings_new';
  const btnLabel   =
    bleState === 'error'        ? 'Retry BLE' :
    bleState === 'idle'         ? 'Start Accepting Transactions' : 'Stop';

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--c-background)' }}>
      <TopBar
        title={`${isEth ? 'Ethereum' : 'Solana'} #${idx + 1}`}
        onBack={goBack}
        bleState={bleState}
        right={
          <button
            onClick={handleRemove}
            disabled={!canDelete}
            className="p-2 transition-all"
            style={{ color: canDelete ? 'var(--c-error)' : 'var(--c-on-surface-variant)', opacity: canDelete ? 1 : 0.3 }}
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        }
      />

      <div className="flex-1 px-6 pt-6 space-y-4 overflow-y-auto pb-24">
        <Card accent>
          <div className="flex justify-between items-center mb-3">
            <SectionLabel>Public Address</SectionLabel>
            <button
              onClick={() => navigator.clipboard?.writeText(acct.full)}
              className="p-2 rounded-xl transition-all active:scale-90"
              style={{ background: 'var(--c-surface-container-low)', color: 'var(--c-primary)' }}
            >
              <span className="material-symbols-outlined text-base leading-none">content_copy</span>
            </button>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--c-surface-container-low)', borderColor: 'var(--c-border-variant)' }}>
            <code className="font-mono text-sm break-all leading-relaxed" style={{ color: 'var(--c-primary)' }}>{acct.full || acct.short}</code>
          </div>
          {qrDataUrl && (
            <div className="flex justify-center py-5">
              <div className="p-3 bg-white rounded-xl">
                <img src={qrDataUrl} alt="QR Code" width={160} height={160} />
              </div>
            </div>
          )}
          <div className="mt-3">
            <span className="font-mono text-[10px]" style={{ color: 'var(--c-on-surface-variant)' }}>{acct.path}</span>
          </div>
        </Card>

        <div>
          <SectionLabel>Activity</SectionLabel>
          <div className="rounded-xl p-3 space-y-1 overflow-y-auto" style={{ background: 'var(--c-surface-container)', minHeight: 60, maxHeight: 140 }}>
            {log.length === 0 ? (
              <p className="text-xs font-body text-center py-3" style={{ color: 'var(--c-on-surface-variant)' }}>
                No activity yet
              </p>
            ) : log.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-body">
                <span className="font-mono min-w-[38px]" style={{ color: 'var(--c-outline-variant)' }}>{l.time}</span>
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--c-primary)' }}>{l.icon}</span>
                <span style={{ color: 'var(--c-on-surface-variant)' }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="px-6 pb-6 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--c-border-variant)', background: 'var(--c-background)' }}>
        {bleState === 'error' && (
          <div className="rounded-xl p-4 border" style={{ background: 'var(--c-surface-container)', borderColor: 'var(--c-border-variant)' }}>
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--c-on-surface)' }}>Troubleshooting</p>
            {[
              'Ensure Bluetooth is enabled on this device',
              'Keep OKX Wallet open and on the connect screen',
              'Stay within 2 metres of the connecting device',
              'If stuck, stop and retry the connection',
            ].map((tip, i) => (
              <p key={i} className="text-xs leading-5" style={{ color: 'var(--c-on-surface-variant)' }}>{tip}</p>
            ))}
          </div>
        )}
        <Button variant={btnVariant} icon={btnIcon} onClick={toggle}>
          {btnLabel}
        </Button>
        {bleState === 'idle' && (
          <p className="text-center text-xs font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
            Tap above — this device will act as a Ledger hardware wallet
          </p>
        )}
        {(bleState === 'broadcasting' || bleState === 'connected') && (
          <div className="flex items-center justify-center gap-2">
            <div className="relative w-3 h-3 flex items-center justify-center">
              {bleState === 'broadcasting' && (
                <div className="absolute inset-0 rounded-full opacity-40" style={{ background: 'var(--c-primary)', animation: 'ping 1.5s ease-in-out infinite' }} />
              )}
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: bleState === 'connected' ? '#4caf50' : 'var(--c-primary)' }}
              />
            </div>
            <p className="text-xs font-body" style={{ color: 'var(--c-on-surface-variant)' }}>
              {bleState === 'broadcasting' ? 'In OKX, tap「Connect Hardware Wallet」→「Ledger」' : 'Waiting for signing request...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
