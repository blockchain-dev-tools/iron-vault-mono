import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { setRequestLocale } from 'next-intl/server'
import DocsLayout from '@/components/layout/DocsLayout'
import TocScrollSpy from '@/components/layout/TocScrollSpy'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import PrevNext from '@/components/layout/PrevNext'
import { getMdxComponents } from '@/lib/mdx-components'
import { getAllSlugs } from '@/lib/mdx'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'

interface Props {
  params: { locale: string; slug: string[] }
}

const CONTENT_DIR = path.join(process.cwd(), 'content/docs')

async function getMdxContent(locale: string, slug: string[]) {
  const filePath = path.join(CONTENT_DIR, locale, ...slug) + '.mdx'
  if (!fs.existsSync(filePath)) {
    // Fallback to 'en' if locale-specific file doesn't exist
    const fallback = path.join(CONTENT_DIR, 'en', ...slug) + '.mdx'
    if (!fs.existsSync(fallback)) return null
    return getMdxContent('en', slug)
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data: frontmatter, content } = matter(raw)
  const { content: compiled } = await compileMDX({
    source: content,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
    components: getMdxComponents(),
  })
  return { frontmatter, compiled }
}

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getAllSlugs(locale).map(slug => ({ locale, slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getMdxContent(params.locale, params.slug)
  if (!result) return {}
  return {
    title: result.frontmatter.title as string,
    description: result.frontmatter.description as string,
  }
}

export default async function DocPage({ params }: Props) {
  setRequestLocale(params.locale)
  const result = await getMdxContent(params.locale, params.slug)
  if (!result) notFound()

  return (
    <DocsLayout toc={<TocScrollSpy />}>
      <article className="px-10 py-8 max-w-3xl">
        <Breadcrumbs />
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
          {result.frontmatter.title as string}
        </h1>
        {result.frontmatter.description && (
          <p className="text-on-surface-variant font-body text-base mb-8 leading-relaxed">
            {result.frontmatter.description as string}
          </p>
        )}
        <div className="prose">{result.compiled}</div>
        <PrevNext slug={params.slug} />
      </article>
    </DocsLayout>
  )
}
