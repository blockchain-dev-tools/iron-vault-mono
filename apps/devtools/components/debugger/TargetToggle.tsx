'use client'

export type DebugTarget = 'simulator' | 'ble'

interface TargetToggleProps {
  value: DebugTarget
  onChange: (v: DebugTarget) => void
}

export default function TargetToggle({ value, onChange }: TargetToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
      {(['simulator', 'ble'] as DebugTarget[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1 rounded text-xs font-label transition-colors ${
            value === t
              ? 'bg-primary text-on-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t === 'simulator' ? 'Simulator' : 'BLE Device'}
        </button>
      ))}
    </div>
  )
}
