'use client'
import { useState } from 'react'
import DebuggerLayout from '@/components/layout/DebuggerLayout'
import CommandBuilder, { type LogEntry } from '@/components/debugger/CommandBuilder'
import ApduLog from '@/components/debugger/ApduLog'
import SimulatorPanel from '@/components/simulator/SimulatorPanel'

export default function DebuggerPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])

  return (
    <DebuggerLayout
      center={
        <div className="flex flex-col h-full">
          <CommandBuilder onLog={entry => setEntries(prev => [...prev, entry])} />
          <ApduLog entries={entries} onClear={() => setEntries([])} />
        </div>
      }
      right={<SimulatorPanel />}
    />
  )
}
