import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/simulator/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:                 'var(--c-primary)',
        'on-primary':            'var(--c-on-primary)',
        background:              'var(--c-background)',
        surface:                 'var(--c-surface)',
        'surface-container':     'var(--c-surface-container)',
        'surface-container-low': 'var(--c-surface-container-low)',
        'on-surface':            'var(--c-on-surface)',
        'on-surface-variant':    'var(--c-on-surface-variant)',
        outline:                 'var(--c-outline)',
        'outline-variant':       'var(--c-outline-variant)',
        error:                   'var(--c-error)',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body:     ['Manrope', 'sans-serif'],
        label:    ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
