'use client';
import { useNav } from '../../lib/nav';
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

export default function P08() {
  const { go } = useNav();
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
        </div>
        <div>
          <SectionLabel>Security</SectionLabel>
          <Row label="Change PIN" onClick={() => {}} />
          <Row label="Backup Seed Phrase" onClick={() => go('GenerateMnemonic')} />
          <Row label="Auto-lock" value="5 min" />
        </div>
        <div>
          <SectionLabel>Bluetooth</SectionLabel>
          <Row label="Device Name" value="Nano X ›" onClick={() => {}} />
        </div>
        <div>
          <SectionLabel>About</SectionLabel>
          <Row label="Version" value="0.1.0" />
          <Row label="Check for Updates" onClick={() => {}} />
        </div>
        <div className="flex-1" />
        <Button variant="danger" icon="delete_forever" onClick={() => go('Welcome')}>
          Reset Wallet
        </Button>
      </div>
    </div>
  );
}
