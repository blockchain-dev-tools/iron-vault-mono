'use client'
import { useState, useMemo } from 'react'
import { APDU_PRESETS, explainApdu } from '@iron-vault/apdu'
import TargetToggle, { type DebugTarget } from './TargetToggle'
import ScanModal from './ScanModal'
import Tier1FieldTable from './Tier1FieldTable'
import Tier1BleFrames from './Tier1BleFrames'
import Tier1InsCatalog from './Tier1InsCatalog'
import { useApduBus } from '@/lib/apdu-bus'
import { useBleDevice, type BleLogFn } from '@/hooks/useBleDevice'

type Tab = 'preset' | 'manual' | 'catalog' | 'replay'

export interface LogEntry {
  id: number
  dir: 'tx' | 'rx' | 'error'
  hex: string
  label?: string
  status?: string
}

interface Tier1ApduInputProps {
  onLog: (entry: LogEntry) => void
}

let _entryId = 0

export default function Tier1ApduInput({ onLog }: Tier1ApduInputProps) {
  const [tab, setTab] = useState<Tab>('preset')
  const [preset, setPreset] = useState(APDU_PRESETS[0])
  const [manual, setManual] = useState('')
  const [target, setTarget] = useState<DebugTarget>('simulator')
  const [loading, setLoading] = useState(false)
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null)
  const dispatch = useApduBus(s => s.dispatch)
  const bleDevice = useBleDevice()

  const hexToSend = useMemo(() => {
    if (tab === 'preset') return preset.hex.replace(/\s+/g, '')
    if (tab === 'manual') return manual.replace(/\s+/g, '')
    return ''
  }, [tab, preset.hex, manual])

  const groups = useMemo(() => Array.from(new Set(APDU_PRESETS.map(p => p.group))), [])

  const bleLog: BleLogFn = (dir, hex, label) => {
    if (dir === 'info') {
      onLog({ id: ++_entryId, dir: 'rx', hex: '', label: `ℹ ${label ?? hex}` })
    } else {
      onLog({ id: ++_entryId, dir, hex, label })
    }
  }

  async function send(hexOverride?: string) {
    const hex = hexOverride ?? hexToSend
    if (!hex || loading) return
    setLoading(true)
    onLog({ id: ++_entryId, dir: 'tx', hex, label: tab === 'preset' ? preset.label : undefined })

    try {
      if (target === 'simulator') {
        const response = await dispatch(hex)
        onLog({ id: ++_entryId, dir: 'rx', hex: response, status: response.slice(-4).toUpperCase() })
      } else {
        if (bleDevice.status !== 'connected') {
          onLog({ id: ++_entryId, dir: 'error', hex: '', label: 'No device connected. Please scan and connect first.' })
          return
        }
        const response = await bleDevice.send(hex)
        onLog({ id: ++_entryId, dir: 'rx', hex: response, status: response.slice(-4).toUpperCase() })
      }
    } catch (e) {
      onLog({ id: ++_entryId, dir: 'error', hex: '', label: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'preset', label: 'Preset' },
    { key: 'manual', label: 'Manual' },
    { key: 'catalog', label: 'Catalog' },
    { key: 'replay', label: 'Replay' },
  ]

  return (
    <div className="flex flex-col h-full border-b border-outline-variant">
      {/* Tab bar + TargetToggle */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-outline-variant">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded font-label transition-colors ${
                tab === t.key
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <TargetToggle value={target} onChange={setTarget} />
      </div>

      {/* BLE connection bar */}
      {target === 'ble' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container/50 border-b border-outline-variant">
          <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            bleDevice.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`} />
          <span className={`flex-1 text-xs ${
            bleDevice.status === 'connected' ? 'text-on-surface' : 'text-on-surface-variant'
          }`}>
            {bleDevice.status === 'connected'
              ? bleDevice.deviceName
              : bleDevice.status === 'connecting'
              ? 'Connecting...'
              : 'Not connected'}
          </span>
          {bleDevice.status === 'connected' ? (
            <button
              onClick={bleDevice.disconnect}
              className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-500 hover:bg-red-500/25 transition">
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => bleDevice.openScanModal(bleLog)}
              disabled={bleDevice.status === 'connecting' || bleDevice.scanning}
              className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50 transition">
              {bleDevice.scanning ? 'Scanning...' : 'Scan'}
            </button>
          )}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {tab === 'preset' && (
            <select
              value={preset.hex}
              onChange={e => setPreset(APDU_PRESETS.find(p => p.hex === e.target.value) ?? APDU_PRESETS[0])}
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
            >
              {groups.map(group => (
                <optgroup key={group} label={group}>
                  {APDU_PRESETS.filter(p => p.group === group).map(p => (
                    <option key={p.hex} value={p.hex}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          {tab === 'manual' && (
            <textarea
              value={manual}
              onChange={e => setManual(e.target.value)}
              placeholder="e0 01 00 00 00"
              rows={2}
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
            />
          )}

          {tab === 'catalog' && (
            <Tier1InsCatalog
              onSelect={hex => {
                setManual(hex)
                setTab('manual')
              }}
            />
          )}

          {tab === 'replay' && (
            <div className="text-sm text-on-surface-variant text-center py-6">
              Replay mode — send multi-frame transactions step by step.
              <br />
              <span className="text-xs">(Coming in Phase 3)</span>
            </div>
          )}

          {/* Send row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded truncate">
              {hexToSend || '—'}
            </div>
            <button
              onClick={() => send()}
              disabled={!hexToSend || loading || (target === 'ble' && bleDevice.status !== 'connected')}
              className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {loading ? '...' : 'Send ▶'}
            </button>
          </div>

          {/* Field breakdown */}
          {(tab === 'preset' || tab === 'manual') && hexToSend && hexToSend.length >= 4 && (
            <Tier1FieldTable hex={hexToSend} />
          )}

          {/* BLE framing visualization */}
          {(tab === 'preset' || tab === 'manual') && hexToSend && hexToSend.length >= 4 && (
            <details className="group">
              <summary className="text-xs font-label text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors select-none">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span>
                {' '}BLE Frame Visualization
              </summary>
              <div className="mt-2">
                <Tier1BleFrames hex={hexToSend} />
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Scan modal */}
      {bleDevice.showScanModal && (
        <ScanModal
          status={bleDevice.status}
          scanning={bleDevice.scanning}
          scannedDevices={bleDevice.scannedDevices}
          connectingDeviceId={connectingDeviceId}
          onStop={bleDevice.stopScan}
          onRescan={() => bleDevice.openScanModal(bleLog)}
          onConnect={async (d) => {
            setConnectingDeviceId(d.device.id)
            await bleDevice.connectDevice(d)
            setConnectingDeviceId(null)
          }}
          onClose={() => { bleDevice.stopScan(); bleDevice.setShowScanModal(false) }}
        />
      )}
    </div>
  )
}
