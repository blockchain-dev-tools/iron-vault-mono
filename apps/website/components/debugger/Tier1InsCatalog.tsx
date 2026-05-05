'use client'
import { useState, useMemo } from 'react'
import { INS, CHAIN_INFO, type ChainId } from '@iron-vault/apdu'
import { getInsName } from '@iron-vault/apdu'

interface InsEntry {
  hex: string
  name: string
  cla: string
  chain: string
  appName: string
}

const CHAIN_FILTERS: { id: ChainId | 'os'; label: string; color: string }[] = [
  { id: 'os',       label: 'OS',     color: 'bg-gray-500' },
  { id: 'ethereum', label: 'ETH',    color: 'bg-blue-500' },
  { id: 'solana',   label: 'SOL',    color: 'bg-purple-500' },
  { id: 'bitcoin',  label: 'BTC',    color: 'bg-amber-500' },
  { id: 'tron',     label: 'TRX',    color: 'bg-red-500' },
  { id: 'sui',      label: 'SUI',    color: 'bg-teal-500' },
]

const KNOWN_INS: InsEntry[] = [
  { hex: 'E0 D8', name: 'OPEN_APP',                     cla: 'E0', chain: 'os', appName: 'BOLOS' },
  { hex: 'E0 A7', name: 'QUIT_APP',                     cla: 'E0', chain: 'os', appName: 'BOLOS' },
  { hex: 'E0 01', name: 'GET_VERSION',                  cla: 'E0', chain: 'os', appName: 'All' },
  { hex: 'E0 E2', name: 'GET_DEVICE_INFO',              cla: 'E0', chain: 'os', appName: 'All' },
  { hex: 'B0 01', name: 'GET_APP_AND_VERSION',           cla: 'B0', chain: 'os', appName: 'All' },

  { hex: 'E0 02', name: 'GET_ETH_ADDRESS',              cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 04', name: 'SIGN_ETH_TX',                  cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 06', name: 'GET_APP_CONFIGURATION',         cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 08', name: 'SIGN_PERSONAL_MESSAGE',         cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 0A', name: 'PROVIDE_ERC20_TOKEN_INFO',      cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 0C', name: 'SIGN_EIP_712',                 cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 14', name: 'PROVIDE_NFT_METADATA',          cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 1C', name: 'GET_CHALLENGE',                cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 22', name: 'PROVIDE_DOMAIN_NAME',           cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 26', name: 'GET_BLIND_SIGN_ENABLED',        cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },
  { hex: 'E0 2A', name: 'SIGN_TYPED_DATA',              cla: 'E0', chain: 'ethereum', appName: 'Ethereum' },

  { hex: 'E0 05', name: 'GET_SOLANA_PUBKEY',             cla: 'E0', chain: 'solana', appName: 'Solana' },
  { hex: 'E0 03', name: 'SIGN_OFFLINE_MESSAGE',          cla: 'E0', chain: 'solana', appName: 'Solana' },
  { hex: 'E0 04', name: 'SIGN_SOLANA_MESSAGE',           cla: 'E0', chain: 'solana', appName: 'Solana' },
  { hex: 'E0 06', name: 'SIGN_SOLANA_TX',               cla: 'E0', chain: 'solana', appName: 'Solana' },
  { hex: 'E0 07', name: 'GET_SOLANA_ADDRESS',            cla: 'E0', chain: 'solana', appName: 'Solana' },

  { hex: 'E1 00', name: 'GET_EXTENDED_PUBKEY',           cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'E1 02', name: 'REGISTER_WALLET',               cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'E1 03', name: 'GET_WALLET_ADDRESS',            cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'E1 04', name: 'SIGN_PSBT',                    cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'E1 05', name: 'GET_MASTER_FINGERPRINT',        cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'E1 10', name: 'SIGN_BTC_MESSAGE',              cla: 'E1', chain: 'bitcoin', appName: 'Bitcoin' },
  { hex: 'F8 01', name: 'CONTINUE',                     cla: 'F8', chain: 'bitcoin', appName: 'Bitcoin' },

  { hex: '14 02', name: 'GET_TRON_PUBKEY',               cla: '14', chain: 'tron', appName: 'Tron' },
  { hex: '14 04', name: 'SIGN_TRON_TX',                 cla: '14', chain: 'tron', appName: 'Tron' },
  { hex: '14 08', name: 'SIGN_TRON_PERSONAL',            cla: '14', chain: 'tron', appName: 'Tron' },

  { hex: '07 02', name: 'GET_SUI_PUBKEY',               cla: '07', chain: 'sui', appName: 'Sui' },
  { hex: '07 03', name: 'SIGN_SUI_TX',                  cla: '07', chain: 'sui', appName: 'Sui' },
  { hex: '07 04', name: 'SIGN_SUI_PERSONAL',             cla: '07', chain: 'sui', appName: 'Sui' },
]

interface Tier1InsCatalogProps {
  onSelect: (hex: string) => void
}

export default function Tier1InsCatalog({ onSelect }: Tier1InsCatalogProps) {
  const [chainFilter, setChainFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!chainFilter) return KNOWN_INS
    return KNOWN_INS.filter(e => e.chain === chainFilter)
  }, [chainFilter])

  function insToApduHex(entry: InsEntry): string {
    const cla = parseInt(entry.cla, 16)
    const ins = parseInt(entry.hex.split(' ')[1], 16)
    return `${cla.toString(16).padStart(2, '0')}${ins.toString(16).padStart(2, '0')}00000000`
  }

  return (
    <div className="space-y-2">
      {/* Chain filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setChainFilter(null)}
          className={`px-2.5 py-1 rounded text-[10px] font-label transition-colors ${
            chainFilter === null ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All ({KNOWN_INS.length})
        </button>
        {CHAIN_FILTERS.map(f => {
          const count = KNOWN_INS.filter(e => e.chain === f.id).length
          return (
            <button
              key={f.id}
              onClick={() => setChainFilter(f.id)}
              className={`px-2.5 py-1 rounded text-[10px] font-label transition-colors flex items-center gap-1 ${
                chainFilter === f.id ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Command list */}
      <div className="border border-outline-variant rounded-lg overflow-hidden text-xs font-mono max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-container">
            <tr className="text-on-surface-variant font-label text-[10px] uppercase tracking-wider">
              <th className="text-left px-3 py-1.5">CLA INS</th>
              <th className="text-left px-3 py-1.5">Name</th>
              <th className="text-left px-3 py-1.5">App</th>
              <th className="text-right px-3 py-1.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {filtered.map(entry => (
              <tr key={`${entry.cla}_${entry.hex}`} className="hover:bg-surface-container/50">
                <td className="px-3 py-1.5 text-primary">{entry.hex}</td>
                <td className="px-3 py-1.5 text-on-surface">{entry.name}</td>
                <td className="px-3 py-1.5 text-on-surface-variant">{entry.appName}</td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    onClick={() => onSelect(insToApduHex(entry))}
                    className="px-2 py-0.5 rounded text-[10px] bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-label"
                  >
                    Use
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
