'use client'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/lib/navigation'
import ThemeToggle from './ThemeToggle'
import { openSearch } from '@/components/search/SearchModal'

export default function TopBar() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale() {
    const next = locale === 'en' ? 'zh' : 'en'
    router.replace(pathname, { locale: next })
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-outline-variant bg-surface flex-shrink-0">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          shield
        </span>
        <span className="font-headline font-bold text-on-surface">OldPhone Wallet</span>
        <span className="font-label text-xs text-on-surface-variant ml-1">DevTools</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-label text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant"
          aria-label="Search docs (cmdk)"
        >
          <span className="material-symbols-outlined text-base leading-none">search</span>
          <span className="hidden sm:inline text-xs">{t('search.placeholder')}</span>
          <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-container text-xs font-label border border-outline-variant ml-1">
            K
          </kbd>
        </button>

        {/* Language toggle */}
        <button
          onClick={switchLocale}
          className="flex items-center px-2.5 py-1 rounded-md text-xs font-label font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant"
        >
          {t('lang.toggle')}
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* GitHub */}
        <a
          href="https://github.com/your-org/ble-vault-mono"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-sm font-label transition-colors ml-2"
        >
          <span className="material-symbols-outlined text-base">code</span>
          {t('topBar.github')}
        </a>
      </div>
    </header>
  )
}
