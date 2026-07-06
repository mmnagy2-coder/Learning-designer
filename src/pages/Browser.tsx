// VISUAL DESIGN BRIEF: A calm library layout — a left sidebar of section tabs on desktop that
// collapses into a horizontal top tab bar below 768px, with the active section's content
// (My Designs, My Public Space, or the Collaborative placeholder) filling the remaining space.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDesigns } from '../hooks/useDesigns'
import { MyDesigns } from '../components/browser/MyDesigns'
import { Directory } from '../components/browser/Directory'
import { useHapticProps } from '../components/shared/motion'

type Section = 'mine' | 'public' | 'collaborative'

const sections: { id: Section; label: string }[] = [
  { id: 'mine', label: 'My Designs' },
  { id: 'public', label: 'My Public Space' },
  { id: 'collaborative', label: 'Collaborative Designs' },
]

export function Browser() {
  const { designs, loaded, duplicateDesign, deleteDesign } = useDesigns()
  const [section, setSection] = useState<Section>('mine')
  const haptic = useHapticProps()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-100">Browser</h1>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-48 md:flex-none md:flex-col md:overflow-visible">
          {sections.map((s) => (
            <motion.button
              {...haptic}
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-left text-sm font-medium transition-colors ${
                section === s.id ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {s.label}
            </motion.button>
          ))}
        </nav>

        <div className="flex-1">
          {section === 'mine' && (
            <MyDesigns designs={designs} loaded={loaded} onDuplicate={duplicateDesign} onDelete={deleteDesign} />
          )}
          {section === 'public' && <Directory designs={designs} loaded={loaded} />}
          {section === 'collaborative' && (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-text-muted">
              Collaborative Designs is coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
