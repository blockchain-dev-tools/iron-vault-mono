'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    const lang =
      typeof navigator !== 'undefined' && navigator.language.startsWith('zh')
        ? 'zh'
        : 'en'
    router.replace(`/${lang}`)
  }, [router])
  return null
}
