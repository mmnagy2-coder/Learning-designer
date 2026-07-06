// VISUAL DESIGN BRIEF: The glassmorphic header anchoring the Designer page. Two columns on
// desktop — form fields on the left, mode/aims/outcomes plus the live pie chart on the right —
// collapsing to a single stacked column below 768px so the pie chart never crowds the fields.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { Design, ModeOfDelivery } from '../../types'
import { LivePieChart } from './LivePieChart'
import { useHapticProps } from '../shared/motion'
import { useModules } from '../../hooks/useModules'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useAI, stripCodeFences } from '../ai/useAI'

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
  const { modules, createModule } = useModules()
  const [creatingModule, setCreatingModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const hours = Math.floor(design.learningTimeMinutes / 60)
  const minutes = design.learningTimeMinutes % 60

  function patch(partial: Partial<Design>) {
    onChange({ ...design, ...partial })
  }

  function handleModuleSelect(value: string) {
    if (value === '__new__') {
      setCreatingModule(true)
      return
    }
    patch({ moduleId: value || undefined })
  }

  function confirmNewModule() {
    if (!newModuleName.trim()) return
    const module = createModule(newModuleName)
    patch({ moduleId: module.id })
    setNewModuleName('')
    setCreatingModule(false)
  }

  function setLearningTime(h: number, m: number) {
    patch({ learningTimeMinutes: Math.max(0, h) * 60 + Math.max(0, Math.min(59, m)) })
  }

  function toggleOutcome(outcome: string) {
    const has = design.outcomes.includes(outcome)
    patch({ outcomes: has ? design.outcomes.filter((o) => o !== outcome) : [...design.outcomes, outcome] })
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
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
              className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
              className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-40 flex-1">
              <label htmlFor="design-module" className="mb-1 block text-xs font-medium text-text-muted">
                Module
              </label>
              {creatingModule ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    aria-label="New module name"
                    placeholder="e.g. Screen Fundamentals"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmNewModule()
                      if (e.key === 'Escape') setCreatingModule(false)
                    }}
                    className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <motion.button
                    {...haptic}
                    type="button"
                    onClick={confirmNewModule}
                    className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white"
                  >
                    Create
                  </motion.button>
                </div>
              ) : (
                <select
                  id="design-module"
                  value={design.moduleId ?? ''}
                  onChange={(e) => handleModuleSelect(e.target.value)}
                  className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="" className="bg-surface">
                    No module
                  </option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id} className="bg-surface">
                      {m.name}
                    </option>
                  ))}
                  <option value="__new__" className="bg-surface">
                    + New module…
                  </option>
                </select>
              )}
            </div>

            <div>
              <label htmlFor="design-session-date" className="mb-1 block text-xs font-medium text-text-muted">
                Session date
              </label>
              <input
                id="design-session-date"
                type="date"
                value={design.sessionDate ?? ''}
                onChange={(e) => patch({ sessionDate: e.target.value || undefined })}
                className="rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
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
                  className="w-16 rounded-lg bg-ink/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Learning time hours"
                />
                <span className="text-xs text-text-muted">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setLearningTime(hours, Number(e.target.value))}
                  className="w-16 rounded-lg bg-ink/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
                className="w-20 rounded-lg bg-ink/5 px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
              className="w-full resize-none rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full resize-none rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
                      active ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                    }`}
                  >
                    {outcome}
                  </motion.button>
                )
              })}
            </div>
            <OutcomeSuggestions design={design} onChange={onChange} />
          </div>

          <div className="flex justify-center sm:hidden">
            <LivePieChart design={design} size={160} />
          </div>
        </div>
      </div>
    </div>
  )
}

const OUTCOMES_SYSTEM_PROMPT = `You are an expert learning designer for higher education film and media production. Given a session's name, topic, and aims, write 4-6 specific, assessable learning outcome statements for undergraduate film production students. Each starts with an action verb (Bloom's taxonomy) and names concrete subject content, e.g. "Apply focus-pulling technique to a two-person dialogue scene". Return ONLY a valid JSON array of strings with no markdown fences and no other text.`

/** Bloom's quick-tag chips live above; this adds AI-drafted subject-specific outcome
 * statements the user can add one by one, plus removable chips for any already added. */
function OutcomeSuggestions({ design, onChange }: MetadataHeaderProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [model] = useLocalStorage('ld_claude_model', 'claude-3-5-sonnet-20241022')
  const { send, loading, error } = useAI()
  const haptic = useHapticProps()

  const customOutcomes = design.outcomes.filter((o) => !OUTCOME_OPTIONS.includes(o))

  async function suggest() {
    const text = await send(
      [
        {
          role: 'user',
          content: `Session name: ${design.name}\nTopic: ${design.topic || 'not specified'}\nAims: ${design.aims || 'not specified'}\nMode: ${design.modeOfDelivery}`,
        },
      ],
      { model, system: OUTCOMES_SYSTEM_PROMPT }
    )
    if (!text) return
    try {
      const parsed = JSON.parse(stripCodeFences(text))
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        setSuggestions(parsed.filter((s) => !design.outcomes.includes(s)))
      }
    } catch {
      // Malformed response — the button stays available to retry.
    }
  }

  function addOutcome(outcome: string) {
    onChange({ ...design, outcomes: [...design.outcomes, outcome] })
    setSuggestions((prev) => prev.filter((s) => s !== outcome))
  }

  function removeOutcome(outcome: string) {
    onChange({ ...design, outcomes: design.outcomes.filter((o) => o !== outcome) })
  }

  return (
    <div className="mt-3 space-y-2">
      {customOutcomes.length > 0 && (
        <ul className="space-y-1">
          {customOutcomes.map((outcome) => (
            <li
              key={outcome}
              className="flex items-start justify-between gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs text-text-primary"
            >
              <span>{outcome}</span>
              <motion.button
                {...haptic}
                type="button"
                aria-label={`Remove outcome: ${outcome}`}
                onClick={() => removeOutcome(outcome)}
                className="shrink-0 text-text-muted hover:text-inquiry"
              >
                <X size={13} />
              </motion.button>
            </li>
          ))}
        </ul>
      )}

      <motion.button
        {...haptic}
        type="button"
        onClick={suggest}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-40"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest outcomes
      </motion.button>

      {error && <p className="text-xs text-inquiry">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="space-y-1">
          {suggestions.map((s) => (
            <li key={s}>
              <motion.button
                {...haptic}
                type="button"
                onClick={() => addOutcome(s)}
                className="flex w-full items-start gap-2 rounded-lg border border-dashed border-ink/10 px-3 py-1.5 text-left text-xs text-text-muted hover:border-accent hover:text-text-primary"
              >
                <Plus size={13} className="mt-0.5 shrink-0 text-accent" />
                {s}
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
