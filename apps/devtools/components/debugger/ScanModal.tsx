'use client'
import { type ScannedDevice } from '@/lib/ble-transport'
import { type BleStatus } from '@/hooks/useBleDevice'

interface ScanModalProps {
  status: BleStatus
  scanning: boolean
  scannedDevices: ScannedDevice[]
  connectingDeviceId: string | null
  onStop: () => void
  onRescan: () => void
  onConnect: (d: ScannedDevice) => void
  onClose: () => void
}

export default function ScanModal({
  status, scanning, scannedDevices, connectingDeviceId,
  onStop, onRescan, onConnect, onClose,
}: ScanModalProps) {
  const rssiBar = (rssi: number | null) => {
    if (rssi === null) return '—'
    if (rssi >= -60) return '▂▄▆█'
    if (rssi >= -75) return '▂▄▆░'
    if (rssi >= -90) return '▂▄░░'
    return '▂░░░'
  }
  const rssiColor = (rssi: number | null) => {
    if (rssi === null) return 'text-on-surface-variant'
    if (rssi >= -60) return 'text-green-500'
    if (rssi >= -75) return 'text-yellow-500'
    return 'text-red-500'
  }

  const sorted = [...scannedDevices].sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-base font-semibold text-on-surface">扫描附近设备</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              🔑 标记为 Ledger 服务的设备可直接连接
            </p>
          </div>
          <div className="flex items-center gap-3">
            {scanning ? (
              <button
                onClick={onStop}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface transition">
                停止扫描
              </button>
            ) : (
              <button
                onClick={onRescan}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition">
                重新扫描
              </button>
            )}
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface text-xl leading-none transition px-1">
              ×
            </button>
          </div>
        </div>

        {/* Scanning indicator */}
        {scanning && (
          <div className="flex items-center gap-2 px-6 py-2 bg-primary/5 border-b border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary">
              扫描中... 已发现 {scannedDevices.length} 个设备
            </span>
          </div>
        )}

        {/* Device list */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              {scanning ? '正在扫描附近蓝牙设备...' : '未发现设备，请重新扫描'}
            </div>
          ) : sorted.map(d => (
            <div key={d.device.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container/50 transition">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                d.isLedger ? 'bg-primary/15' : 'bg-surface-container'
              }`}>
                {d.isLedger ? '🔑' : '📡'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-on-surface truncate">{d.name}</span>
                  {d.isLedger && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium shrink-0">
                      Ledger
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="font-mono text-xs text-on-surface-variant truncate">
                    {d.device.id.slice(0, 16)}…
                  </span>
                  <span className={`font-mono text-xs shrink-0 ${rssiColor(d.rssi)}`}>
                    {rssiBar(d.rssi)} {d.rssi ?? '?'} dBm
                  </span>
                </div>
              </div>

              <button
                onClick={() => onConnect(d)}
                disabled={connectingDeviceId === d.device.id || status === 'connecting'}
                className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  d.isLedger
                    ? 'bg-primary text-on-primary hover:opacity-90'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {connectingDeviceId === d.device.id ? '连接中...' : '连接'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant text-xs text-on-surface-variant">
          ⚠️ 需要 Chrome 并开启{' '}
          <code className="mx-1 bg-surface-container px-1 rounded">
            chrome://flags/#enable-experimental-web-platform-features
          </code>
        </div>
      </div>
    </div>
  )
}
