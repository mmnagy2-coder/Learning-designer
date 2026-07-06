// VISUAL DESIGN BRIEF: A calm browsing view — staggered grid of cards each showing a mini pie
// chart of its learning-type balance, a keyword search box, and a collapsed-by-default
// Advanced Filters panel for narrowing by learning type, mode of delivery, or outcome level.
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import type { Design, LearningType, ModeOfDelivery } from '../../types'
import { LEARNING_TYPES } from '../../utils/learningTypeConfig'
import { computeAnalytics } from '../../utils/calculateAnalytics'
import { useStaggerVariants, useHapticProps } from '../shared/motion'
import { Collapsible } from '../shared/Collapsible'
import { SkeletonCard, useMinLoadingTime } from '../shared/SkeletonCard'
import { DesignCard } from './DesignCard'

const MODES: ModeOfDelivery[] = ['face-to-face', 'blended', 'wholly-online', 'async-online']

interface DirectoryProps {
  designs: Design[]
  loaded: boolean
}

export function Directory({ designs, loaded }: DirectoryProps) {
  const ready = useMinLoadingTime(loaded)
  const { container } = useStaggerVariants()
  const haptic = useHapticProps()
  const [keyword, setKeyword] = useState('')
  const [typeFilters, setTypeFilters] = useState<Set<LearningType>>(new Set())
  const [modeFilters, setModeFilters] = useState<Set<ModeOfDelivery>>(new Set())
  const [outcomeFilters, setOutcomeFilters] = useState<Set<string>>(new Set())

  const allOutcomes = useMemo(() => {
    const set = new Set<string>()
    designs.forEach((d) => d.outcomes.forEach((o) => set.add(o)))
    return Array.from(set).sort()
  }, [designs])

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  const filtered = designs.filter((d) => {
    if (keyword && !`${d.name} ${d.topic}`.toLowerCase().includes(keyword.toLowerCase())) return false
    if (modeFilters.size > 0 && !modeFilters.has(d.modeOfDelivery)) return false
    if (outcomeFilters.size > 0 && !d.outcomes.some((o) => outcomeFilters.has(o))) return false
    if (typeFilters.size > 0) {
      const analytics = computeAnalytics(d)
      const usedTypes = new Set(analytics.byLearningType.filter((t) => t.minutes > 0).map((t) => t.type))
      const matches = Array.from(typeFilters).some((t) => usedTypes.has(t))
      if (!matches) return false
    }
    return true
  })

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by name or topic"
          aria-label="Search designs"
          className="w-full rounded-xl border border-ink/10 bg-ink/5 py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <Collapsible title="Advanced Filters" className="mb-6 rounded-2xl border border-ink/10 bg-ink/5 px-4 backdrop-blur-lg">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Learning type</p>
            <div className="flex flex-wrap gap-2">
              {LEARNING_TYPES.map((cfg) => (
                <motion.button
                  {...haptic}
                  key={cfg.type}
                  type="button"
                  onClick={() => toggle(typeFilters, cfg.type, setTypeFilters)}
                  aria-pressed={typeFilters.has(cfg.type)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    typeFilters.has(cfg.type) ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                  }`}
                >
                  {cfg.label}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Mode of delivery</p>
            <div className="flex flex-wrap gap-2">
              {MODES.map((mode) => (
                <motion.button
                  {...haptic}
                  key={mode}
                  type="button"
                  onClick={() => toggle(modeFilters, mode, setModeFilters)}
                  aria-pressed={modeFilters.has(mode)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    modeFilters.has(mode) ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                  }`}
                >
                  {mode.replace(/-/g, ' ')}
                </motion.button>
              ))}
            </div>
          </div>
          {allOutcomes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Outcome / level</p>
              <div className="flex flex-wrap gap-2">
                {allOutcomes.map((outcome) => (
                  <motion.button
                    {...haptic}
                    key={outcome}
                    type="button"
                    onClick={() => toggle(outcomeFilters, outcome, setOutcomeFilters)}
                    aria-pressed={outcomeFilters.has(outcome)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      outcomeFilters.has(outcome) ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                    }`}
                  >
                    {outcome}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Collapsible>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/10 p-12 text-center text-text-muted">
          No designs match your filters.
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((design) => (
            <DesignCard key={design.id} design={design} showPieChart />
          ))}
        </motion.div>
      )}
    </div>
  )
}
