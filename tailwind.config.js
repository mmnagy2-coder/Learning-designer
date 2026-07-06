/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens backed by CSS variables (see src/index.css for the
        // light and dark values). RGB-triple form keeps alpha modifiers working.
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        // Named `strong` (not `text-strong`) so the utility class is `text-strong`.
        strong: 'rgb(var(--text-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        // Fixed brand + learning-type colors (identical in both themes).
        accent: '#3b82f6',
        acquisition: '#06b6d4',
        collaboration: '#eab308',
        discussion: '#3b82f6',
        inquiry: '#ef4444',
        practice: '#a855f7',
        production: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
