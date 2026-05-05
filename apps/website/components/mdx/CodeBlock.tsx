import { codeToHtml, type ThemeRegistration } from 'shiki'
import CopyButton from './CopyButton'

const cssVarsTheme: ThemeRegistration = {
  name: 'css-vars',
  type: 'dark',
  colors: {
    'editor.foreground': 'var(--shiki-color-text)',
    'editor.background': 'var(--shiki-color-background)',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--shiki-token-comment)' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: 'var(--shiki-token-keyword)' } },
    { scope: ['string', 'string.template', 'string.quoted'], settings: { foreground: 'var(--shiki-token-string)' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: 'var(--shiki-token-function)' } },
    { scope: ['constant', 'variable.language', 'constant.language'], settings: { foreground: 'var(--shiki-token-constant)' } },
    { scope: ['parameter', 'variable.parameter'], settings: { foreground: 'var(--shiki-token-parameter)' } },
    { scope: ['constant.numeric'], settings: { foreground: 'var(--shiki-token-number)' } },
    { scope: ['support.type.builtin', 'entity.name.type'], settings: { foreground: 'var(--shiki-token-builtin)' } },
    { scope: ['punctuation', 'delimiter'], settings: { foreground: 'var(--shiki-token-punctuation)' } },
    { scope: ['string.link', 'markup.underline.link'], settings: { foreground: 'var(--shiki-token-link)' } },
    { scope: ['string.expression', 'string.interpolation'], settings: { foreground: 'var(--shiki-token-string-expression)' } },
    { scope: ['entity.name.class', 'entity.other.inherited-class'], settings: { foreground: 'var(--shiki-token-constructor)' } },
  ],
}

interface Props {
  code: string
  lang?: string
  filename?: string
}

export default async function CodeBlock({ code, lang = 'text', filename }: Props) {
  let html: string
  try {
    html = await codeToHtml(code, { lang, theme: cssVarsTheme })
  } catch {
    html = await codeToHtml(code, { lang: 'text', theme: cssVarsTheme })
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-outline-variant/60 bg-[var(--code-bg)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/40 bg-[var(--code-header-bg)]">
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
