// The module's week-by-week delivery plan. Each week holds a topic, notes, and the session
// designs delivered that week. Sessions attach to the module (design.moduleId) and then to a
// week (week.designIds); reordering uses up/down buttons (the mobile pattern) for simplicity.
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, ChevronDown, ChevronUp, ExternalLink, FilePlus2, Plus, X } from 'lucide-react'
import type { Design, Module, ModuleWeek } from '../../types'
import { newModuleWeek } from '../../utils/moduleFactory'
import { blankDesign } from '../../utils/designFactory'
import { useHapticProps } from '../shared/motion'

interface WeekPlannerProps {
  module: Module
  onChange: (module: Module) => void
  /** All designs in the library (for attaching); linked = design.moduleId === module.id. */
  designs: Design[]
  saveDesign: (design: Design) => void
}

export function WeekPlanner({ module, onChange, designs, saveDesign }: WeekPlannerProps) {
  const haptic = useHapticProps()
  const navigate = useNavigate()
  const weeks = module.weeks ?? []

  const linked = designs.filter((d) => d.moduleId === module.id)
  const assignedIds = new Set(weeks.flatMap((w) => w.designIds))
  const unassigned = linked.filter((d) => !assignedIds.has(d.id))
  const unattached = designs.filter((d) => !d.moduleId && !d.isTemplate)

  function setWeeks(next: ModuleWeek[]) {
    onChange({ ...module, weeks: next.length > 0 ? next : undefined })
  }

  function updateWeek(id: string, patch: Partial<ModuleWeek>) {
    setWeeks(weeks.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }

  function addWeek() {
    setWeeks([...weeks, newModuleWeek(weeks.length + 1)])
  }

  function removeWeek(id: string) {
    setWeeks(weeks.filter((w) => w.id !== id).map((w, i) => ({ ...w, number: i + 1 })))
  }

  function moveWeek(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= weeks.length) return
    const next = [...weeks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setWeeks(next.map((w, i) => ({ ...w, number: i + 1 })))
  }

  function addDesignToWeek(weekId: string, designId: string) {
    if (!designId) return
    setWeeks(weeks.map((w) => (w.id === weekId ? { ...w, designIds: [...w.designIds, designId] } : w)))
  }

  function removeDesignFromWeek(weekId: string, designId: string) {
    setWeeks(
      weeks.map((w) => (w.id === weekId ? { ...w, designIds: w.designIds.filter((id) => id !== designId) } : w))
    )
  }

  function newSessionInWeek(weekId: string) {
    const session = { ...blankDesign(), name: 'Untitled Session', moduleId: module.id }
    saveDesign(session)
    addDesignToWeek(weekId, session.id)
    navigate(`/designer?id=${session.id}`)
  }

  function attachExisting(designId: string) {
    const design = designs.find((d) => d.id === designId)
    if (!design) return
    saveDesign({ ...design, moduleId: module.id })
  }

  const designName = (id: string) => designs.find((d) => d.id === id)?.name

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <CalendarRange size={18} className="text-accent" /> Delivery plan
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Week-by-week structure. Attach your session designs to the weeks they're delivered in —
        each session opens in the session Designer.
      </p>

      <div className="space-y-3">
        {weeks.map((week, i) => (
          <div key={week.id} className="rounded-xl border border-ink/10 bg-ink/5 p-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <motion.button
                  {...haptic}
                  type="button"
                  aria-label={`Move week ${week.number} up`}
                  disabled={i === 0}
                  onClick={() => moveWeek(i, -1)}
                  className="text-text-muted disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </motion.button>
                <motion.button
                  {...haptic}
                  type="button"
                  aria-label={`Move week ${week.number} down`}
                  disabled={i === weeks.length - 1}
                  onClick={() => moveWeek(i, 1)}
                  className="text-text-muted disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </motion.button>
              </div>
              <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
                Week {week.number}
              </span>
              <input
                aria-label={`Week ${week.number} topic`}
                value={week.topic}
                onChange={(e) => updateWeek(week.id, { topic: e.target.value })}
                placeholder="Topic for this week…"
                className="min-w-0 flex-1 rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <motion.button
                {...haptic}
                type="button"
                aria-label={`Remove week ${week.number}`}
                onClick={() => removeWeek(week.id)}
                className="text-text-muted hover:text-inquiry"
              >
                <X size={15} />
              </motion.button>
            </div>

            {week.designIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {week.designIds.map((id) =>
                  designName(id) ? (
                    <span key={id} className="flex items-center gap-1 rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[11px] text-text-primary">
                      <button
                        type="button"
                        onClick={() => navigate(`/designer?id=${id}`)}
                        className="flex items-center gap-1 hover:text-accent"
                        title="Open in session Designer"
                      >
                        {designName(id)} <ExternalLink size={10} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${designName(id)} from week ${week.number}`}
                        onClick={() => removeDesignFromWeek(week.id, id)}
                        className="text-text-muted hover:text-inquiry"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ) : null
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {unassigned.length > 0 && (
                <select
                  aria-label={`Add a session to week ${week.number}`}
                  value=""
                  onChange={(e) => addDesignToWeek(week.id, e.target.value)}
                  className="rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="" className="bg-surface">
                    Add session…
                  </option>
                  {unassigned.map((d) => (
                    <option key={d.id} value={d.id} className="bg-surface">
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              <motion.button
                {...haptic}
                type="button"
                onClick={() => newSessionInWeek(week.id)}
                className="flex items-center gap-1 text-xs font-medium text-accent"
              >
                <FilePlus2 size={12} /> New session
              </motion.button>
            </div>

            <textarea
              aria-label={`Week ${week.number} notes`}
              value={week.notes ?? ''}
              onChange={(e) => updateWeek(week.id, { notes: e.target.value || undefined })}
              placeholder="Notes…"
              rows={1}
              className="mt-2 w-full resize-none rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        ))}
      </div>

      <motion.button
        {...haptic}
        type="button"
        onClick={addWeek}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent"
      >
        <Plus size={13} /> Add week
      </motion.button>

      {unassigned.length > 0 && (
        <p className="mt-3 text-xs text-text-muted">
          {unassigned.length} linked {unassigned.length === 1 ? 'session is' : 'sessions are'} not yet
          placed in a week: {unassigned.map((d) => d.name).join(', ')}
        </p>
      )}

      {unattached.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span>Attach an existing design to this module:</span>
          <select
            aria-label="Attach an existing design to this module"
            value=""
            onChange={(e) => attachExisting(e.target.value)}
            className="rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="" className="bg-surface">
              Choose a design…
            </option>
            {unattached.map((d) => (
              <option key={d.id} value={d.id} className="bg-surface">
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
