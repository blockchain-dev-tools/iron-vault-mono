import React from 'react'
import CodeBlock from '@/components/mdx/CodeBlock'
import type { MDXComponents } from 'mdx/types'

function extractCode(children: React.ReactNode): { code: string; lang: string } {
  if (!children || typeof children !== 'object') {
    return { code: String(children ?? ''), lang: 'text' }
  }
  const el = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>
  const className = el.props?.className ?? ''
  const lang = className.replace('language-', '') || 'text'
  const code = String(el.props?.children ?? '').trimEnd()
  return { code, lang }
}

export function getMdxComponents(): MDXComponents {
  return {
    pre: async (props: React.ComponentProps<'pre'>) => {
      const { code, lang } = extractCode(props.children)
      return <CodeBlock code={code} lang={lang} />
    },
  }
}
