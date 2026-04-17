'use client';
import { useApp, type ThemeMode } from '../../lib/app-context';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_ICON: Record<ThemeMode, string> = { system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' };
const THEME_LABEL: Record<ThemeMode, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

export default function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { themeMode, setThemeMode } = useApp();

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(themeMode);
    setThemeMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const isLight = themeMode === 'light';
  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${THEME_LABEL[themeMode]} (click to cycle)`}
      className={`flex items-center gap-2 rounded-xl border transition-all ${className}`}
      style={isLight
        ? { borderColor: 'rgba(143,195,34,0.4)', background: 'rgba(143,195,34,0.1)', color: '#8FC322', padding: showLabel ? '6px 12px' : '8px' }
        : { borderColor: 'rgba(255,255,255,0.1)', color: showLabel ? '#999' : '#666', padding: showLabel ? '6px 12px' : '8px' }}
    >
      <span className="material-symbols-outlined text-sm">{THEME_ICON[themeMode]}</span>
      {showLabel && (
        <span className="font-label text-xs uppercase tracking-wider">{THEME_LABEL[themeMode]}</span>
      )}
    </button>
  );
}
