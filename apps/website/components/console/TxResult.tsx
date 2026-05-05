'use client'
import { useState } from 'react'
import { broadcastEthTx } from '@/lib/rpc-broadcast'

interface TxResultProps {
  signature: string
  onClear: () => void
}

export default function TxResult({ signature, onClear }: TxResultProps) {
  const [broadcasting, setBroadcasting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const v = signature.length >= 2 ? signature.slice(0, 2) : '??'
  const r = signature.length >= 128 ? signature.slice(2, 66) : signature
  const s = signature.length >= 130 ? signature.slice(66, 130) : ''

  async function handleBroadcast() {
    setBroadcasting(true)
    setError(null)
    try {
      const result = await broadcastEthTx(signature)
      setTxHash(result.txHash)
    } catch (e: any) {
      setError(e?.message ?? 'Broadcast failed')
    } finally {
      setBroadcasting(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(signature)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="border border-green-500/30 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-green-500/10">
        <span className="font-label text-xs text-green-500 font-semibold">✓ Signature</span>
        <button onClick={onClear} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
          Clear
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* v/r/s */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] text-on-surface-variant w-4">v</span>
            <code className="text-xs font-mono text-on-surface">{v}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] text-on-surface-variant w-4">r</span>
            <code className="text-xs font-mono text-on-surface break-all">{r}</code>
          </div>
          {s && (
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] text-on-surface-variant w-4">s</span>
              <code className="text-xs font-mono text-on-surface break-all">{s}</code>
            </div>
          )}
        </div>

        {/* Full hex */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-label text-[10px] text-on-surface-variant uppercase">Full Hex</span>
            <button
              onClick={handleCopy}
              className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code className="block text-[10px] font-mono text-on-surface bg-surface-container rounded p-2 break-all max-h-20 overflow-y-auto">
            {signature}
          </code>
        </div>

        {/* Broadcast */}
        <button
          onClick={handleBroadcast}
          disabled={broadcasting || !!txHash}
          className="w-full px-4 py-2 rounded-lg text-sm font-label font-semibold bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-40 transition-colors"
        >
          {broadcasting ? 'Broadcasting...' : txHash ? '✅ Broadcast' : 'Broadcast to Network'}
        </button>

        {txHash && (
          <div className="text-xs text-on-surface-variant break-all">
            TxHash: {txHash}
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-500/10 rounded p-2">{error}</div>
        )}
      </div>
    </div>
  )
}
