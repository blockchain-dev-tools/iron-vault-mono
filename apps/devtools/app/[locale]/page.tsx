import { redirect } from 'next/navigation'

interface Props {
  params: { locale: string }
}

export default function LocalePage({ params: { locale } }: Props) {
  redirect(`/${locale}/docs/getting-started/introduction`)
}
