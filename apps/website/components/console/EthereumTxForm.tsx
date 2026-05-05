'use client'
import { useState, useMemo } from 'react'
import { buildEthSignTxApdu, type EthTxParams } from '@/lib/ethereum-tx-builder'
import type { ApduTransport } from '@/lib/transport'
import TxPreview from './TxPreview'
import TxResult from './TxResult'

interface EthereumTxFormProps {
  transport: ApduTransport
}

const DEFAULT_PARAMS: EthTxParams = {
  to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  value: '0x38d7ea4c68000', // 0.001 ETH
  gasLimit: '0x5208',
  maxPriorityFeePerGas: '0x59682f00',
  maxFeePerGas: '0x59682f00',
  nonce: '0x0',
  data: '0x',
  chainId: 1,
}

export default function EthereumTxForm({ transport }: EthereumTxFormProps) {
  const [params, setParams] = useState<EthTxParams>(DEFAULT_PARAMS)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signResult, setSignResult] = useState<string | null>(null)

  const apduResult = useMemo(() => buildEthSignTxApdu(params), [params])

  function update(key: keyof EthTxParams, value: string | number) {
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
        setError('Transaction rejected by user')
        return
      }
      if (!resp.endsWith('9000')) {
        setError(`APDU error: ${resp.slice(-4).toUpperCase()}`)
        return
      }
      // Response format: v(1) + r(32) + s(32) — strip status word
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
      <h2 className="font-headline font-semibold text-on-surface text-lg">Ethereum Transaction</h2>

      {/* To */}
      <Field label="To Address">
        <input
          value={params.to}
          onChange={e => update('to', e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
          placeholder="0x..."
        />
      </Field>

      {/* Value */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Value (wei hex)">
          <input
            value={params.value}
            onChange={e => update('value', e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            placeholder="0x..."
          />
        </Field>
        <Field label="Nonce (hex)">
          <input
            value={params.nonce}
            onChange={e => update('nonce', e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            placeholder="0x0"
          />
        </Field>
      </div>

      {/* Gas */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Gas Limit (hex)">
          <input
            value={params.gasLimit}
            onChange={e => update('gasLimit', e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            placeholder="0x5208"
          />
        </Field>
        <Field label="Max Priority (hex)">
          <input
            value={params.maxPriorityFeePerGas ?? ''}
            onChange={e => update('maxPriorityFeePerGas', e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            placeholder="0x..."
          />
        </Field>
        <Field label="Max Fee (hex)">
          <input
            value={params.maxFeePerGas ?? ''}
            onChange={e => update('maxFeePerGas', e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            placeholder="0x..."
          />
        </Field>
      </div>

      {/* Data */}
      <Field label="Data (hex, optional)">
        <input
          value={params.data ?? '0x'}
          onChange={e => update('data', e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
          placeholder="0x"
        />
      </Field>

      {/* Chain ID */}
      <Field label="Chain ID">
        <input
          value={params.chainId}
          onChange={e => update('chainId', parseInt(e.target.value) || 1)}
          type="number"
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSign}
          disabled={signing}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {signing ? 'Signing...' : 'Sign Transaction ▶'}
        </button>
        <button
          onClick={() => setParams(DEFAULT_PARAMS)}
          className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500 font-label">
          {error}
        </div>
      )}

      {/* Result */}
      {signResult && <TxResult signature={signResult} onClear={() => setSignResult(null)} />}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-label text-xs text-on-surface-variant">{label}</label>
      {children}
    </div>
  )
}
