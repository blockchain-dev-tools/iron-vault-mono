'use client'
import { useState } from 'react'
import { explainApdu } from '@iron-vault/apdu'

interface TxPreviewProps {
  apdu: string
  description: string
}

export default function TxPreview({ apdu, description }: TxPreviewProps) {
  const [showFields, setShowFields] = useState(false)

  const breakdown = showFields ? (() => {
    try { return explainApdu(apdu) } catch { return null }
  })() : null

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden">
      <button
        onClick={() => setShowFields(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container/50 transition-colors"
      >
        <div className="text-left">
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">APDU Preview</span>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">{description}</p>
        </div>
        <span className="text-on-surface-variant text-sm">{showFields ? '▾' : '▸'}</span>
      </button>

      <div className="px-4 pb-3">
        <code className="block text-xs font-mono text-primary bg-surface-container rounded px-2 py-1.5 break-all">
          {apdu ? apdu.match(/.{1,2}/g)?.join(' ') : '—'}
        </code>
      </div>

      {showFields && breakdown && (
        <div className="px-4 pb-3 border-t border-outline-variant/50 pt-2">
          <table className="w-full text-xs font-mono">
            <tbody className="divide-y divide-outline-variant/30">
              <tr><td className="text-on-surface-variant py-0.5 w-12">CLA</td><td className="text-primary">{breakdown.cla.hex}</td><td className="text-on-surface-variant/70">{breakdown.cla.meaning}</td></tr>
              <tr><td className="text-on-surface-variant py-0.5">INS</td><td className="text-primary">{breakdown.ins.hex}</td><td className="text-on-surface-variant/70">{breakdown.ins.name}</td></tr>
              <tr><td className="text-on-surface-variant py-0.5">P1</td><td className="text-primary">{breakdown.p1.hex}</td><td className="text-on-surface-variant/70">{breakdown.p1.meaning}</td></tr>
              <tr><td className="text-on-surface-variant py-0.5">P2</td><td className="text-primary">{breakdown.p2.hex}</td><td className="text-on-surface-variant/70">{breakdown.p2.meaning}</td></tr>
              <tr><td className="text-on-surface-variant py-0.5">Lc</td><td className="text-primary">{breakdown.lc.hex}</td><td className="text-on-surface-variant/70">{breakdown.lc.value} bytes</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
