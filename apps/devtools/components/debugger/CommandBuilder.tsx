'use client'
import { useState } from 'react'
import TargetToggle, { type DebugTarget } from './TargetToggle'
import { useApduBus } from '@/lib/apdu-bus'

// ── Preset APDU commands ──────────────────────────────────────────────────────
// All paths use m/44'/60'/0'/0/0 for ETH and m/44'/501'/0'/0' for SOL unless noted.
// ETH tx: EIP-1559, chainId=1, 0.001 ETH → vitalik.eth (0xd8dA...6045), gasLimit=21000
// Personal msg: "Hello, OldPhone Wallet!" (23 bytes)
// EIP-712: sample domain + struct hash (zeros for demo)
// Solana msg: "Hello Solana" (12 bytes)

const PRESETS = [
  // ── System ──────────────────────────────────────────────────────────────────
  { label: 'GET_VERSION',
    hex: 'e001000000',
    group: 'System' },
  { label: 'GET_APP_AND_VERSION',
    hex: 'b001000000',
    group: 'System' },
  { label: 'OPEN_APP (Ethereum)',
    hex: 'e0d8000008457468657265756d',
    group: 'System' },
  { label: 'OPEN_APP (Solana)',
    hex: 'e0d800000653 6f6c616e61',
    group: 'System' },
  { label: 'PROVIDE_ERC20_TOKEN_INFO (USDC, mainnet)',
    // ticker_len=4 + "USDC" + decimals=6 + USDC contract(20) + chainId=1 + sig=00
    hex: 'e00a00001f04555344430 6a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000100',
    group: 'System' },

  // ── Ethereum ─────────────────────────────────────────────────────────────────
  { label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/0)",
    hex: 'e002000015058000002c8000003c800000000000000000000000',
    group: 'Ethereum' },
  { label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/1)",
    hex: 'e002000015058000002c8000003c800000000000000000000001',
    group: 'Ethereum' },
  { label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/2)",
    hex: 'e002000015058000002c8000003c800000000000000000000002',
    group: 'Ethereum' },
  { label: "SIGN_ETH_TX (0.001 ETH → vitalik.eth, EIP-1559)",
    // path(21) + type02 + RLP[chainId=1, nonce=0, maxPriorityFee=1gwei, maxFee=10gwei,
    //   gasLimit=21000, to=vitalik.eth, value=0.001ETH, data=empty, accessList=empty]
    hex: 'e004000046058000002c8000003c80000000000000000000000002ef0180843b9aca008502540be40082520894d8da6bf26964af9d7eed9e03e53415d37aa9604587038d7ea4c6800080c0',
    group: 'Ethereum' },
  { label: 'SIGN_PERSONAL_MESSAGE ("Hello, OldPhone Wallet!")',
    // path(21) + msg_len_be(4)=0x00000017 + msg(23 bytes)
    hex: 'e008000030058000002c8000003c8000000000000000000000000000001748656c6c6f2c204f6c6450686f6e652057616c6c657421',
    group: 'Ethereum' },
  { label: 'SIGN_EIP_712_MESSAGE (sample typed data)',
    // path(21) + domain_hash(32, deadbeef…) + struct_hash(32, cafebabe…)
    hex: 'e00c000055058000002c8000003c800000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    group: 'Ethereum' },

  // ── Solana ───────────────────────────────────────────────────────────────────
  { label: "GET_SOLANA_PUBKEY (m/44'/501'/0'/0')",
    hex: 'e005000011048000002c800001f5800000008000000 0',
    group: 'Solana' },
  { label: "GET_SOLANA_PUBKEY (m/44'/501'/0'/1')",
    hex: 'e005000011048000002c800001f58000000080000001',
    group: 'Solana' },
  { label: 'SIGN_SOLANA_MESSAGE ("Hello Solana")',
    // P1=0x01(first+last), P2=0x00(no more) + path(17) + msg(12 bytes)
    hex: 'e00601001d048000002c800001f5800000008000000048656c6c6f20536f6c616e61',
    group: 'Solana' },
]

export interface LogEntry {
  id: number
  dir: 'tx' | 'rx' | 'error'
  hex: string
  label?: string
  status?: string
}

interface CommandBuilderProps {
  onLog: (entry: LogEntry) => void
}

let _entryId = 0

export default function CommandBuilder({ onLog }: CommandBuilderProps) {
  const [mode, setMode] = useState<'preset' | 'manual'>('preset')
  const [preset, setPreset] = useState(PRESETS[0])
  const [manual, setManual] = useState('')
  const [target, setTarget] = useState<DebugTarget>('simulator')
  const [loading, setLoading] = useState(false)
  const dispatch = useApduBus(s => s.dispatch)

  const hexToSend = mode === 'preset'
    ? preset.hex.replace(/\s/g, '')
    : manual.replace(/\s/g, '')

  const groups = Array.from(new Set(PRESETS.map(p => p.group)))

  async function send() {
    if (!hexToSend || loading) return
    setLoading(true)
    const txEntry: LogEntry = { id: ++_entryId, dir: 'tx', hex: hexToSend, label: mode === 'preset' ? preset.label : undefined }
    onLog(txEntry)

    try {
      if (target === 'simulator') {
        const response = await dispatch(hexToSend)
        const status = response.slice(-4).toUpperCase()
        onLog({ id: ++_entryId, dir: 'rx', hex: response, status })
      } else {
        onLog({ id: ++_entryId, dir: 'error', hex: '', label: 'BLE Device mode not yet implemented' })
      }
    } catch (e) {
      onLog({ id: ++_entryId, dir: 'error', hex: '', label: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-3 border-b border-outline-variant">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['preset', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded font-label transition-colors ${
                mode === m ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m === 'preset' ? 'Preset' : 'Manual'}
            </button>
          ))}
        </div>
        <TargetToggle value={target} onChange={setTarget} />
      </div>

      {mode === 'preset' ? (
        <select
          value={preset.hex}
          onChange={e => setPreset(PRESETS.find(p => p.hex === e.target.value) ?? PRESETS[0])}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
        >
          {groups.map(group => (
            <optgroup key={group} label={group}>
              {PRESETS.filter(p => p.group === group).map(p => (
                <option key={p.hex} value={p.hex}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      ) : (
        <textarea
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="e0 01 00 00 00"
          rows={2}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
        />
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 font-mono text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded truncate">
          {hexToSend || '—'}
        </div>
        <button
          onClick={send}
          disabled={!hexToSend || loading}
          className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {loading ? '...' : 'Send ▶'}
        </button>
      </div>
    </div>
  )
}
