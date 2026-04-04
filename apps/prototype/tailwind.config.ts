import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}',
  '../../packages/simulator/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:                    'var(--c-primary)',
        'on-primary':               'var(--c-on-primary)',
        background:                 'var(--c-background)',
        surface:                    'var(--c-surface)',
        'surface-container':        'var(--c-surface-container)',
        'surface-container-low':    'var(--c-surface-container-low)',
        'surface-container-high':   'var(--c-surface-container-high)',
        'on-surface':               'var(--c-on-surface)',
        'on-surface-variant':       'var(--c-on-surface-variant)',
        outline:                    'var(--c-outline)',
        'outline-variant':          'var(--c-outline-variant)',
        error:                      'var(--c-error)',
        'error-container':          'var(--c-error-container)',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body:     ['Manrope', 'sans-serif'],
        label:    ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm:  '0.125rem',
        md:  '0.25rem',
        lg:  '0.25rem',
        xl:  '0.5rem',
        '2xl': '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        primary:    '0 0 25px rgba(143, 195, 34, 0.3)',
        'primary-sm':'0 0 12px rgba(143, 195, 34, 0.15)',
        'glow-lg':  '0 12px 40px rgba(143, 195, 34, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
