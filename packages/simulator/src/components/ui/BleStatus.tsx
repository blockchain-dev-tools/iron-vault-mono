export type BleState = 'idle' | 'broadcasting' | 'connected';

const CONFIG: Record<BleState, { dot: string; card: string; title: string; sub: string }> = {
  idle:        { dot: 'bg-on-surface-variant',          card: 'bg-surface-container',                  title: 'BLE Standby',    sub: 'Tap button below to start' },
  broadcasting:{ dot: 'bg-primary animate-pulse-glow',  card: 'bg-primary/5 border border-primary/20', title: 'Broadcasting...', sub: 'Waiting for OKX to connect' },
  connected:   { dot: 'bg-primary',                     card: 'bg-primary/10 border border-primary/30', title: 'Connected',       sub: 'OKX (74:0C:B6...)' },
};

export default function BleStatus({ state }: { state: BleState }) {
  const c = CONFIG[state];
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 ${c.card}`}>
      <div className="relative flex-shrink-0">
        {state === 'broadcasting' && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary opacity-75" style={{ animation: 'ping 1.5s ease-in-out infinite' }} />
        )}
        <div className={`w-3 h-3 rounded-full ${c.dot}`} />
      </div>
      <div className="flex-1">
        <div className="font-headline font-bold text-sm uppercase tracking-wide">{c.title}</div>
        <div className="font-body text-xs text-on-surface-variant mt-0.5">{c.sub}</div>
      </div>
      <span className={`material-symbols-outlined text-xl ${state !== 'idle' ? 'text-primary' : 'text-on-surface-variant'}`}>
        {state === 'idle' ? 'bluetooth_disabled' : state === 'broadcasting' ? 'bluetooth_searching' : 'bluetooth_connected'}
      </span>
    </div>
  );
}
