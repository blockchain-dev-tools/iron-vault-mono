import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
})

const nextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  transpilePackages: ['@iron-vault/simulator', '@iron-vault/apdu', '@iron-vault/crypto', '@iron-vault/wallet'],
}

export default withNextIntl(withMDX(nextConfig))
