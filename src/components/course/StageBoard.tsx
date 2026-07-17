// The programme structure: one section per stage (Year 1 · Level 4 …) with per-stage credit
// validation, a picker over the user's module designs, core/optional toggles, and a shortcut
// that creates a new module at the stage's level and opens it in the Module Designer.
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ExternalLink, FilePlus2, Layers, X } from 'lucide-react'
import type { Course, CourseStage, Module } from '../../types'
import { AWARDS, notionalHours } from '../../utils/fheq'
import { blankModule } from '../../utils/moduleFactory'
import { useHapticProps } from '../shared/motion'

interface StageBoardProps {
  course: Course
  onChange: (course: Course) => void
  modules: Module[]
  saveModule: (module: Module) => void
}

export function StageBoard({ course, onChange, modules, saveModule }: StageBoardProps) {
  const haptic = useHapticProps()
  const navigate = useNavigate()
  const rule = AWARDS[course.award]

  const usedModuleIds = new Set(course.stages.flatMap((s) => s.moduleRefs.map((r) => r.moduleId)))

  function updateStage(id: string, patch: Partial<CourseStage>) {
    onChange({ ...course, stages: course.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  }

  function addModuleToStage(stage: CourseStage, moduleId: string) {
    if (!moduleId) return
    updateStage(stage.id, { moduleRefs: [...stage.moduleRefs, { moduleId, isCore: true }] })
  }

  function newModuleInStage(stage: CourseStage) {
    const module = { ...blankModule(), level: stage.level }
    saveModule(module)
    updateStage(stage.id, { moduleRefs: [...stage.moduleRefs, { moduleId: module.id, isCore: true }] })
    navigate(`/module?id=${module.id}`)
  }

  function stageCredits(stage: CourseStage): number {
    return stage.moduleRefs.reduce((sum, ref) => {
      const m = modules.find((x) => x.id === ref.moduleId)
      return sum + (m?.credits ?? 0)
    }, 0)
  }

  return (
    <div className="space-y-4">
      {course.stages.map((stage) => {
        const target = rule.stages.find((s) => s.level === stage.level)?.credits ?? 0
        const credits = stageCredits(stage)
        const complete = credits === target
        // Modules available to this stage: unused anywhere in the course, level matching (or unset).
        const available = modules.filter(
          (m) => !usedModuleIds.has(m.id) && (m.level === undefined || m.level === stage.level)
        )

        return (
          <div key={stage.id} className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-strong">
                <Layers size={18} className="text-accent" /> {stage.name}
              </h3>
              <span
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-sm font-medium ${
                  complete
                    ? 'border-production/40 bg-production/10 text-production'
                    : 'border-collaboration/40 bg-collaboration/10 text-collaboration'
                }`}
              >
                {complete ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {credits}/{target} credits
              </span>
            </div>

            {stage.moduleRefs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink/10 p-4 text-center text-xs text-text-muted">
                No modules yet — add one below.
              </p>
            ) : (
              <ul className="space-y-2">
                {stage.moduleRefs.map((ref) => {
                  const m = modules.find((x) => x.id === ref.moduleId)
                  if (!m) return null
                  return (
                    <li key={ref.moduleId} className="flex flex-wrap items-center gap-2 rounded-xl bg-ink/5 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/module?id=${m.id}`)}
                        title="Open in Module Designer"
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-text-primary hover:text-accent"
                      >
                        <span className="truncate">
                          {m.code ? `${m.code} · ` : ''}
                          {m.name}
                        </span>
                        <ExternalLink size={12} className="shrink-0" />
                      </button>
                      <span className="shrink-0 text-xs text-text-muted">
                        {m.credits ? `${m.credits} cr · ${notionalHours(m.credits)}h` : 'credits not set'}
                      </span>
                      <motion.button
                        {...haptic}
                        type="button"
                        aria-pressed={ref.isCore}
                        onClick={() =>
                          updateStage(stage.id, {
                            moduleRefs: stage.moduleRefs.map((r) =>
                              r.moduleId === ref.moduleId ? { ...r, isCore: !r.isCore } : r
                            ),
                          })
                        }
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          ref.isCore ? 'border-accent bg-accent/20 text-accent' : 'border-ink/10 text-text-muted'
                        }`}
                      >
                        {ref.isCore ? 'Core' : 'Optional'}
                      </motion.button>
                      <motion.button
                        {...haptic}
                        type="button"
                        aria-label={`Remove ${m.name} from ${stage.name}`}
                        onClick={() =>
                          updateStage(stage.id, {
                            moduleRefs: stage.moduleRefs.filter((r) => r.moduleId !== ref.moduleId),
                          })
                        }
                        className="shrink-0 text-text-muted hover:text-inquiry"
                      >
                        <X size={14} />
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {available.length > 0 && (
                <select
                  aria-label={`Add a module to ${stage.name}`}
                  value=""
                  onChange={(e) => addModuleToStage(stage, e.target.value)}
                  className="rounded-lg bg-ink/5 px-2 py-1.5 text-xs text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="" className="bg-surface">
                    Add existing module…
                  </option>
                  {available.map((m) => (
                    <option key={m.id} value={m.id} className="bg-surface">
                      {m.code ? `${m.code} · ` : ''}
                      {m.name}
                      {m.credits ? ` (${m.credits} cr)` : ''}
                      {m.level === undefined ? ' — level not set' : ''}
                    </option>
                  ))}
                </select>
              )}
              <motion.button
                {...haptic}
                type="button"
                onClick={() => newModuleInStage(stage)}
                className="flex items-center gap-1 text-xs font-medium text-accent"
              >
                <FilePlus2 size={12} /> New level {stage.level} module
              </motion.button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
