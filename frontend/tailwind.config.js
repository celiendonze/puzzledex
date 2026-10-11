/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atelier: {
          bg: 'var(--bg-main)',
          surface: 'var(--bg-surface)',
          subtle: 'var(--bg-subtle)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          primary: 'var(--primary)',
          primaryHover: 'var(--primary-hover)',
          primaryLight: 'var(--primary-light)',
          sauge: 'var(--accent-green)',
          saugeLight: 'var(--accent-green-light)',
          amber: 'var(--accent-amber)',
          amberLight: 'var(--accent-amber-light)',
          border: 'var(--border)',
          borderDark: 'var(--border-dark)',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
