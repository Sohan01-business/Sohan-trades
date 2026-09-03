/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: 'rgb(var(--color-base) / <alpha-value>)',
          raised: 'rgb(var(--color-base-raised) / <alpha-value>)',
          overlay: 'rgb(var(--color-base-overlay) / <alpha-value>)',
          border: 'rgb(var(--color-base-border) / <alpha-value>)'
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)'
        },
        profit: {
          DEFAULT: 'rgb(var(--color-profit) / <alpha-value>)',
          dim: 'rgb(var(--color-profit-dim) / <alpha-value>)'
        },
        loss: {
          DEFAULT: 'rgb(var(--color-loss) / <alpha-value>)',
          dim: 'rgb(var(--color-loss-dim) / <alpha-value>)'
        },
        warn: {
          DEFAULT: 'rgb(var(--color-warn) / <alpha-value>)',
          dim: 'rgb(var(--color-warn-dim) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          dim: 'rgb(var(--color-accent-dim) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      borderRadius: {
        card: '14px',
        pill: '999px'
      }
    }
  },
  plugins: []
}
