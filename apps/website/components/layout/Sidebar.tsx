'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/navigation'
import { NAV } from '@/lib/nav'

const STORAGE_KEY = 'sidebar-open-sections'

export default function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NAV.forEach(s => { initial[s.titleKey] = true })
    return initial
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setOpenSections(JSON.parse(saved))
    } catch {}
  }, [])

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <nav className="w-60 flex-shrink-0 h-full overflow-y-auto border-r border-outline-variant bg-surface">
      <div className="px-3 py-6">
        {NAV.map(section => {
          const isOpen = openSections[section.titleKey] ?? true
          return (
            <div key={section.titleKey} className="mb-1">
              <button
                onClick={() => toggleSection(section.titleKey)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-left group"
              >
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold group-hover:text-on-surface transition-colors">
                  {t(`sections.${section.titleKey}`)}
                </span>
                <span
                  className={`material-symbols-outlined text-[14px] text-on-surface-variant transition-transform duration-200 ${
                    isOpen ? '' : '-rotate-90'
                  }`}
                >
                  expand_more
                </span>
              </button>

              {isOpen && (
                <ul className="mt-0.5 space-y-0.5 pb-2">
                  {section.items.map(item => {
                    const active = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-body transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
