export interface BroadcastResult {
  txHash: string
  explorerUrl?: string
}

const DEFAULT_ETH_RPC = 'https://cloudflare-eth.com'

/**
 * Broadcast a signed Ethereum transaction to the network.
 *
 * @param signedTxHex - The fully signed RLP-encoded transaction in hex
 * @param rpcUrl - Optional custom RPC URL (defaults to Cloudflare public endpoint)
 * @returns The transaction hash and optional explorer link
 */
export async function broadcastEthTx(signedTxHex: string, rpcUrl?: string): Promise<BroadcastResult> {
  const url = rpcUrl ?? DEFAULT_ETH_RPC
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_sendRawTransaction',
    params: [signedTxHex.startsWith('0x') ? signedTxHex : `0x${signedTxHex}`],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`RPC error: ${res.status} ${res.statusText}`)

  const json = await res.json()
  if (json.error) throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`)

  const txHash = json.result as string
  return {
    txHash,
    explorerUrl: `https://etherscan.io/tx/${txHash}`,
  }
}
