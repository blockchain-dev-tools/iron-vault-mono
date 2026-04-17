'use client';
import { useApp } from '../../lib/app-context';
import { EN, ZH, type LocaleMode } from '@iron-vault/i18n';
import type { ThemeMode } from '../../lib/app-context';
import Button from '../ui/Button';
import ShieldLogo from '../ui/ShieldLogo';

const LOCALE_CYCLE: LocaleMode[] = ['en', 'zh', 'ja', 'ko', 'system'];
const LOCALE_LABEL: Record<LocaleMode, string> = { en: 'EN', zh: '中文', ja: '日本語', ko: '한국어', system: 'Auto' };
const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_ICON: Record<ThemeMode, string> = { system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' };

export default function WelcomeScreen() {
  const { go, themeMode, setThemeMode, localeMode, setLocaleMode } = useApp();

  const cycleLocale = () => {
    const idx = LOCALE_CYCLE.indexOf(localeMode);
    setLocaleMode(LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]);
  };

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(themeMode);
    setThemeMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const effectiveLocale = localeMode === 'system' ? 'en' : localeMode;
  const t = effectiveLocale === 'zh' ? ZH : EN;

  return (
    <div
      className="flex flex-col min-h-full px-6 relative overflow-hidden"
      style={{ paddingTop: 56, paddingBottom: 24, background: 'var(--c-background)' }}
    >
      {/* Geometric background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, var(--c-primary) 40px, var(--c-primary) 41px)' }}
        />
      </div>

      {/* Top controls */}
      <div className="flex items-center justify-end gap-2 z-10">
        <button
          onClick={cycleTheme}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all"
          style={{ backgroundColor: 'var(--c-surface-container)', borderColor: 'var(--c-outline-variant)' }}
        >
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
            {THEME_ICON[themeMode]}
          </span>
        </button>
        <button
          onClick={cycleLocale}
          className="h-8 px-3 rounded-xl flex items-center justify-center border transition-all"
          style={{ backgroundColor: 'var(--c-surface-container)', borderColor: 'var(--c-outline-variant)' }}
        >
          <span className="text-on-surface-variant text-xs font-bold">{LOCALE_LABEL[localeMode]}</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Hero */}
      <div className="flex flex-col items-center z-10">
        {/* Shield logo */}
        <div className="mb-10">
          <ShieldLogo />
        </div>

        {/* Title block */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-on-surface)', margin: 0 }}>
            IRON
          </h1>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-primary)', marginBottom: 20 }}>
            VAULT
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center" style={{ color: 'var(--c-on-surface-variant)', fontSize: 15, maxWidth: 240, lineHeight: 1.6, marginTop: 20 }}>
          {t.welcome.sub}
        </p>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="w-full space-y-3 mb-4 z-10">
        <Button variant="primary" icon="arrow_forward" onClick={() => go('Entropy')}>
          {t.welcome.createWallet}
        </Button>
        <Button variant="secondary" icon="file_upload" onClick={() => go('ImportMnemonic')}>
          {t.welcome.importWallet}
        </Button>
      </div>

      {/* Security info */}
      <div className="flex items-center justify-center gap-3 z-10" style={{ marginTop: 20 }}>
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>verified_user</span>
        <div>
          <p className="font-label font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--c-primary)' }}>
            {t.welcome.airGapped}
          </p>
          <p className="font-body" style={{ fontSize: 12, color: 'var(--c-on-surface-variant)', marginTop: 2 }}>
            {t.welcome.airGappedSub}
          </p>
        </div>
      </div>
    </div>
  );
}
