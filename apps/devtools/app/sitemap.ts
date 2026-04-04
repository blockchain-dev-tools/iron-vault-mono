import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/mdx'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://devtools.oldphonewallet.dev'
  const docSlugs = getAllSlugs()

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/debugger`, lastModified: new Date() },
    ...docSlugs.map(slug => ({
      url: `${base}/docs/${slug.join('/')}`,
      lastModified: new Date(),
    })),
  ]
}
