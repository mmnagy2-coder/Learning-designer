// VISUAL DESIGN BRIEF: The glassmorphic header anchoring the Designer page. Two columns on
// desktop — form fields on the left, mode/aims/outcomes plus the live pie chart on the right —
// collapsing to a single stacked column below 768px so the pie chart never crowds the fields.
import { motion } from 'framer-motion'
import type { Design, ModeOfDelivery } from '../../types'
import { LivePieChart } from './LivePieChart'
import { useHapticProps } from '../shared/motion'

const MODES: { value: ModeOfDelivery; label: string }[] = [
  { value: 'face-to-face', label: 'Face-to-face' },
  { value: 'blended', label: 'Blended' },
  { value: 'wholly-online', label: 'Wholly online' },
  { value: 'async-online', label: 'Async online' },
]

const OUTCOME_OPTIONS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']

interface MetadataHeaderProps {
  design: Design
  onChange: (design: Design) => void
}

export function MetadataHeader({ design, onChange }: MetadataHeaderProps) {
  const haptic = useHapticProps()
  const hours = Math.floor(design.learningTimeMinutes / 60)
  const minutes = design.learningTimeMinutes % 60

  function patch(partial: Partial<Design>) {
    onChange({ ...design, ...partial })
  }

  function setLearningTime(h: number, m: number) {
    patch({ learningTimeMinutes: Math.max(0, h) * 60 + Math.max(0, Math.min(59, m)) })
  }

  function toggleOutcome(outcome: string) {
    const has = design.outcomes.includes(outcome)
    patch({ outcomes: has ? design.outcomes.filter((o) => o !== outcome) : [...design.outcomes, outcome] })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-lg">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="design-name" className="mb-1 block text-xs font-medium text-text-muted">
              Name
            </label>
            <input
              id="design-name"
              value={design.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="design-topic" className="mb-1 block text-xs font-medium text-text-muted">
              Topic
            </label>
            <input
              id="design-topic"
              value={design.topic}
              onChange={(e) => patch({ topic: e.target.value })}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label htmlFor="design-hours" className="mb-1 block text-xs font-medium text-text-muted">
                Learning time
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="design-hours"
                  type="number"
                  min={0}
                  value={hours}
                  onChange={(e) => setLearningTime(Number(e.target.value), minutes)}
                  className="w-16 rounded-lg bg-white/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Learning time hours"
                />
                <span className="text-xs text-text-muted">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setLearningTime(hours, Number(e.target.value))}
                  className="w-16 rounded-lg bg-white/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Learning time minutes"
                />
                <span className="text-xs text-text-muted">min</span>
              </div>
            </div>

            <div>
              <label htmlFor="design-class-size" className="mb-1 block text-xs font-medium text-text-muted">
                Size of class
              </label>
              <input
                id="design-class-size"
                type="number"
                min={1}
                value={design.sizeOfClass}
                onChange={(e) => patch({ sizeOfClass: Math.max(1, Number(e.target.value)) })}
                className="w-20 rounded-lg bg-white/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="design-description" className="mb-1 block text-xs font-medium text-text-muted">
              Description
            </label>
            <textarea
              id="design-description"
              value={design.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="design-mode" className="mb-1 block text-xs font-medium text-text-muted">
                  Mode of delivery
                </label>
                <select
                  id="design-mode"
                  value={design.modeOfDelivery}
                  onChange={(e) => patch({ modeOfDelivery: e.target.value as ModeOfDelivery })}
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value} className="bg-surface">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="design-aims" className="mb-1 block text-xs font-medium text-text-muted">
                  Aims
                </label>
                <textarea
                  id="design-aims"
                  value={design.aims}
                  onChange={(e) => patch({ aims: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="hidden shrink-0 sm:block">
              <LivePieChart design={design} size={140} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">Outcomes</p>
            <div className="flex flex-wrap gap-2">
              {OUTCOME_OPTIONS.map((outcome) => {
                const active = design.outcomes.includes(outcome)
                return (
                  <motion.button
                    {...haptic}
                    key={outcome}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleOutcome(outcome)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      active ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 text-text-muted'
                    }`}
                  >
                    {outcome}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center sm:hidden">
            <LivePieChart design={design} size={160} />
          </div>
        </div>
      </div>
    </div>
  )
}
