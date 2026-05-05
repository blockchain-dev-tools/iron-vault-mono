'use client'
import { useState } from 'react'
import DebuggerLayout from '@/components/layout/DebuggerLayout'
import Tier1ApduInput, { type LogEntry } from '@/components/debugger/Tier1ApduInput'
import ApduLog from '@/components/debugger/ApduLog'
import SimulatorPanel from '@/components/simulator/SimulatorPanel'

export default function DebuggerPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])

  return (
    <DebuggerLayout
      center={
        <div className="flex flex-col h-full">
          <Tier1ApduInput onLog={entry => setEntries(prev => [...prev, entry])} />
          <ApduLog entries={entries} onClear={() => setEntries([])} />
        </div>
      }
      right={<SimulatorPanel />}
    />
  )
}
