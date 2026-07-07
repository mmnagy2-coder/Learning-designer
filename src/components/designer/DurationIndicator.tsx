// VISUAL DESIGN BRIEF: A persistent pill beside the Timeline/Analysis tabs showing designed
// time against the session's target at a glance — green when on target, amber when the
// session under-runs, red when it over-runs — so timing problems surface while sequencing
// activities instead of only in the Analysis tab. Color is always paired with a text label.
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import type { Design } from '../../types'
import { computeAnalytics } from '../../utils/calculateAnalytics'

export function DurationIndicator({ design }: { design: Design }) {
  const designed = useMemo(() => computeAnalytics(design).totalMinutes, [design.tlas])
  const target = design.learningTimeMinutes

  if (target <= 0 && designed === 0) return null

  const diff = designed - target
  // Within 5% of target (minimum 5 min of slack) counts as on target.
  const tolerance = Math.max(5, Math.round(target * 0.05))

  let toneClass: string
  let statusLabel: string
  if (Math.abs(diff) <= tolerance) {
    toneClass = 'border-production/40 bg-production/10 text-production'
    statusLabel = 'on target'
  } else if (diff < 0) {
    toneClass = 'border-collaboration/40 bg-collaboration/10 text-collaboration'
    statusLabel = `${-diff} min under`
  } else {
    toneClass = 'border-inquiry/40 bg-inquiry/10 text-inquiry'
    statusLabel = `${diff} min over`
  }

  return (
    <div
      role="status"
      aria-label={`Designed ${designed} of ${target} minutes, ${statusLabel}`}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium ${toneClass}`}
    >
      <Clock size={14} />
      {designed} / {target} min · {statusLabel}
    </div>
  )
}
