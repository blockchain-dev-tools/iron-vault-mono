'use client';
import { useNav } from '../../lib/nav';
import { useApp, type LocaleMode, type ThemeMode } from '../../lib/app-context';
import { clearWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import SegmentedControl, { type SegmentOption } from '../ui/SegmentedControl';
import Dropdown, { type DropdownOption } from '../ui/Dropdown';
import BottomNav from '../ui/BottomNav';

interface RowProps { label: string; value?: string; onClick?: () => void; last?: boolean; }
function Row({ label, value, onClick, last }: RowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center py-4 ${last ? '' : 'border-b'} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderColor: 'var(--c-outline-variant)' }}
    >
      <span className="font-body text-sm" style={{ color: 'var(--c-on-surface)' }}>{label}</span>
      {(value !== undefined || onClick) && (
        <span className="font-body text-sm" style={{ color: 'var(--c-on-surface-variant)' }}>
          {value ?? '›'}
        </span>
      )}
    </div>
  );
}

const THEME_OPTIONS: SegmentOption<ThemeMode>[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark' },
];

const LOCALE_OPTIONS: DropdownOption<LocaleMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'en',     label: 'English' },
  { value: 'zh',     label: '中文' },
  { value: 'ja',     label: '日本語' },
  { value: 'ko',     label: '한국어' },
];

export default function SettingsScreen() {
  const { go, reset: navReset } = useNav();
  const { storage, setAccounts, setGeneratedWords, themeMode, setThemeMode, localeMode, setLocaleMode } = useApp();

  const handleResetWallet = async () => {
    if (!confirm('Reset wallet? All data will be permanently deleted.')) return;
    await clearWallet(storage);
    setAccounts({ eth: [], sol: [] });
    setGeneratedWords([]);
    navReset('Welcome');
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--c-background)' }}>
      <div className="flex-1 px-5 pt-5 flex flex-col gap-3 overflow-y-auto pb-24">
        <p className="font-headline font-bold text-[28px] mb-3" style={{ color: 'var(--c-on-surface)' }}>Settings</p>

        <SectionLabel>Appearance</SectionLabel>
        <SegmentedControl<ThemeMode>
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={setThemeMode}
        />

        <SectionLabel>Language</SectionLabel>
        <Dropdown<LocaleMode>
          value={localeMode}
          options={LOCALE_OPTIONS}
          onChange={setLocaleMode}
        />

        <SectionLabel>Security</SectionLabel>
        <div className="rounded-2xl overflow-hidden px-4" style={{ background: 'var(--c-surface-container)' }}>
          <Row label="Change PIN" onClick={() => go('SetPin')} />
          <Row label="Backup Seed Phrase" onClick={() => go('BackupSeed')} />
          <Row label="Auto-lock" value="5 min" last />
        </div>

        <SectionLabel>Bluetooth</SectionLabel>
        <div className="rounded-2xl overflow-hidden px-4" style={{ background: 'var(--c-surface-container)' }}>
          <Row label="Device Name" value="Nano X" last />
        </div>

        <SectionLabel>About</SectionLabel>
        <div className="rounded-2xl overflow-hidden px-4" style={{ background: 'var(--c-surface-container)' }}>
          <Row label="Version" value="0.1.0" last />
        </div>

        <div className="flex-1" />
        <Button variant="danger" icon="delete_forever" onClick={handleResetWallet}>
          Reset Wallet
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
