'use client'
import { TransportProvider } from '@/lib/TransportContext'

export default function TransportProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TransportProvider>{children}</TransportProvider>
}
