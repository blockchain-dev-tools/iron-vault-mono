'use client';
import { useState } from 'react';
import { useNav } from '../../lib/nav';
import { useApp } from '../../lib/app-context';
import { EN, ZH, type LocaleMode } from '@iron-vault/i18n';
import Button from '../ui/Button';

const LOCALE_CYCLE: LocaleMode[] = ['en', 'zh', 'system'];
const LOCALE_LABEL: Record<LocaleMode, string> = { en: 'EN', zh: '中文', system: 'Auto' };

export default function P01() {
  const { go } = useNav();
  const { appLight, setAppLight } = useApp();
  const [locale, setLocale] = useState<LocaleMode>('en');

  const cycleLocale = () => {
    const idx = LOCALE_CYCLE.indexOf(locale);
    setLocale(LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]);
  };

  const effectiveLocale = locale === 'system' ? 'en' : locale;
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
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #8FC322 40px, #8FC322 41px)' }}
        />
      </div>

      {/* Top controls */}
      <div className="flex items-center justify-end gap-2 z-10">
        <button
          onClick={() => setAppLight(v => !v)}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all"
          style={{ backgroundColor: 'var(--c-surface-container)', borderColor: 'var(--c-outline-variant)' }}
        >
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
            {appLight ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          onClick={cycleLocale}
          className="h-8 px-3 rounded-xl flex items-center justify-center border transition-all"
          style={{ backgroundColor: 'var(--c-surface-container)', borderColor: 'var(--c-outline-variant)' }}
        >
          <span className="text-on-surface-variant text-xs font-bold">{LOCALE_LABEL[locale]}</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Hero */}
      <div className="flex flex-col items-center z-10">
        {/* Shield logo */}
        <div className="mb-10">
          <svg width="88" height="100" viewBox="0 0 80 92" fill="none">
            <path
              fillRule="evenodd"
              d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V52Q52 56 48 56H32Q28 56 28 52V36Q28 32 32 32Z M33 32Q33 24 40 24Q47 24 47 32Z M36 32Q36 27 40 27Q44 27 44 32Z"
              fill="var(--c-primary)"
            />
            <circle cx="40" cy="42" r="3" fill="var(--c-primary)" />
            <rect x="39" y="44" width="2" height="6" rx="1" fill="var(--c-primary)" />
          </svg>
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
        <Button variant="primary" icon="arrow_forward" onClick={() => go('GenerateMnemonic')}>
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
