'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ThemeToggle() {
  const t = useTranslations('theme')
  const [light, setLight] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      document.documentElement.classList.add('light-theme')
      setLight(true)
    }
  }, [])

  function toggle() {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('light-theme', next)
    localStorage.setItem('theme', next ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      title={t('toggle')}
      className="flex items-center justify-center w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">
        {light ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}
