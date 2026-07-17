// The Browser's Programmes section: card per course showing award, credit progress across its
// stages, and module count, opening in the Course Designer.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, Landmark, Trash2 } from 'lucide-react'
import type { Course } from '../../types'
import { useCourses } from '../../hooks/useCourses'
import { useModules } from '../../hooks/useModules'
import { AWARDS } from '../../utils/fheq'
import { blankCourse } from '../../utils/courseFactory'
import { useHapticProps } from '../shared/motion'
import { useToast } from '../shared/Toast'

export function CoursesSection() {
  const { courses, saveCourse, deleteCourse } = useCourses()
  const { modules } = useModules()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const haptic = useHapticProps()
  const navigate = useNavigate()
  const { showToast } = useToast()

  function handleNewCourse() {
    const blank = blankCourse()
    saveCourse(blank)
    navigate(`/course?id=${blank.id}`)
  }

  function assignedCredits(course: Course): number {
    return course.stages.reduce(
      (sum, stage) =>
        sum + stage.moduleRefs.reduce((s, ref) => s + (modules.find((m) => m.id === ref.moduleId)?.credits ?? 0), 0),
      0
    )
  }

  const sorted = [...courses].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Whole programmes — BA (Hons) or MA — composed of your modules, with credit validation and a
          curriculum map.
        </p>
        <motion.button
          {...haptic}
          type="button"
          onClick={handleNewCourse}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          <FilePlus2 size={15} /> New Programme
        </motion.button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/10 p-12 text-center text-text-muted">
          No programmes yet. Create one to structure a BA (Hons) (360 credits) or MA (180 credits) from
          your modules.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((course) => {
            const rule = AWARDS[course.award]
            const credits = assignedCredits(course)
            const moduleCount = course.stages.reduce((s, stage) => s + stage.moduleRefs.length, 0)
            const complete = credits === rule.totalCredits
            return (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-2xl border border-ink/10 bg-ink/5 p-5 shadow-xl backdrop-blur-lg"
              >
                <button type="button" onClick={() => navigate(`/course?id=${course.id}`)} className="text-left">
                  <h3 className="flex items-start gap-2 text-base font-semibold text-strong hover:text-accent">
                    <Landmark size={17} className="mt-0.5 shrink-0 text-accent" />
                    {course.title}
                  </h3>
                </button>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    {rule.label}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      complete
                        ? 'border-production/40 bg-production/10 text-production'
                        : 'border-collaboration/40 bg-collaboration/10 text-collaboration'
                    }`}
                  >
                    {credits}/{rule.totalCredits} credits
                  </span>
                </div>

                <p className="mt-2 text-xs text-text-muted">
                  {moduleCount} module{moduleCount === 1 ? '' : 's'} across {course.stages.length} stage
                  {course.stages.length === 1 ? '' : 's'}
                </p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={`h-full rounded-full ${complete ? 'bg-production' : 'bg-collaboration'}`}
                    style={{ width: `${Math.min((credits / rule.totalCredits) * 100, 100)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <motion.button
                    {...haptic}
                    type="button"
                    onClick={() => navigate(`/course?id=${course.id}`)}
                    className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    Open designer
                  </motion.button>
                  {confirmingId === course.id ? (
                    <div className="flex items-center gap-1">
                      <motion.button {...haptic} type="button" onClick={() => setConfirmingId(null)} className="rounded-lg px-2 py-1 text-xs text-text-muted">
                        Cancel
                      </motion.button>
                      <motion.button
                        {...haptic}
                        type="button"
                        onClick={() => {
                          deleteCourse(course.id)
                          setConfirmingId(null)
                          showToast('Programme deleted — its modules are untouched', 'success')
                        }}
                        className="rounded-lg bg-inquiry px-2 py-1 text-xs font-medium text-white"
                      >
                        Confirm delete?
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      {...haptic}
                      type="button"
                      aria-label={`Delete programme ${course.title}`}
                      onClick={() => setConfirmingId(course.id)}
                      className="text-text-muted hover:text-inquiry"
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
