'use client'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/lib/navigation'
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
    <header className="h-14 flex items-center justify-between px-6 shadow-lg bg-surface flex-shrink-0 relative z-10">
      <div className="flex items-center gap-2">
        <svg width={22} height={24} viewBox="0 0 80 92" className="text-primary" fill="currentColor">
          <path fillRule="evenodd" d="M40 0 80 18v34c0 20-20 36-40 40C20 88 0 72 0 52V18L40 0ZM29 34h22q4 0 4 5v18q0 5-4 5H29q-4 0-4-5V39q0-5 4-5Zm1 0q0-9 10-9t10 9Zm3 0q0-5 7-5t7 5Z" />
          <circle cx="40" cy="46" r="4" />
          <rect x="39" y="50" width="2" height="7" rx="1" />
        </svg>
        <span className="font-headline font-bold text-on-surface">IRON Vault</span>
        <span className="font-label text-xs text-on-surface-variant ml-1">DevTools</span>
        <div className="w-px h-5 bg-outline-variant mx-3" />
        <Link
          href="/console"
          className={`font-label text-sm transition-colors ${
            pathname.startsWith('/console')
              ? 'text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Console
        </Link>
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
