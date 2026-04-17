'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '../lib/app-context';

function LiveTime() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

interface PhoneFrameProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  showChrome?: boolean;
}

export default function PhoneFrame({ children, style, className, showChrome = true }: PhoneFrameProps) {
  const { themeMode } = useApp();
  const [systemLight, setSystemLight] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    setSystemLight(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemLight(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isLight = themeMode === 'light' || (themeMode === 'system' && systemLight);

  if (!showChrome) {
    return (
      <div
        className={`h-full relative overflow-hidden ${isLight ? 'light-theme' : ''} ${className ?? ''}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col relative overflow-hidden ${isLight ? 'light-theme' : ''} ${className ?? ''}`}
      style={{
        borderRadius: 44,
        border: '2px solid #2a2a2a',
        boxShadow: '0 24px 80px rgba(0,0,0,.8), 0 0 0 1px #111',
        background: '#121212',
        ...style,
      }}
    >
      <div
        className="relative flex-shrink-0 flex items-end justify-between px-6 pb-1"
        style={{ height: 54, background: 'var(--c-background)' }}
      >
        <span
          className="font-label font-semibold z-10 pointer-events-none"
          style={{ fontSize: 13, letterSpacing: '-0.01em', lineHeight: 1, color: 'var(--c-on-surface)' }}
        >
          <LiveTime />
        </span>

        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{ width: 126, height: 34, borderRadius: '0 0 20px 20px', background: '#121212' }}
        />

        <div className="flex items-center gap-1.5 z-10 pointer-events-none">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="var(--c-on-surface)">
            <rect x="0"  y="6" width="3" height="6"  rx="0.5" opacity="1"   />
            <rect x="4"  y="4" width="3" height="8"  rx="0.5" opacity="1"   />
            <rect x="8"  y="2" width="3" height="10" rx="0.5" opacity="1"   />
            <rect x="12" y="0" width="3" height="12" rx="0.5" opacity="0.3" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="var(--c-on-surface)">
            <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/>
            <path d="M8 6.5C9.9 6.5 11.6 7.3 12.8 8.6l1.4-1.4A8 8 0 0 0 8 4.5a8 8 0 0 0-6.2 2.7l1.4 1.4C4.4 7.3 6.1 6.5 8 6.5Z"/>
            <path d="M8 3.5c2.8 0 5.3 1.1 7.1 3L16.5 5C14.3 2.8 11.3 1.5 8 1.5S1.7 2.8-.5 5l1.4 1.5A9.9 9.9 0 0 1 8 3.5Z" opacity="0.4"/>
          </svg>
          <div className="relative" style={{ width: 25, height: 12 }}>
            <div className="absolute inset-0 rounded-[3px] border" style={{ borderColor: 'var(--c-on-surface)', opacity: 0.35 }} />
            <div className="absolute inset-[2px] rounded-[2px]" style={{ right: 6, background: 'var(--c-on-surface)' }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[5px] rounded-r-sm" style={{ background: 'var(--c-on-surface)', opacity: 0.4 }} />
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--c-background)' }}>
        {children}
      </div>

      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ height: 24, background: 'var(--c-background)' }}
      >
        <div className="rounded-full" style={{ width: 120, height: 4, background: 'var(--c-on-surface)', opacity: 0.3 }} />
      </div>
    </div>
  );
}
