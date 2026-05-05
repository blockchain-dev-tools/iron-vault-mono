import React from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

interface ConsoleLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
  deviceBar: React.ReactNode
}

export default function ConsoleLayout({ left, right, deviceBar }: ConsoleLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {left}
        </main>
        <aside className="w-[360px] flex-shrink-0 border-l border-outline-variant overflow-y-auto flex flex-col">
          {deviceBar}
          <div className="flex-1">
            {right}
          </div>
        </aside>
      </div>
    </div>
  )
}
