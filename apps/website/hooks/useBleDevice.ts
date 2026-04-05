'use client'
import { useState, useRef, useCallback } from 'react'
import {
  connectLedgerBle, scanDevices, fromHex,
  type BleTransport, type ScannedDevice, type BleLogFn,
} from '@/lib/ble-transport'

export type BleStatus = 'idle' | 'scanning' | 'connecting' | 'connected'
export type { BleLogFn }

export function useBleDevice() {
  const [status, setStatus]               = useState<BleStatus>('idle')
  const [deviceName, setDeviceName]       = useState<string | null>(null)
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanning, setScanning]           = useState(false)
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([])
  const transportRef = useRef<BleTransport | null>(null)
  const stopScanRef  = useRef<(() => void) | null>(null)
  const onLogRef     = useRef<BleLogFn>(() => {})

  const handleConnected = useCallback((t: BleTransport) => {
    transportRef.current = t
    setDeviceName(t.device.name ?? 'Ledger')
    setStatus('connected')
    t.device.addEventListener('gattserverdisconnected', () => {
      transportRef.current = null
      setStatus('idle')
      setDeviceName(null)
      onLogRef.current('info', '', '⚠️ 设备已断开')
    })
  }, [])

  const stopScan = useCallback(() => {
    stopScanRef.current?.()
    stopScanRef.current = null
    setScanning(false)
  }, [])

  const openScanModal = useCallback(async (onLog: BleLogFn) => {
    onLogRef.current = onLog
    setScannedDevices([])
    setShowScanModal(true)
    setScanning(true)
    try {
      const stop = await scanDevices((d) => {
        setScannedDevices(prev => {
          const idx = prev.findIndex(x => x.device.id === d.device.id)
          if (idx >= 0) { const next = [...prev]; next[idx] = d; return next }
          return [...prev, d]
        })
      }, 8000)
      stopScanRef.current = stop
    } catch (e: any) {
      if (e?.message === 'NO_SCAN_API') {
        // Fallback: use browser native BT picker
        onLog('info', '', '⚠️ 实验性扫描 API 不可用，使用系统蓝牙选择器')
        setShowScanModal(false)
        setScanning(false)
        setStatus('connecting')
        try {
          const t = await connectLedgerBle(onLog)
          handleConnected(t)
        } catch (err: any) {
          onLog('info', '', `连接失败: ${err?.message}`)
          setStatus('idle')
        }
        return
      }
      onLog('info', '', `扫描失败: ${e?.message}`)
      setShowScanModal(false)
    } finally {
      setScanning(false)
    }
  }, [handleConnected])

  const connectDevice = useCallback(async (d: ScannedDevice) => {
    stopScan()
    setStatus('connecting')
    try {
      const t = await connectLedgerBle(onLogRef.current, d.device)
      handleConnected(t)
      setShowScanModal(false)
    } catch (e: any) {
      onLogRef.current('info', '', `连接失败: ${e?.message}`)
      setStatus('idle')
    }
  }, [stopScan, handleConnected])

  const disconnect = useCallback(() => {
    transportRef.current?.disconnect()
    transportRef.current = null
    setStatus('idle')
    setDeviceName(null)
  }, [])

  const send = useCallback(async (hex: string): Promise<string> => {
    const t = transportRef.current
    if (!t) throw new Error('未连接设备')
    const resp = await t.exchange(fromHex(hex))
    return Array.from(resp).map(b => b.toString(16).padStart(2, '0')).join('')
  }, [])

  return {
    status,
    deviceName,
    showScanModal,
    setShowScanModal,
    scanning,
    scannedDevices,
    openScanModal,
    stopScan,
    connectDevice,
    disconnect,
    send,
  }
}
