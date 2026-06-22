'use client'
import { useState } from 'react'
import type { SignResponse } from '@/lib/wallet-commands'

interface TxResultProps {
  result: SignResponse | null
  onClear: () => void
}

export default function TxResult({ result, onClear }: TxResultProps) {
  const [copied, setCopied] = useState(false)

  if (!result) {
    return (
      <div className="p-4">
        <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-3">Signature Result</p>
        <p className="text-xs text-on-surface-variant/70 text-center py-8">
          Sign a transaction to see the result here.
        </p>
      </div>
    )
  }

  const r = result
  const isSuccess = r.statusWord === '9000'

  async function handleCopy() {
    await navigator.clipboard.writeText(r.signature)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Signature Result</span>
        <span className={`text-[10px] font-label px-2 py-0.5 rounded ${
          isSuccess ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
        }`}>
          {isSuccess ? 'Success' : `SW: ${r.statusWord}`}
        </span>
      </div>

      <div className="bg-surface-container rounded-lg border border-outline-variant p-3">
        <p className="font-label text-[11px] text-on-surface-variant mb-1.5">Signature</p>
        <p className="font-mono text-xs text-on-surface break-all leading-relaxed">{r.signature}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
