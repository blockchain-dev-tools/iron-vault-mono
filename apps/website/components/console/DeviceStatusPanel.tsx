'use client'
import { useTransport } from '@/lib/TransportContext'

export default function DeviceStatusPanel() {
  const { target, deviceName, setBle, disconnect } = useTransport()

  return (
    <div className="border-b border-outline-variant p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Device</span>
        <span className={`text-[10px] font-label px-2 py-0.5 rounded ${
          target === 'simulator' ? 'bg-primary/15 text-primary' : 'bg-green-500/15 text-green-500'
        }`}>
          {target === 'simulator' ? 'Simulator' : 'BLE'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${
          target === 'simulator' ? 'bg-primary' : 'bg-green-500 animate-pulse'
        }`} />
        <span className="text-sm text-on-surface font-label">
          {target === 'simulator' ? 'In-browser Simulator' : deviceName ?? 'Connected'}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        {target !== 'simulator' && (
          <button
            onClick={disconnect}
            className="text-xs px-3 py-1 rounded bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors font-label"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  )
}
