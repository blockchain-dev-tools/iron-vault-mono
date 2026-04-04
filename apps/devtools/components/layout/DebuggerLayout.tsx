import React from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

interface DebuggerLayoutProps {
  center: React.ReactNode
  right: React.ReactNode
}

export default function DebuggerLayout({ center, right }: DebuggerLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {center}
        </main>
        <aside className="w-[360px] flex-shrink-0 border-l border-outline-variant overflow-hidden">
          {right}
        </aside>
      </div>
    </div>
  )
}
