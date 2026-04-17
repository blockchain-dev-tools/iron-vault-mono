'use client';
import React from 'react';
import { useNav } from '../../lib/nav';
import type { BleState } from './BleStatus';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: React.ReactNode;
  bleState?: BleState;
}

export default function TopBar({ title, onBack, hideBack, right, bleState }: TopBarProps) {
  const { goBack } = useNav();
  const handleBack = onBack ?? goBack;

  return (
    <header className="flex justify-between items-center px-6 h-16 w-full fixed z-50 bg-background/90 backdrop-blur-md border-b border-outline/30" style={{ top: 0 }}>
      <div className="flex items-center gap-4">
        {!hideBack && (
          <button onClick={handleBack} className="text-primary active:scale-95 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {hideBack && (
          <span className="material-symbols-outlined text-primary filled">shield</span>
        )}
        <h1 className="font-headline font-bold tracking-tight uppercase text-on-surface text-base">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {bleState && (
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-lg">
            <span
              className={`material-symbols-outlined text-sm filled ${
                bleState === 'connected' ? 'text-primary' :
                bleState === 'broadcasting' ? 'text-primary animate-pulse-glow' : 'text-on-surface-variant'
              }`}
            >
              sensors
            </span>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
              {bleState === 'connected' ? 'BLE Active' : bleState === 'broadcasting' ? 'BLE Scan' : 'BLE Standby'}
            </span>
          </div>
        )}
        {right}
      </div>
    </header>
  );
}
