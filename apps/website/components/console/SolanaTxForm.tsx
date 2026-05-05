'use client'
import { useState, useMemo } from 'react'
import { buildSolSignMessageApdu, type SolTxParams } from '@/lib/solana-tx-builder'
import type { ApduTransport } from '@/lib/transport'
import TxPreview from './TxPreview'
import TxResult from './TxResult'

interface SolanaTxFormProps {
  transport: ApduTransport
}

const DEFAULT_PARAMS: SolTxParams = {
  to: 'DdSVvDMdhWMLWxtmP5uvGvMKiYfYjhjXkndpe1QpNoTY',
  amount: '0.001',
}

export default function SolanaTxForm({ transport }: SolanaTxFormProps) {
  const [params, setParams] = useState<SolTxParams>(DEFAULT_PARAMS)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signResult, setSignResult] = useState<string | null>(null)

  const apduResult = useMemo(() => buildSolSignMessageApdu(params), [params])

  function update(key: keyof SolTxParams, value: string) {
    setParams(prev => ({ ...prev, [key]: value }))
    setError(null)
    setSignResult(null)
  }

  async function handleSign() {
    setSigning(true)
    setError(null)
    setSignResult(null)
    try {
      const resp = await transport.exchange(apduResult.apdu)
      if (resp.endsWith('6985')) {
        setError('Message signing rejected by user')
        return
      }
      if (!resp.endsWith('9000')) {
        setError(`APDU error: ${resp.slice(-4).toUpperCase()}`)
        return
      }
      const sigHex = resp.slice(0, -4)
      setSignResult(sigHex)
    } catch (e: any) {
      setError(e?.message ?? 'Signing failed')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h2 className="font-headline font-semibold text-on-surface text-lg">Solana Transaction</h2>

      <div className="space-y-1.5">
        <label className="font-label text-xs text-on-surface-variant">To Address (Base58)</label>
        <input
          value={params.to}
          onChange={e => update('to', e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
          placeholder="Base58 address..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-label text-xs text-on-surface-variant">Amount (SOL)</label>
        <input
          value={params.amount}
          onChange={e => update('amount', e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
          placeholder="0.001"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-label text-xs text-on-surface-variant">Memo (optional)</label>
        <input
          value={params.memo ?? ''}
          onChange={e => update('memo', e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
          placeholder="Transfer memo"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSign}
          disabled={signing}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {signing ? 'Signing...' : 'Sign Message ▶'}
        </button>
        <button
          onClick={() => setParams(DEFAULT_PARAMS)}
          className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Reset
        </button>
      </div>

      {/* APDU Preview */}
      <TxPreview apdu={apduResult.apdu} description={apduResult.description} />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500 font-label">
          {error}
        </div>
      )}

      {signResult && <TxResult signature={signResult} onClear={() => setSignResult(null)} />}
    </div>
  )
}
