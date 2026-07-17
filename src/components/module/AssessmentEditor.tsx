// The module's assessment strategy: a list of components (method, type, weighting, week due,
// outcomes assessed) with live soft validation — summative weightings should total 100% and
// every module outcome should be assessed by at least one summative component.
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Plus, X } from 'lucide-react'
import type { AssessmentComponent, OutcomeStatement } from '../../types'
import { newAssessmentComponent } from '../../utils/moduleFactory'
import { useHapticProps } from '../shared/motion'

interface AssessmentEditorProps {
  assessments: AssessmentComponent[]
  outcomes: OutcomeStatement[]
  weekCount: number
  onChange: (assessments: AssessmentComponent[]) => void
}

export function AssessmentEditor({ assessments, outcomes, weekCount, onChange }: AssessmentEditorProps) {
  const haptic = useHapticProps()

  const summativeTotal = assessments
    .filter((a) => a.type === 'summative')
    .reduce((s, a) => s + (Number.isFinite(a.weighting) ? a.weighting : 0), 0)
  const hasSummative = assessments.some((a) => a.type === 'summative')
  const unassessed = outcomes.filter(
    (o) => !assessments.some((a) => a.type === 'summative' && a.outcomeIds.includes(o.id))
  )

  function update(id: string, patch: Partial<AssessmentComponent>) {
    onChange(assessments.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function toggleOutcome(id: string, outcomeId: string) {
    const a = assessments.find((x) => x.id === id)
    if (!a) return
    update(id, {
      outcomeIds: a.outcomeIds.includes(outcomeId)
        ? a.outcomeIds.filter((x) => x !== outcomeId)
        : [...a.outcomeIds, outcomeId],
    })
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <ClipboardCheck size={18} className="text-accent" /> Assessment strategy
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Summative weightings must total 100%, and each module outcome should be assessed by at
        least one summative component.
      </p>

      <div className="space-y-3">
        {assessments.map((a, i) => (
          <div key={a.id} className="rounded-xl border border-ink/10 bg-ink/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label={`Assessment ${i + 1} title`}
                value={a.title}
                onChange={(e) => update(a.id, { title: e.target.value })}
                placeholder="Component title"
                className="min-w-40 flex-1 rounded-lg bg-ink/5 px-2 py-1.5 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
                {(['formative', 'summative'] as const).map((t) => (
                  <motion.button
                    {...haptic}
                    key={t}
                    type="button"
                    aria-pressed={a.type === t}
                    onClick={() => update(a.id, { type: t })}
                    className={`rounded-lg px-2 py-1 text-xs font-medium capitalize ${
                      a.type === t ? 'bg-accent text-white' : 'text-text-muted'
                    }`}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
              <motion.button
                {...haptic}
                type="button"
                aria-label={`Remove assessment ${a.title}`}
                onClick={() => onChange(assessments.filter((x) => x.id !== a.id))}
                className="text-text-muted hover:text-inquiry"
              >
                <X size={15} />
              </motion.button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-text-muted" htmlFor={`method-${a.id}`}>
                  Method
                </label>
                <input
                  id={`method-${a.id}`}
                  value={a.method}
                  onChange={(e) => update(a.id, { method: e.target.value })}
                  placeholder="e.g. Portfolio, Essay, Screening"
                  className="w-52 rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              {a.type === 'summative' && (
                <div>
                  <label className="mb-0.5 block text-[10px] font-medium text-text-muted" htmlFor={`weight-${a.id}`}>
                    Weighting %
                  </label>
                  <input
                    id={`weight-${a.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={a.weighting}
                    onChange={(e) => update(a.id, { weighting: Number(e.target.value) })}
                    className="w-20 rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-text-muted" htmlFor={`week-${a.id}`}>
                  Week due
                </label>
                <select
                  id={`week-${a.id}`}
                  value={a.weekDue ?? ''}
                  onChange={(e) => update(a.id, { weekDue: e.target.value ? Number(e.target.value) : undefined })}
                  className="rounded-lg bg-ink/5 px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="" className="bg-surface">
                    —
                  </option>
                  {Array.from({ length: Math.max(weekCount, 12) }, (_, w) => w + 1).map((w) => (
                    <option key={w} value={w} className="bg-surface">
                      Week {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {outcomes.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">Assesses</p>
                <div className="flex flex-wrap gap-1">
                  {outcomes.map((o, oi) => {
                    const active = a.outcomeIds.includes(o.id)
                    return (
                      <motion.button
                        {...haptic}
                        key={o.id}
                        type="button"
                        title={o.text}
                        aria-pressed={active}
                        onClick={() => toggleOutcome(a.id, o.id)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          active ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                        }`}
                      >
                        LO{oi + 1}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <motion.button
        {...haptic}
        type="button"
        onClick={() => onChange([...assessments, newAssessmentComponent()])}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent"
      >
        <Plus size={13} /> Add assessment component
      </motion.button>

      <div className="mt-3 space-y-2">
        {hasSummative && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
              summativeTotal === 100
                ? 'border-production/40 bg-production/10 text-production'
                : 'border-collaboration/40 bg-collaboration/10 text-collaboration'
            }`}
          >
            {summativeTotal === 100 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            Summative weightings total {summativeTotal}%{summativeTotal !== 100 && ' — should total 100%'}
          </div>
        )}
        {outcomes.length > 0 && unassessed.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-collaboration/40 bg-collaboration/10 px-3 py-2 text-xs text-collaboration">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Not summatively assessed:{' '}
              {unassessed
                .map((o) => `LO${outcomes.findIndex((x) => x.id === o.id) + 1}`)
                .join(', ')}{' '}
              — tag each outcome on the component that assesses it.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
