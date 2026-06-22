'use client'
import { useState, useCallback } from 'react'
import { buildEthSignTxApdu, type EthTxParams } from '@/lib/ethereum-tx-builder'
import { buildSolSignMessageApdu, type SolTxParams } from '@/lib/solana-tx-builder'
import {
  signEthTransaction,
  signSolMessage,
  parseSignResponse,
  type SignResponse,
  DEFAULT_PATHS,
} from '@/lib/wallet-commands'

export type ChainId = 'ethereum' | 'solana'

interface TxBuilderProps {
  send: (hex: string) => Promise<string>
  onResult: (result: SignResponse) => void
}

function EthForm({ send, onResult }: { send: (hex: string) => Promise<string>; onResult: (r: SignResponse) => void }) {
  const [to, setTo] = useState('')
  const [value, setValue] = useState('')
  const [gasLimit, setGasLimit] = useState('21000')
  const [nonce, setNonce] = useState('')
  const [data, setData] = useState('')
  const [chainId, setChainId] = useState('1')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = useCallback(async () => {
    if (!to || !value) { setError('To and Value are required'); return }
    setError(null)
    setSigning(true)
    try {
      const params: EthTxParams = {
        to,
        value,
        gasLimit,
        nonce: nonce || '0',
        data: data || undefined,
        chainId: parseInt(chainId),
      }
      const built = buildEthSignTxApdu(params)
      for (const apdu of [built.apdu]) {
        const resp = await send(apdu)
        const result = parseSignResponse(resp)
        if (result) onResult(result)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Signing failed')
    } finally {
      setSigning(false)
    }
  }, [to, value, gasLimit, nonce, data, chainId, send, onResult])

  return (
    <div className="space-y-3">
      <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Ethereum Transaction</p>

      <div>
        <label className="font-label text-[11px] text-on-surface-variant block mb-1">To</label>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[11px] text-on-surface-variant block mb-1">Value (wei)</label>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="font-label text-[11px] text-on-surface-variant block mb-1">Gas Limit</label>
          <input
            value={gasLimit}
            onChange={e => setGasLimit(e.target.value)}
            placeholder="21000"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[11px] text-on-surface-variant block mb-1">Nonce</label>
          <input
            value={nonce}
            onChange={e => setNonce(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="font-label text-[11px] text-on-surface-variant block mb-1">Chain ID</label>
          <input
            value={chainId}
            onChange={e => setChainId(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="font-label text-[11px] text-on-surface-variant block mb-1">Data (hex, optional)</label>
        <input
          value={data}
          onChange={e => setData(e.target.value)}
          placeholder="0x"
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSign}
        disabled={signing}
        className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {signing ? 'Signing...' : 'Sign Transaction'}
      </button>
    </div>
  )
}

function SolForm({ send, onResult }: { send: (hex: string) => Promise<string>; onResult: (r: SignResponse) => void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = useCallback(async () => {
    if (!to || !amount) { setError('To and Amount are required'); return }
    setError(null)
    setSigning(true)
    try {
      const params: SolTxParams = { to, amount, memo: memo || undefined }
      const built = buildSolSignMessageApdu(params)
      const resp = await send(built.apdu)
      const result = parseSignResponse(resp)
      if (result) onResult(result)
    } catch (e: any) {
      setError(e?.message ?? 'Signing failed')
    } finally {
      setSigning(false)
    }
  }, [to, amount, memo, send, onResult])

  return (
    <div className="space-y-3">
      <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Solana Transaction</p>

      <div>
        <label className="font-label text-[11px] text-on-surface-variant block mb-1">To (base58)</label>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="Base58 address..."
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label className="font-label text-[11px] text-on-surface-variant block mb-1">Amount (SOL)</label>
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label className="font-label text-[11px] text-on-surface-variant block mb-1">Memo (optional)</label>
        <input
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="Transaction memo"
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSign}
        disabled={signing}
        className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {signing ? 'Signing...' : 'Sign Message'}
      </button>
    </div>
  )
}

function ChainSelector({ value, onChange }: { value: ChainId; onChange: (v: ChainId) => void }) {
  return (
    <div className="flex gap-2 mb-4">
      {(['ethereum', 'solana'] as const).map(chain => (
        <button
          key={chain}
          onClick={() => onChange(chain)}
          className={`px-4 py-2 rounded-lg text-sm font-label transition-colors ${
            value === chain
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'
          }`}
        >
          {chain === 'ethereum' ? 'Ethereum' : 'Solana'}
        </button>
      ))}
    </div>
  )
}

export default function TxBuilder({ send, onResult }: TxBuilderProps) {
  const [chain, setChain] = useState<ChainId>('ethereum')

  return (
    <div className="p-6">
      <ChainSelector value={chain} onChange={setChain} />
      {chain === 'ethereum' && <EthForm send={send} onResult={onResult} />}
      {chain === 'solana' && <SolForm send={send} onResult={onResult} />}
    </div>
  )
}
