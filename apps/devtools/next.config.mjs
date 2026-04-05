import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  transpilePackages: ['@iron-vault/simulator'],
}

export default withNextIntl(withMDX(nextConfig))
