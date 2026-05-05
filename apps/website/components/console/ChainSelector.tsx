'use client'

export type ChainId = 'ethereum' | 'solana'

interface ChainSelectorProps {
  value: ChainId
  onChange: (chain: ChainId) => void
}

const CHAINS: { id: ChainId; label: string; icon: string; color: string }[] = [
  { id: 'ethereum', label: 'Ethereum', icon: '◆', color: 'text-blue-400' },
  { id: 'solana',   label: 'Solana',   icon: '◎', color: 'text-purple-400' },
]

export default function ChainSelector({ value, onChange }: ChainSelectorProps) {
  return (
    <div className="flex gap-2">
      {CHAINS.map(chain => (
        <button
          key={chain.id}
          onClick={() => onChange(chain.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-label transition-colors ${
            value === chain.id
              ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-transparent'
          }`}
        >
          <span className={chain.color}>{chain.icon}</span>
          {chain.label}
        </button>
      ))}
    </div>
  )
}
