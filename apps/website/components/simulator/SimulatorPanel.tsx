'use client'
import { useEffect, useRef, useState } from 'react'
import { WalletSimulator, createSimulatorBridge, type SimulatorBridge } from '@iron-vault/simulator'
import { useApduBus } from '@/lib/apdu-bus'
import { devtoolsStorage } from '@/lib/simulator-storage'

// Well-known dev mnemonic for the APDU bridge (same as BIP-39 test vector)
const DEV_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

// iPhone SE dimensions — screens are designed for this size.
// Scale down to fit the 328px available panel width (360px panel - 32px padding).
const PHONE_W = 375
const PHONE_H = 667
const SCALE = 328 / 375 // ≈ 0.875

interface ActivityEntry {
  id: number
  dir: 'rx' | 'tx'
  hex: string
}

let _actId = 0

export default function SimulatorPanel() {
  const bridgeRef = useRef<SimulatorBridge | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [logOpen, setLogOpen] = useState(false)
  const [signingActive, setSigningActive] = useState(false)
  const pendingRequest = useApduBus(s => s.pendingRequest)
  const resolveApdu = useApduBus(s => s.resolve)
  const rejectApdu = useApduBus(s => s.reject)

  // Create bridge once on mount
  useEffect(() => {
    const bridge = createSimulatorBridge({ mnemonic: DEV_MNEMONIC, initialUnlocked: true })
    bridgeRef.current = bridge
    const unsub = bridge.onStateChange(state => {
      setSigningActive(state.pendingSign !== null)
    })
    return unsub
  }, [])

  // Process incoming APDU commands from the bus
  useEffect(() => {
    if (!pendingRequest || !bridgeRef.current) return
    const { id, hex } = pendingRequest
    setActivity(prev => [...prev, { id: ++_actId, dir: 'rx', hex }])

    bridgeRef.current.injectApdu(hex)
      .then(response => {
        setActivity(prev => [...prev, { id: ++_actId, dir: 'tx', hex: response }])
        resolveApdu(id, response)
      })
      .catch(err => {
        rejectApdu(id, String(err))
      })
  }, [pendingRequest, resolveApdu, rejectApdu])

  // Outer container dimensions after scaling
  const scaledW = Math.round(PHONE_W * SCALE)
  const scaledH = Math.round(PHONE_H * SCALE)

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Phone simulator */}
      <div className="flex-1 flex items-start justify-center overflow-hidden pt-4 px-4 relative">
        {/* Outer: occupies the scaled display size in the layout */}
        <div style={{ width: scaledW, height: scaledH, flexShrink: 0, position: 'relative' }}>
          {/* Inner: rendered at full iPhone SE size, then scaled down */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
          }}>
            <WalletSimulator
              storage={devtoolsStorage}
              initialScreen="Vault"
              style={{ width: PHONE_W, height: PHONE_H }}
            />
          </div>

          {/* Sign confirmation overlay (covers the scaled phone area) */}
          {signingActive && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 rounded-2xl z-10">
              <span className="material-symbols-outlined text-primary text-4xl">draw</span>
              <p className="font-headline text-on-surface text-center px-4">Sign Transaction?</p>
              <p className="font-body text-xs text-on-surface-variant text-center px-6">
                A signing request was received from the debugger.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => bridgeRef.current?.rejectPendingSign()}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-label text-on-surface hover:bg-surface-container transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => bridgeRef.current?.approvePendingSign()}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold hover:opacity-90 transition-opacity"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APDU Activity log */}
      <div className="border-t border-outline-variant flex-shrink-0">
        <button
          onClick={() => setLogOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="uppercase tracking-wide">APDU Activity</span>
          <span>{logOpen ? '▾' : '▸'}</span>
        </button>
        {logOpen && (
          <div className="max-h-40 overflow-y-auto font-mono text-[10px] px-4 pb-2 space-y-1">
            {activity.length === 0 && (
              <p className="text-on-surface-variant py-2">No activity yet</p>
            )}
            {activity.map(e => (
              <div key={e.id} className="flex gap-2 items-baseline">
                <span className={e.dir === 'rx' ? 'text-primary' : 'text-on-surface-variant'}>
                  {e.dir === 'rx' ? '→' : '←'}
                </span>
                <span className="text-on-surface truncate">{e.hex}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
