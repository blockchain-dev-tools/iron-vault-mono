'use client'
import { useState } from 'react'
import type { LogEntry } from './CommandBuilder'

interface ApduLogProps {
  entries: LogEntry[]
  onClear: () => void
}

function statusColor(status: string) {
  if (status === '9000') return 'text-green-400'
  return 'text-red-400'
}

export default function ApduLog({ entries, onClear }: ApduLogProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant flex-shrink-0">
        <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">TX/RX Log</span>
        <button
          onClick={onClear}
          className="text-xs text-on-surface-variant hover:text-on-surface font-label transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {entries.length === 0 && (
          <p className="text-on-surface-variant text-center py-8">No commands sent yet</p>
        )}
        {entries.map(entry => (
          <div
            key={entry.id}
            className="border-b border-outline-variant/50 px-4 py-2 cursor-pointer hover:bg-surface-container/50"
            onClick={() => toggle(entry.id)}
          >
            <div className="flex items-baseline gap-2">
              <span className={
                entry.dir === 'tx' ? 'text-primary' :
                entry.dir === 'rx' ? 'text-on-surface-variant' :
                'text-error'
              }>
                {entry.dir === 'tx' ? '→' : entry.dir === 'rx' ? '←' : '✗'}
              </span>
              <span className="text-on-surface truncate max-w-[200px]">{entry.hex || '—'}</span>
              {entry.label && <span className="text-on-surface-variant">{entry.label}</span>}
              {entry.status && (
                <span className={`ml-auto flex-shrink-0 ${statusColor(entry.status)}`}>
                  {entry.status}
                </span>
              )}
            </div>
            {expanded.has(entry.id) && entry.hex && (
              <pre className="mt-1 text-[10px] text-on-surface-variant whitespace-pre-wrap break-all pl-4">
                {entry.hex.match(/.{1,2}/g)?.join(' ')}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
