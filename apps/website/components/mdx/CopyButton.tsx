'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function CopyButton({ code }: { code: string }) {
  const t = useTranslations('codeBlock')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] font-label text-on-surface-variant hover:text-on-surface transition-colors"
      aria-label={t('copy')}
    >
      <span className="material-symbols-outlined text-[14px]">
        {copied ? 'check' : 'content_copy'}
      </span>
      {copied ? t('copied') : t('copy')}
    </button>
  )
}
