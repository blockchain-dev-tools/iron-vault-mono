'use client';
import { useNav } from '../../lib/nav';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';

export default function P01() {
  const { go } = useNav();
  return (
    <div className="flex flex-col min-h-screen px-6 pt-20 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-white/3 blur-[100px] rounded-full" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-14 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
        {/* Logo */}
        <div className="mb-12 relative">
          <div className="w-32 h-32 rounded-3xl bg-surface flex items-center justify-center border border-outline/40 group hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-7xl text-primary filled" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8">
            <div className="absolute w-full h-full bg-primary/20 rounded-full" style={{ animation: 'ping 2s ease-in-out infinite' }} />
            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
        </div>

        <div className="space-y-4 mb-16">
          <h1 className="font-headline text-5xl font-bold tracking-tighter">
            OldPhone <span className="text-primary neon-glow">Wallet</span>
          </h1>
          <p className="text-on-surface-variant font-body text-base max-w-[260px] mx-auto leading-relaxed">
            Transform your old phone into a secure{' '}
            <span className="text-on-surface font-semibold underline decoration-primary/40">hardware wallet</span>.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button variant="primary" icon="arrow_forward" onClick={() => go('GenerateMnemonic')}>
            Create New Wallet
          </Button>
          <Button variant="secondary" icon="file_upload" onClick={() => go('ImportMnemonic')}>
            Import Existing Wallet
          </Button>
        </div>

        {/* Security card */}
        <div className="mt-10 p-4 bg-surface/60 backdrop-blur rounded-xl w-full flex items-center gap-4 border border-outline/20">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">verified_user</span>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold font-label uppercase tracking-[0.2em] text-primary">Air-Gapped Ready</p>
            <p className="text-sm text-on-surface-variant font-body">Private keys never touch the internet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
