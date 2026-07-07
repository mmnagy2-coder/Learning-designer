// Glassmorphic card representing one design. Two flavors: the "My Designs" list shows a mini
// segmented color bar plus hover-revealed Duplicate/Delete actions (always visible on touch
// devices); the Directory shows a mini pie chart instead of action buttons.
import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Copy, LayoutTemplate, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Design } from '../../types'
import { computeAnalytics } from '../../utils/calculateAnalytics'
import { staggerItem, useHapticProps } from '../shared/motion'
import { SegmentedBar } from '../shared/SegmentedBar'
import { LearningTypePieChart } from '../shared/LearningTypePieChart'

const MODE_LABELS: Record<Design['modeOfDelivery'], string> = {
  'face-to-face': 'Face-to-face',
  blended: 'Blended',
  'wholly-online': 'Wholly online',
  'async-online': 'Async online',
}

interface DesignCardProps {
  design: Design
  showPieChart?: boolean
  onDuplicate?: (id: string) => void
  onDelete?: (design: Design) => void
  /** Publish/unpublish this design in the local template library. */
  onToggleTemplate?: (design: Design) => void
}

// AnimatePresence (popLayout mode, used in MyDesigns) needs a ref to measure this element
// during its exit animation, so this must be a forwardRef component rather than a plain
// function component.
export const DesignCard = forwardRef<HTMLDivElement, DesignCardProps>(function DesignCard(
  { design, showPieChart = false, onDuplicate, onDelete, onToggleTemplate },
  ref
) {
  const navigate = useNavigate()
  const haptic = useHapticProps()
  const analytics = computeAnalytics(design)
  const lastModified = new Date(design.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      exit="exit"
      layout
      className="group relative flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink/5 p-5 shadow-xl backdrop-blur-lg cursor-pointer"
      onClick={() => navigate(`/designer?id=${design.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-strong">{design.name}</h3>
          <p className="text-sm text-text-muted">{design.topic}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
          {MODE_LABELS[design.modeOfDelivery]}
        </span>
      </div>

      {showPieChart ? (
        <div className="flex justify-center py-2">
          <LearningTypePieChart data={analytics.byLearningType} size={120} showTooltip={false} />
        </div>
      ) : (
        <SegmentedBar
          segments={analytics.byLearningType.map((t) => ({ key: t.type, color: t.color, weight: t.minutes }))}
        />
      )}

      <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
        <span>Last modified {lastModified}</span>
        {design.sessionDate && (
          <span className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 font-medium">
            <CalendarDays size={12} />
            {new Date(`${design.sessionDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </div>

      {(onDuplicate || onDelete || onToggleTemplate) && (
        <div className="flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {onToggleTemplate && (
            <motion.button
              {...haptic}
              type="button"
              aria-pressed={Boolean(design.isTemplate)}
              aria-label={design.isTemplate ? `Unpublish ${design.name} as template` : `Publish ${design.name} as template`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleTemplate(design)
              }}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ${
                design.isTemplate ? 'bg-accent/15 text-accent' : 'bg-ink/5 text-text-primary hover:bg-ink/10'
              }`}
            >
              <LayoutTemplate size={14} /> {design.isTemplate ? 'Template ✓' : 'Template'}
            </motion.button>
          )}
          {onDuplicate && (
            <motion.button
              {...haptic}
              type="button"
              aria-label={`Duplicate ${design.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(design.id)
              }}
              className="flex items-center gap-1 rounded-lg bg-ink/5 px-3 py-1.5 text-xs text-text-primary hover:bg-ink/10"
            >
              <Copy size={14} /> Duplicate
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              {...haptic}
              type="button"
              aria-label={`Delete ${design.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(design)
              }}
              className="flex items-center gap-1 rounded-lg bg-inquiry/10 px-3 py-1.5 text-xs text-inquiry hover:bg-inquiry/20"
            >
              <Trash2 size={14} /> Delete
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
})
