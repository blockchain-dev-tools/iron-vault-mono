// Main components
export { default as WalletSimulator } from './components/WalletSimulator'
export { default as PhoneFrame } from './components/PhoneFrame'

// UI components (re-exported for use in consuming apps)
export { default as Button } from './components/ui/Button'
export { default as Card } from './components/ui/Card'
export { default as SectionLabel } from './components/ui/SectionLabel'
export { default as BleStatus } from './components/ui/BleStatus'
export type { BleState } from './components/ui/BleStatus'
export { default as PinDots } from './components/ui/PinDots'
export { default as PinPad } from './components/ui/PinPad'
export { default as TopBar } from './components/ui/TopBar'
export { default as BottomNav } from './components/ui/BottomNav'
export { default as ThemeToggle } from './components/ui/ThemeToggle'

// Hooks (for advanced use cases)
export { useNav } from './lib/nav'
export { useApp } from './lib/app-context'
export type { ScreenId, NavDirection } from './lib/nav'

// APDU bridge
export { createSimulatorBridge } from './lib/apdu-bridge'
export type { SimulatorBridge, SimulatorState, SimulatorBridgeOptions } from './lib/apdu-bridge'
