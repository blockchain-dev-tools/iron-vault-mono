import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'
import '@iron-vault/simulator/styles.css'

const SearchModal = dynamic(() => import('@/components/search/SearchModal'), { ssr: false })

export const metadata: Metadata = {
  metadataBase: new URL('https://ironvault.dev'),
  title: {
    default: 'Iron Vault',
    template: '%s | Iron Vault',
  },
  description: 'BLE hardware wallet emulator for old Android phones — developer docs, APDU debugger, and wallet simulator.',
  openGraph: {
    siteName: 'Iron Vault',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {/* Prevent FOUC: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light-theme')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-body bg-background text-on-surface">
        {children}
        <SearchModal />
      </body>
    </html>
  )
}
