'use client'
import { useState } from 'react'
import ConsoleLayout from '@/components/layout/ConsoleLayout'
import ChainSelector, { type ChainId } from '@/components/console/ChainSelector'
import EthereumTxForm from '@/components/console/EthereumTxForm'
import SolanaTxForm from '@/components/console/SolanaTxForm'
import DeviceStatusPanel from '@/components/console/DeviceStatusPanel'
import { useTransport } from '@/lib/TransportContext'

export default function ConsolePage() {
  const [chain, setChain] = useState<ChainId>('ethereum')
  const { transport } = useTransport()

  return (
    <ConsoleLayout
      left={
        <div className="p-6 space-y-6">
          <ChainSelector value={chain} onChange={setChain} />
          {chain === 'ethereum' && <EthereumTxForm transport={transport} />}
          {chain === 'solana' && <SolanaTxForm transport={transport} />}
        </div>
      }
      right={
        <div className="p-4">
          <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-3">APDU Activity</p>
          <p className="text-xs text-on-surface-variant/70 text-center py-8">
            Transaction APDU sent to device will appear here.
          </p>
        </div>
      }
      deviceBar={<DeviceStatusPanel />}
    />
  )
}
