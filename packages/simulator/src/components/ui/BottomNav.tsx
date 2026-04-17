'use client';
import { useNav, ScreenId } from '../../lib/nav';

interface NavItem {
  icon: string;
  label: string;
  screen: ScreenId;
  disabled?: boolean;
}

const ITEMS: NavItem[] = [
  { icon: 'account_balance_wallet', label: 'Wallets',  screen: 'Vault' },
  { icon: 'settings',               label: 'Settings', screen: 'Settings' },
];

export default function BottomNav() {
  const { current, go } = useNav();
  return (
    <nav
      className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 backdrop-blur-xl border-t"
      style={{ background: 'var(--c-background)', borderColor: 'var(--c-outline-variant)' }}
    >
      {ITEMS.map((item) => {
        const active = current === item.screen && !item.disabled;
        return (
          <button
            key={item.label}
            onClick={() => !item.disabled && go(item.screen)}
            disabled={item.disabled}
            className="flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default"
            style={{
              background: active ? 'var(--c-primary-container)' : 'transparent',
              color: active ? 'var(--c-primary)' : 'var(--c-on-surface-variant)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="font-label text-[10px] uppercase tracking-widest mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
