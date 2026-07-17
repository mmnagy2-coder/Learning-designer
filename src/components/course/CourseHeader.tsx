// Programme header: title, award (switching re-scaffolds stages, preserving modules on
// stages whose level survives), overall credit progress, aims and notes.
import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import type { AwardType, Course } from '../../types'
import { AWARDS } from '../../utils/fheq'
import { stagesForAward } from '../../utils/courseFactory'
import { useHapticProps } from '../shared/motion'

interface CourseHeaderProps {
  course: Course
  /** Total credits currently assigned across all stages (from module records). */
  assignedCredits: number
  onChange: (course: Course) => void
}

export function CourseHeader({ course, assignedCredits, onChange }: CourseHeaderProps) {
  const haptic = useHapticProps()
  const rule = AWARDS[course.award]

  function switchAward(award: AwardType) {
    if (award === course.award) return
    // Rebuild the stage scaffold for the new award, carrying module refs across for any
    // level that exists in both (e.g. nothing survives BA→MA; everything survives a no-op).
    const next = stagesForAward(award).map((stage) => {
      const existing = course.stages.find((s) => s.level === stage.level)
      return existing ? { ...stage, moduleRefs: existing.moduleRefs } : stage
    })
    onChange({ ...course, award, stages: next })
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="course-title">
            Programme title
          </label>
          <input
            id="course-title"
            value={course.title}
            onChange={(e) => onChange({ ...course, title: e.target.value })}
            placeholder="Programme title"
            className="w-full bg-transparent text-2xl font-bold text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent rounded"
          />
          <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <GraduationCap size={13} /> {rule.label} · {rule.totalCredits} credits ·{' '}
            {rule.stages.map((s) => `Level ${s.level}`).join(' → ')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
            {(Object.keys(AWARDS) as AwardType[]).map((a) => (
              <motion.button
                {...haptic}
                key={a}
                type="button"
                aria-pressed={course.award === a}
                onClick={() => switchAward(a)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  course.award === a ? 'bg-accent text-white' : 'text-text-muted'
                }`}
              >
                {AWARDS[a].label}
              </motion.button>
            ))}
          </div>
          <div className="text-right">
            <span
              className={`text-sm font-semibold ${
                assignedCredits === rule.totalCredits ? 'text-production' : 'text-collaboration'
              }`}
            >
              {assignedCredits}/{rule.totalCredits} credits
            </span>
            <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full transition-all ${
                  assignedCredits === rule.totalCredits ? 'bg-production' : 'bg-collaboration'
                }`}
                style={{ width: `${Math.min((assignedCredits / rule.totalCredits) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="course-aims">
            Programme aims
          </label>
          <textarea
            id="course-aims"
            value={course.aims}
            onChange={(e) => onChange({ ...course, aims: e.target.value })}
            placeholder="What the programme sets out to achieve for its graduates…"
            rows={4}
            className="w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="course-notes">
            Notes (entry requirements, assessment overview…)
          </label>
          <textarea
            id="course-notes"
            value={course.notes ?? ''}
            onChange={(e) => onChange({ ...course, notes: e.target.value || undefined })}
            placeholder="Entry requirements, programme-level assessment strategy, professional accreditation…"
            rows={4}
            className="w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </div>
  )
}
