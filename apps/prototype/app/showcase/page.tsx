'use client';
import { useState } from 'react';
import { Button, Card, SectionLabel, BleStatus, PinDots } from '@iron-vault/simulator';

const DARK_COLORS = [
  { name: 'Primary',                token: 'primary',                hex: '#8FC322' },
  { name: 'On-Primary',             token: 'on-primary',             hex: '#1d2900' },
  { name: 'Background',             token: 'background',             hex: '#000000' },
  { name: 'Surface',                token: 'surface',                hex: '#1A1A1A' },
  { name: 'Surface Container',      token: 'surface-container',      hex: '#1A1919' },
  { name: 'Surface Container Low',  token: 'surface-container-low',  hex: '#131313' },
  { name: 'Surface Container High', token: 'surface-container-high', hex: '#262626' },
  { name: 'On-Surface',             token: 'on-surface',             hex: '#FFFFFF' },
  { name: 'On-Surface Variant',     token: 'on-surface-variant',     hex: '#999999' },
  { name: 'Outline',                token: 'outline',                hex: '#333333' },
  { name: 'Outline Variant',        token: 'outline-variant',        hex: '#494847' },
  { name: 'Error',                  token: 'error',                  hex: '#ff7351' },
  { name: 'Error Container',        token: 'error-container',        hex: '#b92902' },
];

const LIGHT_COLORS = [
  { name: 'Primary',                token: 'primary',                hex: '#5f8a0e' },
  { name: 'On-Primary',             token: 'on-primary',             hex: '#FFFFFF' },
  { name: 'Background', token: 'background', hex: '#F3F7E6' },
  { name: 'Surface', token: 'surface', hex: '#FAFDF2' },
  { name: 'Surface Container', token: 'surface-container', hex: '#E9EED8' },
  { name: 'Surface Container Low', token: 'surface-container-low', hex: '#F0F4E3' },
  { name: 'Surface Container High', token: 'surface-container-high', hex: '#DDE5C5' },
  { name: 'On-Surface',             token: 'on-surface',             hex: '#0A0A0A' },
  { name: 'On-Surface Variant',     token: 'on-surface-variant',     hex: '#555555' },
  { name: 'Outline',                token: 'outline',                hex: '#CCCCCC' },
  { name: 'Outline Variant',        token: 'outline-variant',        hex: '#BBBBBA' },
  { name: 'Error',                  token: 'error',                  hex: '#CC3300' },
  { name: 'Error Container',        token: 'error-container',        hex: '#FFE0D6' },
];

