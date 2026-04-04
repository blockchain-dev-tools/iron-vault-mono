/** Shared chain ID → name lookup used by WalletManagerScreen and AccountDetailScreen. */
export const CHAIN_NAMES: Record<number, string> = {
  1:     'Ethereum',
  10:    'Optimism',
  56:    'BNB Chain',
  100:   'Gnosis',
  137:   'Polygon',
  250:   'Fantom',
  324:   'zkSync Era',
  8453:  'Base',
  42161: 'Arbitrum One',
  43114: 'Avalanche',
};

export function chainName(id?: number): string | undefined {
  if (!id) return undefined;
  return CHAIN_NAMES[id] ? `${CHAIN_NAMES[id]} (${id})` : `Chain ${id}`;
}
