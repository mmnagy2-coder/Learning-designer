/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f1a',
        surface: '#1a1a2e',
        elevated: '#16213e',
        border: '#0f3460',
        'text-primary': '#e2e8f0',
        'text-muted': '#94a3b8',
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
