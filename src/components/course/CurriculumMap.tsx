// The curriculum map: modules (rows, in stage order) × programme outcomes (columns). Each
// cell toggles whether the module contributes to that programme outcome; a footer flags
// programme outcomes no module maps to.
import { AlertTriangle, Grid3x3 } from 'lucide-react'
import type { Course, Module } from '../../types'

interface CurriculumMapProps {
  course: Course
  onChange: (course: Course) => void
  modules: Module[]
}

export function CurriculumMap({ course, onChange, modules }: CurriculumMapProps) {
  const outcomes = course.outcomeStatements
  const rows = course.stages.flatMap((stage) =>
    stage.moduleRefs
      .map((ref) => ({ stage, ref, module: modules.find((m) => m.id === ref.moduleId) }))
      .filter((r): r is typeof r & { module: Module } => Boolean(r.module))
  )

  if (outcomes.length === 0 || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
          <Grid3x3 size={18} className="text-accent" /> Curriculum map
        </h3>
        <p className="text-xs text-text-muted">
          Add programme outcomes and modules, then map which modules contribute to which outcomes here.
        </p>
      </div>
    )
  }

  function toggle(stageId: string, moduleId: string, outcomeId: string) {
    onChange({
      ...course,
      stages: course.stages.map((s) =>
        s.id !== stageId
          ? s
          : {
              ...s,
              moduleRefs: s.moduleRefs.map((r) => {
                if (r.moduleId !== moduleId) return r
                const current = r.programmeOutcomeIds ?? []
                return {
                  ...r,
                  programmeOutcomeIds: current.includes(outcomeId)
                    ? current.filter((id) => id !== outcomeId)
                    : [...current, outcomeId],
                }
              }),
            }
      ),
    })
  }

  const unmapped = outcomes.filter(
    (o) => !rows.some(({ ref }) => (ref.programmeOutcomeIds ?? []).includes(o.id))
  )

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <Grid3x3 size={18} className="text-accent" /> Curriculum map
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Tick where each module contributes to a programme outcome. Hover a column header for the full outcome.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-transparent py-2 pr-3 text-left text-xs font-medium text-text-muted">
                Module
              </th>
              {outcomes.map((o, i) => (
                <th key={o.id} className="px-2 py-2 text-center" title={o.text}>
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    PO{i + 1}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ stage, ref, module }) => (
              <tr key={ref.moduleId} className="border-t border-ink/10">
                <td className="max-w-64 py-2 pr-3">
                  <div className="truncate text-xs font-medium text-text-primary" title={module.name}>
                    {module.code ? `${module.code} · ` : ''}
                    {module.name}
                  </div>
                  <div className="text-[10px] text-text-muted">Level {stage.level}</div>
                </td>
                {outcomes.map((o) => {
                  const active = (ref.programmeOutcomeIds ?? []).includes(o.id)
                  return (
                    <td key={o.id} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${module.name} contributes to programme outcome: ${o.text}`}
                        checked={active}
                        onChange={() => toggle(stage.id, ref.moduleId, o.id)}
                        className="h-3.5 w-3.5 accent-blue-500"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unmapped.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-collaboration/40 bg-collaboration/10 px-3 py-2 text-xs text-collaboration">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            No module maps to:{' '}
            {unmapped.map((o) => `PO${outcomes.findIndex((x) => x.id === o.id) + 1}`).join(', ')} — a
            validation panel will ask where these outcomes are developed.
          </span>
        </div>
      )}
    </div>
  )
}
