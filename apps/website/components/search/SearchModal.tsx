'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Fuse from 'fuse.js'

// ── Simple pub/sub for open signal from TopBar ────────────────────────────────
type Handler = () => void
const handlers: Handler[] = []
export function subscribeToOpen(h: Handler) {
  handlers.push(h)
  return () => {
    const idx = handlers.indexOf(h)
    if (idx !== -1) handlers.splice(idx, 1)
  }
}
export function openSearch() {
  handlers.forEach((h) => h())
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchEntry {
  title: string
  sectionTitle: string
  excerpt: string
  href: string
}

// Map href prefix to section label
function sectionLabel(href: string): string {
  const segment = href.split('/')[2] // /docs/<segment>/...
  switch (segment) {
    case 'getting-started': return 'Getting Started'
    case 'ble-integration': return 'BLE Integration'
    case 'apdu-protocol': return 'APDU Protocol'
    case 'crypto-reference': return 'Crypto Reference'
    case 'api-reference': return 'API Reference'
    default: return 'Docs'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [data, setData] = useState<SearchEntry[] | null>(null)
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isZh = pathname.startsWith('/zh')

  // Subscribe to open signal from TopBar
  useEffect(() => {
    return subscribeToOpen(() => setOpen(true))
  }, [])

  // CMD+K / Ctrl+K to open; Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Lazy-load search index on first open
  useEffect(() => {
    if (!open || data) return
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((d: SearchEntry[]) => {
        setData(d)
        fuseRef.current = new Fuse(d, {
          keys: ['title', 'sectionTitle', 'excerpt'],
          threshold: 0.3,
          includeScore: true,
        })
      })
      .catch(console.error)
  }, [open, data])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setActiveIdx(0)
    }
  }, [open])

  // Run search on query change
  useEffect(() => {
    if (!fuseRef.current || !query.trim()) {
      setResults([])
      setActiveIdx(0)
      return
    }
    const res = fuseRef.current.search(query).slice(0, 20).map((r) => r.item)
    setResults(res)
    setActiveIdx(0)
  }, [query])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  // Arrow key navigation + Enter
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        navigate(results[activeIdx].href)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, results, activeIdx, navigate])

  if (!open) return null

  // Group results by nav section
  const grouped: Record<string, SearchEntry[]> = {}
  for (const r of results) {
    const label = sectionLabel(r.href)
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(r)
  }

  const placeholder = isZh ? 'Searching English docs...' : 'Search docs...'
  const noResultsText = isZh ? '无结果' : 'No results'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-xl mx-4 bg-surface rounded-xl shadow-2xl border border-outline-variant overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant text-sm outline-none font-body"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-outline-variant text-xs text-on-surface-variant font-label">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto py-2">
            {!data && (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant font-body">
                Loading…
              </div>
            )}

            {data && query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant font-body">
                {noResultsText}
              </div>
            )}

            {data && !query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant font-body">
                {placeholder}
              </div>
            )}

            {Object.entries(grouped).map(([section, items]) => {
              return (
                <div key={section}>
                  <div className="px-4 py-1.5 text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                    {section}
                  </div>
                  {items.map((item) => {
                    const globalIdx = results.indexOf(item)
                    const isActive = globalIdx === activeIdx
                    return (
                      <button
                        key={`${item.href}-${item.sectionTitle}`}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                          isActive
                            ? 'bg-surface-container border-l-2 border-primary'
                            : 'border-l-2 border-transparent hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-label font-medium text-on-surface truncate">
                            {item.title}
                          </span>
                          {item.sectionTitle !== item.title && (
                            <>
                              <span className="text-on-surface-variant text-xs">›</span>
                              <span className="text-xs text-on-surface-variant truncate">
                                {item.sectionTitle}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2 font-body leading-relaxed">
                          {item.excerpt.slice(0, 120)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-outline-variant flex items-center gap-3 text-xs text-on-surface-variant font-label">
              <span><kbd className="px-1 py-0.5 rounded border border-outline-variant">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 rounded border border-outline-variant">↵</kbd> open</span>
              <span><kbd className="px-1 py-0.5 rounded border border-outline-variant">Esc</kbd> close</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
