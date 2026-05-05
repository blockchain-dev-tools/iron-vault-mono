'use client'
import { useMemo, useState } from 'react'
import { frameAPDU, describeFrames, type BleFrameDescription } from '@iron-vault/apdu'
import { hexToBytes } from '@iron-vault/apdu'

interface Tier1BleFramesProps {
  hex: string
}

export default function Tier1BleFrames({ hex }: Tier1BleFramesProps) {
  const cleaned = useMemo(() => hex.replace(/\s+/g, ''), [hex])
  const [showRaw, setShowRaw] = useState<Set<number>>(new Set())

  const frames = useMemo(() => {
    if (!cleaned || cleaned.length < 2) return null
    try {
      const bytes = hexToBytes(cleaned)
      if (bytes.length === 0) return null
      const packets = frameAPDU(bytes)
      return describeFrames(packets)
    } catch {
      return null
    }
  }, [cleaned])

  if (!frames) return null

  const totalBytes = cleaned.length / 2
  const totalPackets = frames.length
  const headerOverhead = 7 + (totalPackets - 1) * 5

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden text-xs font-mono">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-surface-container text-on-surface-variant border-b border-outline-variant">
        <span>{totalPackets} packet{totalPackets > 1 ? 's' : ''}</span>
        <span>{totalBytes} B APDU</span>
        <span>{headerOverhead} B overhead</span>
        <span className="text-primary">{totalBytes + headerOverhead} B on air</span>
      </div>

      <div className="divide-y divide-outline-variant/50">
        {frames.map((frame, i) => (
          <div key={i}>
            {/* Frame header */}
            <div
              className="flex items-center gap-3 px-3 py-1.5 cursor-pointer hover:bg-surface-container/50"
              onClick={() => setShowRaw(prev => {
                const next = new Set(prev)
                next.has(i) ? next.delete(i) : next.add(i)
                return next
              })}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${frame.isFirst ? 'bg-primary' : 'bg-on-surface-variant'}`} />
              <span className="font-label font-semibold text-on-surface w-16">
                Frame {frame.seq}
              </span>
              <span className="text-on-surface-variant w-16">
                {frame.isFirst ? 'First' : 'Cont.'}
              </span>
              <span className="text-on-surface-variant">
                seq={frame.seq}
              </span>
              <span className="text-on-surface-variant ml-auto">
                {frame.payloadBytes} B data
              </span>
              <span className="text-on-surface-variant">
                header={frame.isFirst ? '7B' : '5B'}
              </span>
            </div>

            {/* Raw hex (collapsible) */}
            {showRaw.has(i) && (
              <div className="px-3 pb-2 space-y-1">
                {/* Header annotation */}
                <div className="flex gap-0.5 text-[10px] leading-relaxed text-on-surface-variant">
                  <span className="text-primary">{frame.header.channel}</span>
                  <span className="text-green-600">{frame.header.tag.toString(16).padStart(2, '0')}</span>
                  <span className="text-amber-600">{frame.header.seq.toString(16).padStart(4, '0')}</span>
                  {frame.isFirst && <span className="text-purple-600">{(frame.header.totalLen ?? 0).toString(16).padStart(4, '0')}</span>}
                </div>
                {/* Raw hex */}
                <code className="text-[10px] text-on-surface break-all">
                  {(() => {
                    const bytes = hexToBytes(hex.replace(/\s+/g, ''))
                    const packets = frameAPDU(bytes)
                    const raw = packets[i]
                    return Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(' ')
                  })()}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
