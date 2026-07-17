// Module-level aggregation: designed time vs notional hours, merged learning-type balance
// across linked sessions, outcome-vs-assessment coverage, and aggregated UDL coverage.
import { useMemo } from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, Clock, PersonStanding, Target } from 'lucide-react'
import type { Design, Module } from '../../types'
import { computeModuleAnalytics } from '../../utils/moduleAnalytics'
import { udlCheckpointLabel, UDL_ATTRIBUTION } from '../../utils/udl'
import { SegmentedBar } from '../shared/SegmentedBar'

interface ModuleAnalysisProps {
  module: Module
  linkedDesigns: Design[]
}

export function ModuleAnalysis({ module, linkedDesigns }: ModuleAnalysisProps) {
  const analytics = useMemo(() => computeModuleAnalytics(module, linkedDesigns), [module, linkedDesigns])

  const designedHours = analytics.designedMinutes / 60
  const notionalHrs = analytics.notionalMinutes !== null ? analytics.notionalMinutes / 60 : null
  const hoursPercent =
    analytics.notionalMinutes && analytics.notionalMinutes > 0
      ? Math.min((analytics.designedMinutes / analytics.notionalMinutes) * 100, 100)
      : 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
          <Clock size={18} className="text-accent" /> Designed time vs notional hours
        </h3>
        {notionalHrs === null ? (
          <p className="text-xs text-text-muted">Set the module's credits to compare designed time against notional learning hours.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-text-muted">
              {designedHours.toFixed(1)}h designed across {analytics.linkedDesignCount}{' '}
              {analytics.linkedDesignCount === 1 ? 'session' : 'sessions'} of {notionalHrs}h notional
              ({module.credits} credits). The remainder is independent study, assessment
              preparation, and unplanned contact.
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${hoursPercent}%` }} />
            </div>
          </>
        )}
      </div>

      {analytics.designedMinutes > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
            <BarChart3 size={18} className="text-accent" /> Learning type balance across the module
          </h3>
          <p className="mb-3 text-xs text-text-muted">Merged across all linked session designs.</p>
          <SegmentedBar
            segments={analytics.byLearningType.map((t) => ({ key: t.type, color: t.color, weight: t.minutes }))}
            height={20}
          />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
            {analytics.byLearningType
              .filter((t) => t.minutes > 0)
              .map((t) => (
                <div key={t.type} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}: {Math.round(t.percent)}% · {t.minutes} min
                </div>
              ))}
          </div>
        </div>
      )}

      {analytics.outcomeCoverage.length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
            <Target size={18} className="text-accent" /> Outcome coverage
          </h3>
          <p className="mb-3 text-xs text-text-muted">
            Which assessment components assess each module outcome.
          </p>
          <ul className="space-y-2">
            {analytics.outcomeCoverage.map((o, i) => (
              <li key={o.outcomeId} className="flex items-start gap-2 rounded-xl bg-ink/5 px-3 py-2 text-sm">
                {o.summativeBy.length > 0 ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-production" />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-inquiry" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="mr-1.5 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    LO{i + 1}
                  </span>
                  <span className="text-text-primary">{o.text}</span>
                  <div className="mt-0.5 text-xs text-text-muted">
                    {o.summativeBy.length > 0
                      ? `Summative: ${o.summativeBy.join(', ')}`
                      : 'Not summatively assessed'}
                    {o.formativeBy.length > 0 && ` · Formative: ${o.formativeBy.join(', ')}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analytics.udl.hasAnyTags && (
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
            <PersonStanding size={18} className="text-accent" /> UDL coverage across the module
          </h3>
          <p className="mb-3 text-xs text-text-muted">
            CAST UDL 3.0 checkpoints tagged anywhere in the module's linked sessions.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {analytics.udl.byPrinciple.map((p) => (
              <div key={p.principle} className="rounded-xl bg-ink/5 px-3 py-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium" style={{ color: p.color }}>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {p.tagged}/{p.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.total > 0 ? (p.tagged / p.total) * 100 : 0}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {analytics.udl.taggedCheckpoints.map((id) => (
              <span key={id} className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[10px] text-text-muted">
                <span className="font-semibold">{id}</span> {udlCheckpointLabel(id)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-text-muted">{UDL_ATTRIBUTION}</p>
        </div>
      )}
    </div>
  )
}
