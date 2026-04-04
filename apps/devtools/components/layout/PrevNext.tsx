'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'
import { flatNavItems } from '@/lib/nav'

interface Props {
  slug: string[]
}

export default function PrevNext({ slug }: Props) {
  const t = useTranslations('prevNext')
  const items = flatNavItems()
  const href = '/docs/' + slug.join('/')
  const idx = items.findIndex(i => i.href === href)
  const prev = idx > 0 ? items[idx - 1] : null
  const next = idx < items.length - 1 ? items[idx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="flex items-center justify-between mt-12 pt-6 border-t border-outline-variant">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">{t('previous')}</div>
            <div className="font-medium font-label">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors text-right"
        >
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">{t('next')}</div>
            <div className="font-medium font-label">{next.title}</div>
          </div>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
