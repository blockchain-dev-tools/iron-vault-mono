'use client'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter, Link } from '@/lib/navigation'
import ThemeToggle from './ThemeToggle'

interface WalletLayoutProps {
  nav: React.ReactNode
  main: React.ReactNode
  /** If provided, renders a right panel (e.g. for TxResult, logs) */
  sidebar?: React.ReactNode
  /** Device connection status bar in the header */
  deviceStatus?: React.ReactNode
}

const WALLET_NAV_ITEMS = [
  { key: 'device',    href: '/wallet',                 icon: 'settings_ethernet' },
] as const

export function WalletTopBar({ deviceStatus }: { deviceStatus?: React.ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale() {
    const next = locale === 'en' ? 'zh' : 'en'
    router.replace(pathname, { locale: next })
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 shadow-lg bg-surface flex-shrink-0 relative z-10">
      <div className="flex items-center gap-3">
        <svg width={22} height={24} viewBox="0 0 80 92" className="text-primary" fill="currentColor">
          <path fillRule="evenodd" d="M40 0 80 18v34c0 20-20 36-40 40C20 88 0 72 0 52V18L40 0ZM29 34h22q4 0 4 5v18q0 5-4 5H29q-4 0-4-5V39q0-5 4-5Zm1 0q0-9 10-9t10 9Zm3 0q0-5 7-5t7 5Z" />
          <circle cx="40" cy="46" r="4" />
          <rect x="39" y="50" width="2" height="7" rx="1" />
        </svg>
        <span className="font-headline font-bold text-on-surface">IRON Vault</span>
        <span className="font-label text-xs text-primary font-semibold ml-1">Wallet</span>
        <div className="w-px h-5 bg-outline-variant mx-3" />
        <Link
          href="/console"
          className="font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Console
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {deviceStatus}

        {/* Language toggle */}
        <button
          onClick={switchLocale}
          className="flex items-center px-2.5 py-1 rounded-md text-xs font-label font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant"
        >
          {t('lang.toggle')}
        </button>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
}

export function WalletNav() {
  const pathname = usePathname()

  return (
    <nav className="w-48 flex-shrink-0 h-full overflow-y-auto border-r border-outline-variant/20 bg-surface">
      <div className="px-3 py-6 space-y-1">
        {WALLET_NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-label transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-base leading-none">{item.icon}</span>
              {item.key === 'device' && 'Device'}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function WalletLayout({ nav, main, sidebar, deviceStatus }: WalletLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <WalletTopBar deviceStatus={deviceStatus} />
      <div className="flex flex-1 overflow-hidden">
        {nav}
        <main className="flex-1 overflow-y-auto">
          {main}
        </main>
        {sidebar && (
          <aside className="w-[360px] flex-shrink-0 border-l border-outline-variant overflow-y-auto">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