export default function ShowcasePage() {
  const [pinLen, setPinLen] = useState(3);
  const [bleState, setBleState] = useState<'idle'|'broadcasting'|'connected'>('idle');
  const [light, setLight] = useState(false);

  const colors = light ? LIGHT_COLORS : DARK_COLORS;

  return (
    <div className={`min-h-screen bg-background text-on-surface font-body pb-24 ${light ? 'light-theme' : ''}`}>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-outline/30 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
          <h1 className="font-headline font-bold text-lg uppercase tracking-tight">Design System</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLight(l => !l)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-label uppercase tracking-wider"
            style={light
              ? { borderColor: 'rgba(95,138,14,0.4)', background: 'rgba(95,138,14,0.08)', color: '#5f8a0e' }
              : { borderColor: 'rgba(143,195,34,0.3)', background: 'rgba(143,195,34,0.06)', color: '#8FC322' }}
          >
            <span className="material-symbols-outlined text-sm">{light ? 'light_mode' : 'dark_mode'}</span>
            {light ? 'Light' : 'Dark'}
          </button>
          <a href="/" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">← App</a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-16">

        {/* Colors */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">Color Palette</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            {light
              ? 'Light mode — deep green primary on light grey base.'
              : 'Dark mode — lime green primary (#8FC322) on pure black base.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {colors.map(c => (
              <div key={c.name} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/20">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 border border-outline/30"
                  style={{ background: `var(--c-${c.token})` }}
                />
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface">{c.name}</p>
                  <p className="font-mono text-[10px] text-on-surface-variant">{c.hex}</p>
                  <p className="font-mono text-[9px] text-outline-variant mt-0.5">--c-{c.token}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-6">Typography</h2>
          <div className="space-y-6 bg-surface-container rounded-xl p-6 border border-outline/20">
            <div>
              <SectionLabel>Headline — Space Grotesk</SectionLabel>
              <p className="font-headline font-bold text-4xl tracking-tighter text-on-surface">OldPhone Wallet</p>
              <p className="font-headline font-medium text-xl mt-1 text-on-surface">Account Detail</p>
            </div>
            <div>
              <SectionLabel>Body — Manrope</SectionLabel>
              <p className="font-body text-base leading-relaxed text-on-surface-variant">
                Transform your old phone into a secure hardware wallet. Private keys never touch the internet.
              </p>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant mt-2">
                Smaller body text for secondary information and descriptions.
              </p>
            </div>
            <div>
              <SectionLabel>Label — Space Grotesk</SectionLabel>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Air-Gapped Ready</p>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">BLE Standby • Encrypted</p>
            </div>
            <div>
              <SectionLabel>Mono</SectionLabel>
              <code className="font-mono text-sm text-primary tracking-wider">0x9858EfC4277a3b85bE6b5E0de6edA94</code>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-6">Buttons</h2>
          <div className="bg-surface-container rounded-xl p-6 border border-outline/20 space-y-3">
            <Button variant="primary" icon="arrow_forward">Primary — Create New Wallet</Button>
            <Button variant="secondary" icon="file_upload">Secondary — Import Wallet</Button>
            <Button variant="ghost" icon="add">Ghost — Add Account</Button>
            <Button variant="danger" icon="delete_forever">Danger — Reset Wallet</Button>
            <Button variant="outline-danger">Outline Danger — Reject</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth={false} className="flex-1">Reject</Button>
              <Button variant="primary" fullWidth={false} className="flex-[2]">Confirm &amp; Sign</Button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-6">Cards</h2>
          <div className="space-y-3">
            <Card>
              <SectionLabel>Default Card</SectionLabel>
              <p className="font-body text-sm text-on-surface-variant">Standard surface container with rounded corners.</p>
            </Card>
            <Card accent>
              <SectionLabel>Accent Card (left bar)</SectionLabel>
              <p className="font-body text-sm text-on-surface-variant">Used for primary accounts and key information. Features a 2px primary left border.</p>
            </Card>
            <Card onClick={() => {}}>
              <SectionLabel>Clickable Card</SectionLabel>
              <p className="font-body text-sm text-on-surface-variant">Interactive card with hover and press states.</p>
            </Card>
          </div>
        </section>

        {/* BLE Status */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-4">BLE Status</h2>
          <div className="flex gap-2 mb-4">
            {(['idle','broadcasting','connected'] as const).map(s => (
              <button key={s} onClick={() => setBleState(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-label uppercase tracking-widest border transition-colors ${bleState === s ? 'bg-primary text-on-primary border-primary' : 'border-outline text-on-surface-variant hover:border-primary/50'}`}>
                {s}
              </button>
            ))}
          </div>
          <BleStatus state={bleState} />
        </section>

        {/* PIN Dots */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-4">PIN Dots</h2>
          <div className="bg-surface-container rounded-xl p-6 border border-outline/20">
            <PinDots length={pinLen} />
            <PinDots length={pinLen} error />
            <div className="flex gap-2 mt-4 justify-center">
              <button onClick={() => setPinLen(Math.max(0, pinLen-1))} className="px-4 py-2 bg-surface-container-high rounded-lg font-label text-sm uppercase text-on-surface">−</button>
              <span className="px-4 py-2 font-mono text-sm text-on-surface">{pinLen} / 6</span>
              <button onClick={() => setPinLen(Math.min(6, pinLen+1))} className="px-4 py-2 bg-surface-container-high rounded-lg font-label text-sm uppercase text-on-surface">+</button>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-6">Icons (Material Symbols)</h2>
          <div className="grid grid-cols-4 gap-4">
            {['lock','shield','bluetooth','sensors','bluetooth_connected','key','verified_user','warning','check_circle','arrow_back','settings','content_copy','add','link','send','token'].map(icon => (
              <div key={icon} className="bg-surface-container rounded-xl p-4 flex flex-col items-center gap-2 border border-outline/20">
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                <span className="font-mono text-[8px] text-on-surface-variant text-center">{icon}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
