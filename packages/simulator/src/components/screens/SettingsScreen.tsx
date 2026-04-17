'use client';
import { useNav } from '../../lib/nav';
import { useApp, type LocaleMode } from '../../lib/app-context';
import { clearWallet } from '@iron-vault/wallet';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import ThemeToggle from '../ui/ThemeToggle';

interface RowProps { label: string; value?: string; onClick?: () => void; }
function Row({ label, value, onClick }: RowProps) {
  return (
    <div onClick={onClick} className={`flex justify-between items-center py-4 border-b border-outline/20 ${onClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}>
      <span className="font-body text-sm text-on-surface">{label}</span>
      <span className="font-body text-sm text-on-surface-variant">{value ?? '›'}</span>
    </div>
  );
}

const LOCALE_OPTS = [
  { id: 'system', label: 'Auto' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
];

export default function SettingsScreen() {
  const { go, reset: navReset } = useNav();
  const { storage, setAccounts, setGeneratedWords, localeMode, setLocaleMode } = useApp();

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
      <div className="flex-1 px-6 pt-6 flex flex-col gap-6">
        <div>
          <SectionLabel>Appearance</SectionLabel>
          <div className="flex justify-between items-center py-4 border-b border-outline/20">
            <span className="font-body text-sm text-on-surface">Theme</span>
            <ThemeToggle showLabel />
          </div>
          <div className="py-4 border-b border-outline/20">
            <span className="font-body text-sm text-on-surface block mb-2">Language</span>
            <div className="flex gap-2 flex-wrap">
              {LOCALE_OPTS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setLocaleMode(id as LocaleMode)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
                  style={{
                    borderColor: localeMode === id ? 'var(--c-primary)' : 'var(--c-outline-variant)',
                    color: localeMode === id ? 'var(--c-primary)' : 'var(--c-on-surface-variant)',
                    background: localeMode === id ? 'var(--c-primary-container)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <SectionLabel>Security</SectionLabel>
          <Row label="Change PIN" onClick={() => go('SetPin')} />
          <Row label="Backup Seed Phrase" onClick={() => go('BackupSeed')} />
          <Row label="Auto-lock" value="5 min" />
        </div>
        <div>
          <SectionLabel>Bluetooth</SectionLabel>
          <Row label="Device Name" value="Nano X ›" onClick={() => {}} />
        </div>
        <div>
          <SectionLabel>About</SectionLabel>
          <Row label="Version" value="0.1.0" />
        </div>
        <div className="flex-1" />
        <Button variant="danger" icon="delete_forever" onClick={handleResetWallet}>
          Reset Wallet
        </Button>
      </div>
    </div>
  );
}
