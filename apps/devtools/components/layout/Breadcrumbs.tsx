'use client'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/navigation'
import { NAV } from '@/lib/nav'

export default function Breadcrumbs() {
  const t = useTranslations('breadcrumbs')
  const pathname = usePathname()
  const section = NAV.find(s => s.items.some(i => i.href === pathname))
  const item = section?.items.find(i => i.href === pathname)
  if (!section || !item) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-on-surface-variant mb-5 font-body">
      <Link href="/docs/getting-started/introduction" className="hover:text-on-surface transition-colors">
        {t('docs')}
      </Link>
      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
      <span>{section.title}</span>
      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
      <span className="text-on-surface">{item.title}</span>
    </nav>
  )
}
