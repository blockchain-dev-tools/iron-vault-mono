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
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-background/90 backdrop-blur-xl border-t border-outline/30">
      {ITEMS.map((item) => {
        const active = current === item.screen && !item.disabled;
        return (
          <button
            key={item.label}
            onClick={() => !item.disabled && go(item.screen)}
            disabled={item.disabled}
            className={`flex flex-col items-center justify-center p-3 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default ${
              active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined ${active ? 'filled' : ''}`}
              style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
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
