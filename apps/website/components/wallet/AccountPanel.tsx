'use client'
import type { EthAddressResponse, SolPubkeyResponse } from '@/lib/wallet-commands'

interface WalletAccounts {
  eth: EthAddressResponse | null
  sol: SolPubkeyResponse | null
}

const SHRIMPVATE_KEYS = ['eth', 'sol'] as const

function truncateAddress(addr: string, chars = 8): string {
  if (addr.length <= chars * 2 + 2) return addr
  return addr.slice(0, chars + 2) + '...' + addr.slice(-chars)
}

function copyAddress(addr: string) {
  navigator.clipboard.writeText(addr)
}

interface AccountCardProps {
  label: string
  address: string
  chain: string
}

function AccountCard({ label, address, chain }: AccountCardProps) {
  return (
    <div className="bg-surface-container rounded-lg border border-outline-variant p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className="text-[10px] font-label px-1.5 py-0.5 rounded bg-primary/10 text-primary">{chain}</span>
      </div>
      <p className="font-mono text-xs text-on-surface break-all">{truncateAddress(address, 12)}</p>
      <button
        onClick={() => copyAddress(address)}
        className="text-xs text-primary hover:text-primary/80 font-label mt-1.5 inline-flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[12px]">content_copy</span>
        Copy Address
      </button>
    </div>
  )
}

interface AccountPanelProps {
  accounts: WalletAccounts
  loading: boolean
}

export default function AccountPanel({ accounts, loading }: AccountPanelProps) {
  const hasAccounts = accounts.eth || accounts.sol

  return (
    <div className="p-4 border-b border-outline-variant">
      <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant block mb-3">Accounts</span>

      {loading && (
        <p className="text-xs text-on-surface-variant/70 text-center py-4">Loading accounts...</p>
      )}

      {!loading && !hasAccounts && (
        <p className="text-xs text-on-surface-variant/70 text-center py-4">
          Connect a device to view accounts
        </p>
      )}

      {!loading && hasAccounts && (
        <div className="space-y-2">
          {accounts.eth && (
            <AccountCard
              label="Ethereum"
              address={accounts.eth.address}
              chain="ETH"
            />
          )}
          {accounts.sol && (
            <AccountCard
              label="Solana"
              address={accounts.sol.address}
              chain="SOL"
            />
          )}
        </div>
      )}
    </div>
  )
}
