'use client';
import { useState } from 'react';
import { WalletSimulator, Button } from '@iron-vault/simulator';
import { EN, ZH, type LocaleMode } from '@iron-vault/i18n';
import { walletStorage } from '@/lib/storage';

const LOCALE_CYCLE: LocaleMode[] = ['en', 'zh', 'system'];
const LOCALE_LABEL: Record<LocaleMode, string> = { en: 'EN', zh: '中文', system: 'Auto' };

function PhoneMock({ label, light, children }: { label: string; light?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-headline text-sm font-bold text-primary tracking-widest uppercase">{label}</h3>
      <div
        className={`relative border-2 overflow-hidden border-outline/40 ${light ? 'light-theme' : ''}`}
        style={{ width: 360, height: 760, borderRadius: 40, transform: 'translateZ(0)', background: 'var(--c-background)' }}
      >
        <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ━━━ New Direction: Bold Geometric ━━━━━━━━━━━━━━━━━━━━━━ */
function WelcomeNewDirection({ light, onToggle, locale, onCycleLocale }: {
  light: boolean;
  onToggle: () => void;
  locale: LocaleMode;
  onCycleLocale: () => void;
}) {
  const effectiveLocale = locale === 'system' ? 'en' : locale;
  const t = effectiveLocale === 'zh' ? ZH : EN;

  return (
    <div className="flex flex-col min-h-[760px] px-6 relative overflow-hidden"
      style={{ paddingTop: 56, paddingBottom: 24, background: 'var(--c-background)' }}>

      {/* Geometric background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #8FC322 40px, #8FC322 41px)' }} />
      </div>

      {/* Top controls */}
      <div className="flex items-center justify-end gap-2 z-10">
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all"
          style={{ backgroundColor: 'var(--c-surface-container)', borderColor: 'var(--c-outline-variant)' }}
        >
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
            {light ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          onClick={onCycleLocale}
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
            <path d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z" fill="#8FC322" />
            <rect x="28" y="32" width="24" height="30" rx="4" fill="#0D1A00" />
            <rect x="33" y="24" width="14" height="12" rx="7" stroke="#0D1A00" strokeWidth="3" fill="none" />
            <circle cx="40" cy="47" r="3" fill="#8FC322" />
            <rect x="39" y="49" width="2" height="6" rx="1" fill="#8FC322" />
          </svg>
        </div>

        {/* Title block — independently positioned */}
        <div style={{ marginLeft: '50%', transform: 'translateX(-50%)' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-on-surface)', margin: 0 }}>
            IRON
          </h1>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, color: 'var(--c-primary)', marginBottom: 20 }}>
            VAULT
          </h1>
        </div>

        {/* Subtitle — independently centered */}
        <p className="text-center" style={{ color: 'var(--c-on-surface-variant)', fontSize: 15, maxWidth: 240, lineHeight: 1.6, marginTop: 20 }}>
          {t.welcome.sub}
        </p>
      </div>

      <div className="flex-1" />

      {/* Actions — reuse Button component */}
      <div className="w-full space-y-3 mb-4 z-10">
        <Button variant="primary" icon="arrow_forward">
          {t.welcome.createWallet}
        </Button>
        <Button variant="secondary" icon="file_upload">
          {t.welcome.importWallet}
        </Button>
      </div>

      {/* Security info — no card border */}
      <div className="flex items-center gap-3 z-10" style={{ marginTop: 20 }}>
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

/* ━━━ Compare Page ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ComparePage() {
  const [light, setLight] = useState(false);
  const [locale, setLocale] = useState<LocaleMode>('en');

  const cycleLocale = () => {
    const idx = LOCALE_CYCLE.indexOf(locale);
    setLocale(LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Welcome Screen — Before / After</h1>
        <p className="text-on-surface-variant text-sm">切换按钮同时控制两边的主题和语言</p>
      </div>
      <div className="flex items-start justify-center gap-10 flex-wrap">
        <PhoneMock label="Current" light={light}>
          <WalletSimulator storage={walletStorage} initialScreen="Welcome" lightTheme={light} />
        </PhoneMock>
        <PhoneMock label="New Direction" light={light}>
          <WelcomeNewDirection
            light={light}
            onToggle={() => setLight(v => !v)}
            locale={locale}
            onCycleLocale={cycleLocale}
          />
        </PhoneMock>
      </div>
    </div>
  );
}
