import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BLE Wallet Debugger',
  description: 'OKX-style Ledger BLE debugger for OldPhone Wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-bg text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
