'use client'
import { useEffect, useState } from 'react'
import { explainApdu, type ApduFieldBreakdown } from '@iron-vault/apdu'

interface Tier1FieldTableProps {
  hex: string
}

export default function Tier1FieldTable({ hex }: Tier1FieldTableProps) {
  const [breakdown, setBreakdown] = useState<ApduFieldBreakdown | null>(null)

  useEffect(() => {
    if (!hex || hex.replace(/\s+/g, '').length < 4) {
      setBreakdown(null)
      return
    }
    try {
      setBreakdown(explainApdu(hex))
    } catch {
      setBreakdown(null)
    }
  }, [hex])

  if (!breakdown) return null

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden text-xs font-mono">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-container text-on-surface-variant font-label text-[10px] uppercase tracking-wider">
            <th className="text-left px-3 py-1.5 w-12">Field</th>
            <th className="text-left px-3 py-1.5 w-20">Hex</th>
            <th className="text-left px-3 py-1.5">Meaning</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          <Row field="CLA" hex={breakdown.cla.hex} meaning={breakdown.cla.meaning} />
          <Row field="INS" hex={breakdown.ins.hex} meaning={`${breakdown.ins.name} — ${breakdown.ins.meaning}`} />
          <Row field="P1" hex={breakdown.p1.hex} meaning={breakdown.p1.meaning} />
          <Row field="P2" hex={breakdown.p2.hex} meaning={breakdown.p2.meaning} />
          <Row field="Lc" hex={breakdown.lc.hex} meaning={`Data length: ${breakdown.lc.value} bytes`} />
          <Row
            field="Data"
            hex={breakdown.data.hex.length > 40 ? breakdown.data.hex.slice(0, 40) + '…' : breakdown.data.hex}
            meaning={breakdown.data.description}
          />
        </tbody>
      </table>
      {breakdown.matchedPreset && (
        <div className="px-3 py-1.5 bg-primary/5 border-t border-outline-variant/50 text-on-surface-variant">
          {breakdown.matchedPreset.description}
        </div>
      )}
    </div>
  )
}

function Row({ field, hex, meaning }: { field: string; hex: string; meaning: string }) {
  return (
    <tr className="hover:bg-surface-container/50">
      <td className="px-3 py-1.5 font-label font-semibold text-on-surface">{field}</td>
      <td className="px-3 py-1.5 text-primary">{hex}</td>
      <td className="px-3 py-1.5 text-on-surface-variant">{meaning}</td>
    </tr>
  )
}
