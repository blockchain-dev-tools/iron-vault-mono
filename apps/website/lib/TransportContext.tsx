'use client'
import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react'
import { createSimulatorBridge, type SimulatorBridge } from '@iron-vault/simulator'
import { connectLedgerBle, type BleLogFn } from './ble-transport'
import { createSimulatorTransport, createBleTransport, type ApduTransport } from './transport'

type TransportTarget = 'simulator' | 'ble'

interface TransportContextValue {
  transport: ApduTransport
  target: TransportTarget
  setSimulator: () => void
  setBle: (deviceName?: string) => Promise<void>
  disconnect: () => void
  deviceName: string | null
}

const TransportContext = createContext<TransportContextValue | null>(null)

const DEV_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

export function TransportProvider({ children }: { children: ReactNode }) {
  const bridgeRef = useRef<SimulatorBridge | null>(null)
  const [target, setTarget] = useState<TransportTarget>('simulator')
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const transportRef = useRef<ApduTransport | null>(null)

  const setSimulator = useCallback(() => {
    if (!bridgeRef.current) {
      bridgeRef.current = createSimulatorBridge({ mnemonic: DEV_MNEMONIC, initialUnlocked: true })
    }
    transportRef.current = createSimulatorTransport(bridgeRef.current)
    setTarget('simulator')
    setDeviceName(null)
  }, [])

  const setBle = useCallback(async (name?: string) => {
    const bleLog: BleLogFn = () => {}
    const bt = await connectLedgerBle(bleLog)
    transportRef.current = createBleTransport(bt.exchange, bt.disconnect)
    setTarget('ble')
    setDeviceName(name ?? bt.device.name ?? 'BLE Device')
  }, [])

  const disconnect = useCallback(() => {
    transportRef.current?.disconnect()
    // Reset to simulator if nothing else
    if (!bridgeRef.current) {
      bridgeRef.current = createSimulatorBridge({ mnemonic: DEV_MNEMONIC, initialUnlocked: true })
    }
    transportRef.current = createSimulatorTransport(bridgeRef.current)
    setTarget('simulator')
    setDeviceName(null)
  }, [])

  // Initialize default transport
  if (!transportRef.current) {
    bridgeRef.current = createSimulatorBridge({ mnemonic: DEV_MNEMONIC, initialUnlocked: true })
    transportRef.current = createSimulatorTransport(bridgeRef.current)
  }

  return (
    <TransportContext.Provider value={{
      transport: transportRef.current,
      target,
      setSimulator,
      setBle,
      disconnect,
      deviceName,
    }}>
      {children}
    </TransportContext.Provider>
  )
}

export function useTransport(): TransportContextValue {
  const ctx = useContext(TransportContext)
  if (!ctx) throw new Error('useTransport must be used within TransportProvider')
  return ctx
}
