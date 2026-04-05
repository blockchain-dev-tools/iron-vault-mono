export interface NavItem {
  title: string
  href: string
}

export interface NavSection {
  title: string      // English display name
  titleKey: string   // i18n key for nav.sections.*
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    title: 'Getting Started',
    titleKey: 'gettingStarted',
    items: [
      { title: 'Introduction', href: '/docs/getting-started/introduction' },
      { title: 'Quick Start', href: '/docs/getting-started/quick-start' },
      { title: 'Architecture', href: '/docs/getting-started/architecture' },
    ],
  },
  {
    title: 'BLE Integration',
    titleKey: 'bleIntegration',
    items: [
      { title: 'GATT Profile', href: '/docs/ble-integration/gatt-profile' },
      { title: 'Connection Flow', href: '/docs/ble-integration/connection-flow' },
      { title: 'APDU Framing', href: '/docs/ble-integration/apdu-framing' },
    ],
  },
  {
    title: 'APDU Protocol',
    titleKey: 'apduProtocol',
    items: [
      { title: 'Overview', href: '/docs/apdu-protocol/overview' },
      { title: 'Ethereum Commands', href: '/docs/apdu-protocol/ethereum' },
      { title: 'Solana Commands', href: '/docs/apdu-protocol/solana' },
    ],
  },
  {
    title: 'Crypto Reference',
    titleKey: 'cryptoReference',
    items: [
      { title: 'Key Derivation', href: '/docs/crypto-reference/key-derivation' },
      { title: 'Signing Formats', href: '/docs/crypto-reference/signing-formats' },
    ],
  },
  {
    title: 'API Reference',
    titleKey: 'apiReference',
    items: [
      { title: '@iron-vault/apdu', href: '/docs/api-reference/apdu' },
      { title: '@iron-vault/crypto', href: '/docs/api-reference/crypto' },
    ],
  },
]

export function flatNavItems(): NavItem[] {
  return NAV.flatMap(s => s.items)
}
