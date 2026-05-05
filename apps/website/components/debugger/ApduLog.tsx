'use client'
import { useState } from 'react'
import { decodeStatusWord, explainApdu } from '@iron-vault/apdu'
import type { LogEntry } from './Tier1ApduInput'

interface ApduLogProps {
  entries: LogEntry[]
  onClear: () => void
}

function statusColor(status: string) {
  if (status === '9000') return 'text-green-400'
  if (status === '6985') return 'text-orange-400'
  return 'text-red-400'
}

function entryTime(entry: LogEntry, index: number): string {
  return `${Math.floor(index * 0.3)}.${(index * 300) % 1000}`
}

export default function ApduLog({ entries, onClear }: ApduLogProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showParsed, setShowParsed] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleParsed = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowParsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant flex-shrink-0">
        <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">TX/RX Log</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant">{entries.length} entries</span>
          <button
            onClick={onClear}
            className="text-xs text-on-surface-variant hover:text-on-surface font-label transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {entries.length === 0 && (
          <p className="text-on-surface-variant text-center py-8">No commands sent yet</p>
        )}
        {entries.map((entry, idx) => {
          const isExpanded = expanded.has(entry.id)
          const isParsed = showParsed.has(entry.id)
          const swInfo = entry.status ? decodeStatusWord(entry.status) : null
          let parsed = null
          if (isParsed && entry.dir === 'tx' && entry.hex) {
            try { parsed = explainApdu(entry.hex) } catch {}
          }

          return (
            <div
              key={entry.id}
              className="border-b border-outline-variant/50 px-4 py-2 cursor-pointer hover:bg-surface-container/50"
              onClick={() => toggle(entry.id)}
            >
              <div className="flex items-baseline gap-2">
                <span className={`font-label text-[10px] text-on-surface-variant w-8 shrink-0`}>
                  {entryTime(entry, idx)}s
                </span>
                <span className={
                  entry.dir === 'tx' ? 'text-primary' :
                  entry.dir === 'rx' ? 'text-on-surface-variant' :
                  'text-error'
                }>
                  {entry.dir === 'tx' ? '→' : entry.dir === 'rx' ? '←' : '✗'}
                </span>
                <span className="text-on-surface truncate max-w-[160px]">{entry.hex || '—'}</span>
                {entry.label && (
                  <span className="text-on-surface-variant truncate max-w-[120px]">{entry.label}</span>
                )}
                {entry.status && (
                  <span className={`ml-auto flex-shrink-0 flex items-center gap-1 ${statusColor(entry.status)}`}>
                    {entry.status}
                    {swInfo && (
                      <span className="text-[9px] text-on-surface-variant font-normal hidden group-hover:inline">
                        {swInfo.name}
                      </span>
                    )}
                  </span>
                )}

                {/* Parse button for TX entries */}
                {entry.dir === 'tx' && entry.hex && (
                  <button
                    onClick={(e) => toggleParsed(entry.id, e)}
                    className={`text-[9px] px-1 py-0.5 rounded shrink-0 transition-colors ${
                      isParsed
                        ? 'bg-primary/15 text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Parse APDU fields"
                  >
                    {isParsed ? '▽' : '◎'}
                  </button>
                )}
              </div>

              {/* Expanded: status decode */}
              {isExpanded && entry.status && swInfo && (
                <div className="mt-1 pl-4 text-[10px] text-on-surface-variant space-y-0.5">
                  <div><span className="font-label">SW: </span>0x{swInfo.hex} — {swInfo.name}</div>
                  <div className="text-on-surface-variant/70">{swInfo.meaning}</div>
                </div>
              )}

              {/* Expanded: raw hex bytes */}
              {isExpanded && entry.hex && (
                <pre className="mt-1 text-[10px] text-on-surface-variant whitespace-pre-wrap break-all pl-4">
                  {entry.hex.match(/.{1,2}/g)?.join(' ')}
                </pre>
              )}

              {/* Parsed APDU fields (shown when ◎ is toggled) */}
              {isParsed && parsed && (
                <div className="mt-1 pl-4 text-[10px] border-l-2 border-primary/30">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="text-on-surface-variant w-12">CLA</td><td className="text-primary">{parsed.cla.hex}</td><td className="text-on-surface-variant/70">{parsed.cla.meaning}</td></tr>
                      <tr><td className="text-on-surface-variant">INS</td><td className="text-primary">{parsed.ins.hex}</td><td className="text-on-surface-variant/70">{parsed.ins.name}</td></tr>
                      <tr><td className="text-on-surface-variant">P1</td><td className="text-primary">{parsed.p1.hex}</td><td className="text-on-surface-variant/70">{parsed.p1.meaning}</td></tr>
                      <tr><td className="text-on-surface-variant">P2</td><td className="text-primary">{parsed.p2.hex}</td><td className="text-on-surface-variant/70">{parsed.p2.meaning}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
