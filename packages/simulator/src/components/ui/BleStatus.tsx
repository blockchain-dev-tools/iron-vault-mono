import type React from 'react';
import type { BleState } from '../../lib/app-context';

export type { BleState };

const BLE_ICON: Record<BleState, string> = {
  idle:         'bluetooth_disabled',
  broadcasting: 'bluetooth_searching',
  connected:    'bluetooth_connected',
  error:        'bluetooth_disabled',
};

const TITLE: Record<BleState, string> = {
  idle:         'BLE Standby',
  broadcasting: 'Broadcasting...',
  connected:    'Connected',
  error:        'BLE Error',
};

const SUB: Record<BleState, string> = {
  idle:         'Tap button below to start',
  broadcasting: 'Waiting for OKX to connect',
  connected:    'OKX (74:0C:B6...)',
  error:        'Could not start Bluetooth',
};

function cardStyle(state: BleState): React.CSSProperties {
  if (state === 'broadcasting' || state === 'connected') {
    return { background: 'var(--c-primary-container)', border: '1px solid var(--c-primary)' };
  }
  if (state === 'error') {
    return { background: 'var(--c-error-container)', border: '1px solid var(--c-error)' };
  }
  return { background: 'var(--c-surface-container)' };
}

function dotColor(state: BleState): string {
  if (state === 'error') return 'var(--c-error)';
  if (state === 'idle') return 'var(--c-on-surface-variant)';
  return 'var(--c-primary)';
}

function iconColor(state: BleState): string {
  if (state === 'error') return 'var(--c-error)';
  if (state === 'broadcasting' || state === 'connected') return 'var(--c-primary)';
  return 'var(--c-on-surface-variant)';
}

export default function BleStatus({ state }: { state: BleState }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={cardStyle(state)}>
      <div className="relative flex-shrink-0">
        {state === 'broadcasting' && (
          <div
            className="absolute inset-0 w-3 h-3 rounded-full opacity-75"
            style={{ background: 'var(--c-primary)', animation: 'ping 1.5s ease-in-out infinite' }}
          />
        )}
        <div className="w-3 h-3 rounded-full" style={{ background: dotColor(state) }} />
      </div>
      <div className="flex-1">
        <div className="font-headline font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--c-on-surface)' }}>{TITLE[state]}</div>
        <div className="font-body text-xs mt-0.5" style={{ color: 'var(--c-on-surface-variant)' }}>{SUB[state]}</div>
      </div>
      <span className="material-symbols-outlined text-xl" style={{ color: iconColor(state) }}>
        {BLE_ICON[state]}
      </span>
    </div>
  );
}
