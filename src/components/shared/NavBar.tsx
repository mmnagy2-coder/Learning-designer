// VISUAL DESIGN BRIEF: A slim glass bar pinned to the top of every page. Desktop shows the
// logo, three text tabs, and the theme toggle in a single row. Below 768px the tabs collapse
// into a hamburger button that reveals a slide-down glass panel with full-width tap targets.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Menu, X, Hexagon } from 'lucide-react'
import { DarkModeToggle } from './DarkModeToggle'
import { useHapticProps } from './motion'

const links = [
  { to: '/', label: 'Start' },
  { to: '/browser', label: 'Browser' },
  { to: '/designer', label: 'Designer' },
]

function navLinkClass(isActive: boolean) {
  return `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary'
  }`
}

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const haptic = useHapticProps()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-text-primary font-semibold">
          <Hexagon size={22} className="text-accent" fill="#3b82f6" fillOpacity={0.2} />
          <span>Learning Designer</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => navLinkClass(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <DarkModeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <DarkModeToggle />
          <motion.button
            {...haptic}
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-primary"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-surface/95"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `${navLinkClass(isActive)} w-full`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
