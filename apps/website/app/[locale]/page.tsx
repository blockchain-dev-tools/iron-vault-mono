import Link from 'next/link'
import Image from 'next/image'

interface Props {
  params: { locale: string }
}

const FEATURES_EN = [
  {
    icon: '📶',
    title: 'Ledger-Compatible BLE',
    desc: 'Implements the exact Ledger GATT profile so any host app (OKX, MetaMask) connects without changes.',
  },
  {
    icon: '🔑',
    title: 'ETH & Solana Support',
    desc: 'Full HD key derivation (BIP-32/44 for ETH, SLIP-10 for Solana) with secp256k1 and Ed25519 signing.',
  },
  {
    icon: '📱',
    title: 'Runs on Old Android',
    desc: 'Give your retired phone a second life as a real hardware wallet — no new hardware needed.',
  },
  {
    icon: '🔓',
    title: 'Open Source',
    desc: 'MIT licensed. Audit the code, fork it, learn from it. Security through transparency.',
  },
]

const FEATURES_ZH = [
  {
    icon: '📶',
    title: '兼容 Ledger BLE',
    desc: '完整实现 Ledger GATT 配置文件，OKX、MetaMask 等宿主应用无需修改即可直接连接。',
  },
  {
    icon: '🔑',
    title: '支持 ETH 与 Solana',
    desc: '完整的 HD 密钥派生（ETH 用 BIP-32/44，Solana 用 SLIP-10），支持 secp256k1 和 Ed25519 签名。',
  },
  {
    icon: '📱',
    title: '运行在旧 Android 手机',
    desc: '让退役手机变身真正的硬件冷钱包，无需购买新设备。',
  },
  {
    icon: '🔓',
    title: '完全开源',
    desc: 'MIT 授权。代码可审计、可 fork、可学习——透明即安全。',
  },
]

export default function LocalePage({ params: { locale } }: Props) {
  const isZh = locale === 'zh'
  const features = isZh ? FEATURES_ZH : FEATURES_EN
  const altLocale = isZh ? 'en' : 'zh'

  return (
    <main className="min-h-screen bg-background">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-outline-variant max-w-5xl mx-auto">
        <span className="flex items-center gap-2 font-headline font-bold text-on-surface">
          <Image src="/logo-dark.svg"  alt="IRON Vault" width={28} height={28} unoptimized className="logo-dark" />
          <Image src="/logo-light.svg" alt="IRON Vault" width={28} height={28} unoptimized className="logo-light" />
          IRON Vault
        </span>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/${locale}/docs/getting-started/introduction`} className="text-on-surface-variant hover:text-on-surface transition-colors">
            {isZh ? '文档' : 'Docs'}
          </Link>
          <Link href={`/${locale}/docs/apdu-protocol/debugger`} className="text-on-surface-variant hover:text-on-surface transition-colors">
            {isZh ? '调试器' : 'Debugger'}
          </Link>
          <Link href={`/${locale}/console`} className="text-on-surface-variant hover:text-on-surface transition-colors">
            {isZh ? '控制台' : 'Console'}
          </Link>
          <a href={`/${altLocale}`} className="text-on-surface-variant hover:text-on-surface transition-colors">
            {isZh ? 'EN' : '中文'}
          </a>
          <a
            href="https://github.com/blockchain-dev-tools/iron-vault-mono"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 gap-6 max-w-3xl mx-auto">
        <Image src="/logo-dark.svg"  alt="IRON Vault" width={96} height={96} unoptimized className="logo-dark" />
        <Image src="/logo-light.svg" alt="IRON Vault" width={96} height={96} unoptimized className="logo-light" />
        <h1 className="text-5xl font-headline font-bold text-on-surface">
          IRON Vault
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed">
          {isZh
            ? '让旧 Android / iOS 手机变身冷钱包。与 Ledger Nano X 协议完全兼容 — OKX、MetaMask 等任意支持 Ledger 的应用无需改动，直接通过 BLE 连接使用。'
            : 'Turn your old Android or iOS phone into a cold wallet. Plug-compatible with Ledger Nano X — OKX, MetaMask, and any Ledger-supported app connect over BLE without modification.'}
        </p>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <a
            href="https://github.com/blockchain-dev-tools/iron-vault-mono"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label font-semibold hover:opacity-90 transition-opacity"
          >
            ⭐ {isZh ? '在 GitHub 上查看' : 'View on GitHub'}
          </a>
          <Link
            href={`/${locale}/docs/getting-started/introduction`}
            className="inline-flex items-center gap-2 px-6 py-3 border border-outline rounded-xl font-label font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            {isZh ? '阅读文档 →' : 'Read the Docs →'}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-headline font-semibold text-on-surface mb-10">
          {isZh ? '核心特性' : 'Core Features'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-surface-container rounded-2xl p-6 flex flex-col gap-3 border border-outline-variant"
            >
              <div className="text-4xl">{f.icon}</div>
              <h3 className="font-headline font-semibold text-on-surface text-lg">{f.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant py-6 text-center text-xs text-on-surface-variant">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span>IRON Vault — MIT License</span>
          <Link href={`/${locale}/docs/getting-started/introduction`} className="hover:text-on-surface transition-colors">
            {isZh ? '文档' : 'Docs'}
          </Link>
          <Link href={`/${locale}/docs/apdu-protocol/debugger`} className="hover:text-on-surface transition-colors">
            {isZh ? 'APDU 调试器' : 'APDU Debugger'}
          </Link>
          <Link href={`/${locale}/console`} className="hover:text-on-surface transition-colors">
            {isZh ? '交易控制台' : 'Transaction Console'}
          </Link>
          <a href={`/${altLocale}`} className="hover:text-on-surface transition-colors">
            {isZh ? 'English' : '中文'}
          </a>
        </div>
      </footer>
    </main>
  )
}
