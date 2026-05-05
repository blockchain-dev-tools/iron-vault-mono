'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function TocScrollSpy() {
  const t = useTranslations('toc')
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const headings = document.querySelectorAll('.prose h2, .prose h3')
    const tocItems: TocItem[] = Array.from(headings).map(h => ({
      id: h.id,
      text: h.textContent ?? '',
      level: h.tagName === 'H2' ? 2 : 3,
    }))
    setItems(tocItems)

    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-20% 0% -60% 0%' }
    )
    headings.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (!items.length) return null

  return (
    <aside className="w-52 py-8 pr-4">
      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 px-1">
        {t('onThisPage')}
      </p>
      <ul className="space-y-0.5">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              style={{ paddingLeft: item.level === 3 ? '1rem' : '0.25rem' }}
              className={`block text-xs font-body py-1 rounded transition-colors border-l-2 ${
                active === item.id
                  ? 'text-primary font-medium border-primary'
                  : 'text-on-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
