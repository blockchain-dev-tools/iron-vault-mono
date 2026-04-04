'use client';
import { useApp } from '../../lib/app-context';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { appLight, setAppLight } = useApp();
  return (
    <button
      onClick={() => setAppLight(v => !v)}
      title={appLight ? 'Switch to Dark' : 'Switch to Light'}
      className={`flex items-center gap-2 rounded-xl border transition-all ${className}`}
      style={appLight
        ? { borderColor: 'rgba(143,195,34,0.4)', background: 'rgba(143,195,34,0.1)', color: '#8FC322', padding: showLabel ? '6px 12px' : '8px' }
        : { borderColor: 'rgba(255,255,255,0.1)', color: showLabel ? '#999' : '#666', padding: showLabel ? '6px 12px' : '8px' }}
    >
      <span className="material-symbols-outlined text-sm">{appLight ? 'light_mode' : 'dark_mode'}</span>
      {showLabel && (
        <span className="font-label text-xs uppercase tracking-wider">{appLight ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
