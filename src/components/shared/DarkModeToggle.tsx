// Small icon toggle in the nav bar. Reads the persisted theme choice (or system preference)
// on mount, then flips the `dark` class on <html> and remembers the user's explicit choice.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useHapticProps } from './motion'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const haptic = useHapticProps()

  useEffect(() => {
    const stored = window.localStorage.getItem('ld_theme')
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    window.localStorage.setItem('ld_theme', next ? 'dark' : 'light')
  }

  return (
    <motion.button
      {...haptic}
      onClick={toggle}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-text-primary hover:bg-ink/10 transition-colors"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </motion.button>
  )
}
