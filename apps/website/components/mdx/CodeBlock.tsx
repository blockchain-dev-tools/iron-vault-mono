import { codeToHtml } from 'shiki'
import CopyButton from './CopyButton'

interface Props {
  code: string
  lang?: string
  filename?: string
}

export default async function CodeBlock({ code, lang = 'text', filename }: Props) {
  let html: string
  try {
    html = await codeToHtml(code, { lang, theme: 'github-dark' })
  } catch {
    // Fallback for unknown languages
    html = await codeToHtml(code, { lang: 'text', theme: 'github-dark' })
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-outline-variant/60 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/40 bg-[#161b22]">
        <span className="text-xs font-label text-on-surface-variant">
          {filename ?? (lang !== 'text' ? lang : '')}
        </span>
        <CopyButton code={code} />
      </div>
      <div
        className="overflow-x-auto text-sm [&>pre]:p-4 [&>pre]:m-0 [&>pre]:!bg-transparent [&>pre]:overflow-x-visible"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
