import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8edf4',
          100: '#c5d2e3',
          200: '#9eb5d0',
          300: '#7797bd',
          400: '#5981ae',
          500: '#1e3a5f', // main brand
          600: '#1a3354',
          700: '#152b47',
          800: '#10223a',
          900: '#0b1a2d',
        },
        accent: {
          blue: '#4a90e2',
          green: '#4caf50',
          orange: '#ff9800',
          red: '#e74c3c',
          yellow: '#ffc107',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
