'use client'
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function ArticleToc() {
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
    <nav className="hidden xl:block w-52 flex-shrink-0 sticky top-6 self-start pl-6 pr-2 py-2">
      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">On this page</p>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? 12 : 0 }}>
            <a
              href={`#${item.id}`}
              className={`text-xs font-body transition-colors block py-0.5 ${
                active === item.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
