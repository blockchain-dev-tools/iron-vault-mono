'use client'
import { useState, useCallback, useRef } from 'react'
import WalletLayout, { WalletNav } from '@/components/layout/WalletLayout'
import DevicePanel from '@/components/wallet/DevicePanel'
import AccountPanel from '@/components/wallet/AccountPanel'
import TxBuilder from '@/components/wallet/TxBuilder'
import TxResult from '@/components/wallet/TxResult'
import { openApp, getVersion, getEthAddress, getSolPubkey, parseVersionResponse, parseEthAddressResponse, parseSolPubkeyResponse } from '@/lib/wallet-commands'
import type { SignResponse, EthAddressResponse, SolPubkeyResponse } from '@/lib/wallet-commands'

interface WalletAccounts {
  eth: EthAddressResponse | null
  sol: SolPubkeyResponse | null
}

export default function WalletPage() {
  const [connected, setConnected] = useState(false)
  const [send, setSend] = useState<((hex: string) => Promise<string>) | null>(null)
  const [result, setResult] = useState<SignResponse | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<{ version: string } | null>(null)
  const [accounts, setAccounts] = useState<WalletAccounts>({ eth: null, sol: null })
  const [loading, setLoading] = useState(false)
  const initRef = useRef(false)

  const initSession = useCallback(async (sendFn: (hex: string) => Promise<string>) => {
    if (initRef.current) return
    initRef.current = true
    setLoading(true)
    try {
      const versionResp = await sendFn(getVersion())
      const ver = parseVersionResponse(versionResp)
      if (ver) setDeviceInfo(ver)

      await sendFn(openApp('Ethereum'))
      const ethResp = await sendFn(getEthAddress())
      const eth = parseEthAddressResponse(ethResp)
      if (eth) setAccounts(prev => ({ ...prev, eth }))

      await sendFn(openApp('Solana'))
      const solResp = await sendFn(getSolPubkey())
      const sol = parseSolPubkeyResponse(solResp)
      if (sol) setAccounts(prev => ({ ...prev, sol }))
    } catch (e: any) {
      console.error('Session init failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConnected = useCallback(async (sendFn: (hex: string) => Promise<string>) => {
    setSend(() => sendFn)
    setConnected(true)
    initRef.current = false
    await initSession(sendFn)
  }, [initSession])

  const handleDisconnected = useCallback(() => {
    setConnected(false)
    setSend(null)
    setDeviceInfo(null)
    setAccounts({ eth: null, sol: null })
    setResult(null)
    initRef.current = false
  }, [])

  const handleTxResult = useCallback((r: SignResponse) => {
    setResult(r)
  }, [])

  const headerStatus = (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-on-surface-variant/30'}`} />
      <span className="font-label text-xs text-on-surface-variant">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )

  return (
    <WalletLayout
      nav={<WalletNav />}
      deviceStatus={headerStatus}
      main={
        send ? (
          <TxBuilder send={send} onResult={handleTxResult} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-on-surface-variant/70">Connect your Iron Vault device to start signing</p>
          </div>
        )
      }
      sidebar={
        <>
          <DevicePanel onConnected={handleConnected} onDisconnected={handleDisconnected} />
          <AccountPanel accounts={accounts} loading={loading} />
          <TxResult result={result} onClear={() => setResult(null)} />
        </>
      }
    />
  )
}
