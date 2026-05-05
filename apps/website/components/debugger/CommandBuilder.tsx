'use client'
import { useState } from 'react'
import { APDU_PRESETS } from '@iron-vault/apdu'
import TargetToggle, { type DebugTarget } from './TargetToggle'
import ScanModal from './ScanModal'
import { useApduBus } from '@/lib/apdu-bus'
import { useBleDevice, type BleLogFn } from '@/hooks/useBleDevice'

export interface LogEntry {
  id: number
  dir: 'tx' | 'rx' | 'error'
  hex: string
  label?: string
  status?: string
}

interface CommandBuilderProps {
  onLog: (entry: LogEntry) => void
}

let _entryId = 0

export default function CommandBuilder({ onLog }: CommandBuilderProps) {
  const [mode, setMode]     = useState<'preset' | 'manual'>('preset')
  const [preset, setPreset] = useState(APDU_PRESETS[0])
  const [manual, setManual] = useState('')
  const [target, setTarget] = useState<DebugTarget>('simulator')
  const [loading, setLoading] = useState(false)
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null)
  const dispatch  = useApduBus(s => s.dispatch)
  const bleDevice = useBleDevice()

  const hexToSend = mode === 'preset'
    ? preset.hex.replace(/\s/g, '')
    : manual.replace(/\s/g, '')

  const groups = Array.from(new Set(APDU_PRESETS.map(p => p.group)))

  // Bridge BLE transport log events → CommandBuilder LogEntry format
  const bleLog: BleLogFn = (dir, hex, label) => {
    if (dir === 'info') {
      onLog({ id: ++_entryId, dir: 'rx', hex: '', label: `ℹ ${label ?? hex}` })
    } else {
      onLog({ id: ++_entryId, dir, hex, label })
    }
  }

  async function send() {
    if (!hexToSend || loading) return
    setLoading(true)
    onLog({ id: ++_entryId, dir: 'tx', hex: hexToSend, label: mode === 'preset' ? preset.label : undefined })

    try {
      if (target === 'simulator') {
        const response = await dispatch(hexToSend)
        onLog({ id: ++_entryId, dir: 'rx', hex: response, status: response.slice(-4).toUpperCase() })
      } else {
        if (bleDevice.status !== 'connected') {
          onLog({ id: ++_entryId, dir: 'error', hex: '', label: '未连接设备，请先扫描并连接' })
          return
        }
        const response = await bleDevice.send(hexToSend)
        onLog({ id: ++_entryId, dir: 'rx', hex: response, status: response.slice(-4).toUpperCase() })
      }
    } catch (e) {
      onLog({ id: ++_entryId, dir: 'error', hex: '', label: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-3 border-b border-outline-variant">
      {/* Mode tabs + TargetToggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['preset', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded font-label transition-colors ${
                mode === m ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m === 'preset' ? 'Preset' : 'Manual'}
            </button>
          ))}
        </div>
        <TargetToggle value={target} onChange={setTarget} />
      </div>

      {/* BLE connection status bar — only shown in BLE mode */}
      {target === 'ble' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container text-sm">
          <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            bleDevice.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`} />
          <span className={`flex-1 text-xs ${
            bleDevice.status === 'connected' ? 'text-on-surface' : 'text-on-surface-variant'
          }`}>
            {bleDevice.status === 'connected'
              ? bleDevice.deviceName
              : bleDevice.status === 'connecting'
              ? '连接中...'
              : '未连接'}
          </span>
          {bleDevice.status === 'connected' ? (
            <button
              onClick={bleDevice.disconnect}
              className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-500 hover:bg-red-500/25 transition">
              断开
            </button>
          ) : (
            <button
              onClick={() => bleDevice.openScanModal(bleLog)}
              disabled={bleDevice.status === 'connecting' || bleDevice.scanning}
              className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50 transition">
              {bleDevice.scanning ? '扫描中...' : '扫描设备'}
            </button>
          )}
        </div>
      )}

      {/* Preset selector or manual input */}
      {mode === 'preset' ? (
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
      ) : (
        <textarea
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="e0 01 00 00 00"
          rows={2}
          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
        />
      )}

      {/* Hex preview + Send button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 font-mono text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded truncate">
          {hexToSend || '—'}
        </div>
        <button
          onClick={send}
          disabled={!hexToSend || loading || (target === 'ble' && bleDevice.status !== 'connected')}
          className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-label font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {loading ? '...' : 'Send ▶'}
        </button>
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
