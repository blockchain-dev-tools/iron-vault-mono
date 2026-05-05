import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import TransportProviderWrapper from '@/components/layout/TransportProviderWrapper'

interface Props {
  children: React.ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!(routing.locales as readonly string[]).includes(locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <TransportProviderWrapper>
        {children}
      </TransportProviderWrapper>
    </NextIntlClientProvider>
  )
}
