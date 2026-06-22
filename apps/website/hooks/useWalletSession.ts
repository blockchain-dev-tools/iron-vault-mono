'use client'
import { useState, useRef, useCallback } from 'react'
import { useBleDevice, type BleStatus } from './useBleDevice'
import {
  getVersion,
  getAppAndVersion,
  getEthAddress,
  getSolPubkey,
  openApp,
  parseEthAddressResponse,
  parseSolPubkeyResponse,
  parseVersionResponse,
  type EthAddressResponse,
  type SolPubkeyResponse,
  type VersionResponse,
  DEFAULT_PATHS,
} from '@/lib/wallet-commands'

export type { BleStatus }

export interface DeviceInfo {
  version: string
  appName?: string
}

export interface WalletAccounts {
  eth: EthAddressResponse | null
  sol: SolPubkeyResponse | null
}

export function useWalletSession() {
  const ble = useBleDevice()
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [accounts, setAccounts] = useState<WalletAccounts>({ eth: null, sol: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chainInited = useRef(false)

  /** Full connection flow: scan → connect → fetch device info → fetch accounts */
  const connect = useCallback(async () => {
    setError(null)
    setLoading(true)
    chainInited.current = false
    try {
      // useBleDevice's openScanModal already handles the scan+connect flow
      // We just need to wait for status to become 'connected', then init
      // The caller watches status changes instead
    } catch (e: any) {
      setError(e?.message ?? 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Initialize the wallet session after BLE connection: query device info + accounts */
  const initSession = useCallback(async (send: (hex: string) => Promise<string>) => {
    if (chainInited.current) return
    setLoading(true)
    setError(null)
    try {
      // 1. Get device version
      const versionResp = await send(getVersion())
      const ver = parseVersionResponse(versionResp)
      if (ver) setDeviceInfo(ver)

      // 2. Switch to Ethereum app and get address
      await send(openApp('Ethereum'))
      const ethResp = await send(getEthAddress())
      const eth = parseEthAddressResponse(ethResp)
      if (eth) setAccounts(prev => ({ ...prev, eth }))

      // 3. Switch to Solana app and get pubkey
      await send(openApp('Solana'))
      const solResp = await send(getSolPubkey())
      const sol = parseSolPubkeyResponse(solResp)
      if (sol) setAccounts(prev => ({ ...prev, sol }))

      chainInited.current = true
    } catch (e: any) {
      setError(e?.message ?? 'Session init failed')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Disconnect and reset state */
  const disconnect = useCallback(() => {
    ble.disconnect()
    setDeviceInfo(null)
    setAccounts({ eth: null, sol: null })
    setError(null)
    chainInited.current = false
  }, [ble])

  return {
    // From useBleDevice
    status: ble.status,
    deviceName: ble.deviceName,
    showScanModal: ble.showScanModal,
    setShowScanModal: ble.setShowScanModal,
    scanning: ble.scanning,
    scannedDevices: ble.scannedDevices,
    openScanModal: ble.openScanModal,
    connectDevice: ble.connectDevice,
    send: ble.send,
    stopScan: ble.stopScan,

    // Wallet session state
    deviceInfo,
    accounts,
    loading,
    error,
    initSession,
    connect,
    disconnect,
  }
}
