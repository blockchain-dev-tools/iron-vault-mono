import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#121212',
        card:   '#1E1E1E',
        card2:  '#2A2A2A',
        text2:  '#9AA0A6',
        primary:'#1A73E8',
        green:  '#34A853',
        red:    '#EA4335',
        yellow: '#F9AB00',
        sol:    '#9945FF',
      },
      fontFamily: { mono: ['ui-monospace', 'SFMono-Regular', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
