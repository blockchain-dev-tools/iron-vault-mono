'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { connectLedgerBle, type BleLogFn } from '@/lib/ble-transport'

interface DevicePanelProps {
  onConnected: (send: (hex: string) => Promise<string>) => void
  onDisconnected: () => void
}

export default function DevicePanel({ onConnected, onDisconnected }: DevicePanelProps) {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const transportRef = useRef<{ exchange: (apdu: Uint8Array) => Promise<Uint8Array>; disconnect: () => void } | null>(null)

  useEffect(() => {
    return () => transportRef.current?.disconnect()
  }, [])

  const handleConnect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const onLog: BleLogFn = () => {}
      const transport = await connectLedgerBle(onLog)
      transportRef.current = transport
      setDeviceName(transport.device.name ?? 'Iron Vault')
      setConnected(true)

      const send = async (hex: string): Promise<string> => {
        if (!transportRef.current) throw new Error('Not connected')
        const apdu = new Uint8Array(hex.length / 2)
        for (let i = 0; i < apdu.length; i++) {
          apdu[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
        }
        const resp = await transportRef.current.exchange(apdu)
        return Array.from(resp).map(b => b.toString(16).padStart(2, '0')).join('')
      }

      transport.device.addEventListener('gattserverdisconnected', () => {
        transportRef.current = null
        setConnected(false)
        setDeviceName(null)
        onDisconnected()
      })

      onConnected(send)
    } catch (e: any) {
      setError(e?.message ?? 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [onConnected, onDisconnected])

  const handleDisconnect = useCallback(() => {
    transportRef.current?.disconnect()
    transportRef.current = null
    setConnected(false)
    setDeviceName(null)
    onDisconnected()
  }, [onDisconnected])

  return (
    <div className="p-4 border-b border-outline-variant">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Device</span>
          <span className="text-[10px] font-label px-2 py-0.5 rounded bg-primary/15 text-primary">BLE</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : connecting ? 'bg-yellow-500 animate-pulse' : 'bg-on-surface-variant/30'}`} />
          <span className="text-sm text-on-surface font-label truncate">
            {connected ? (deviceName ?? 'Connected') : connecting ? 'Connecting...' : 'Not Connected'}
          </span>
        </div>

        {error && <p className="text-xs text-red-500 pl-5">{error}</p>}

        <div className="flex gap-2 pt-1">
          {connected ? (
            <button
              onClick={handleDisconnect}
              className="text-xs px-3 py-1 rounded bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors font-label"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="text-xs px-3 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-label disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
