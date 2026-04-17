'use client';
import { useNav } from '../../lib/nav';
import { useApp, type LocaleMode, type ThemeMode } from '../../lib/app-context';
import { clearWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import SegmentedControl, { type SegmentOption } from '../ui/SegmentedControl';
import Dropdown, { type DropdownOption } from '../ui/Dropdown';

interface RowProps { label: string; value?: string; onClick?: () => void; last?: boolean; }
function Row({ label, value, onClick, last }: RowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center py-4 ${last ? '' : 'border-b border-outline/20'} ${onClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
    >
      <span className="font-body text-sm text-on-surface">{label}</span>
      <span className="font-body text-sm text-on-surface-variant">{value ?? '›'}</span>
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
    <div className="flex flex-col min-h-full pt-16 pb-8">
      <TopBar title="Settings" onBack={() => go('Vault')} />
      <div className="flex-1 px-6 pt-6 flex flex-col gap-6 overflow-y-auto">
        <div className="space-y-3">
          <SectionLabel>Appearance</SectionLabel>
          <SegmentedControl<ThemeMode>
            options={THEME_OPTIONS}
            value={themeMode}
            onChange={setThemeMode}
          />
        </div>

        <div className="space-y-3">
          <SectionLabel>Language</SectionLabel>
          <Dropdown<LocaleMode>
            value={localeMode}
            options={LOCALE_OPTIONS}
            onChange={setLocaleMode}
          />
        </div>

        <div>
          <SectionLabel>Security</SectionLabel>
          <Row label="Change PIN" onClick={() => go('SetPin')} />
          <Row label="Backup Seed Phrase" onClick={() => go('BackupSeed')} />
          <Row label="Auto-lock" value="5 min" last />
        </div>

        <div>
          <SectionLabel>Bluetooth</SectionLabel>
          <Row label="Device Name" value="Nano X" last />
        </div>

        <div>
          <SectionLabel>About</SectionLabel>
          <Row label="Version" value="0.1.0" last />
        </div>

        <div className="flex-1" />
        <Button variant="danger" icon="delete_forever" onClick={handleResetWallet}>
          Reset Wallet
        </Button>
      </div>
    </div>
  );
}
