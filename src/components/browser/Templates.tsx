// VISUAL DESIGN BRIEF: The template gallery — documented starting points that beat the blank
// page. Each glass card carries the pattern's name, a when-to-use line, its learning-type
// balance strip and headline numbers, with a single primary action: Use template. User-
// published templates appear in their own group below the built-ins.
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate } from 'lucide-react'
import type { Design } from '../../types'
import { builtInTemplates, instantiateTemplate, type Template } from '../../utils/templates'
import { computeAnalytics } from '../../utils/calculateAnalytics'
import { useStaggerVariants, useHapticProps } from '../shared/motion'
import { SegmentedBar } from '../shared/SegmentedBar'

interface TemplatesProps {
  designs: Design[]
  saveDesign: (design: Design) => void
}

function TemplateCard({ template, onUse }: { template: Template; onUse: (d: Design) => void }) {
  const haptic = useHapticProps()
  const analytics = computeAnalytics(template.design)
  const d = template.design

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink/5 p-5 shadow-xl backdrop-blur-lg">
      <div>
        <h3 className="font-semibold text-strong">{d.name}</h3>
        <p className="mt-1 text-xs text-text-muted">{template.whenToUse}</p>
      </div>
      <SegmentedBar
        segments={analytics.byLearningType.map((t) => ({ key: t.type, color: t.color, weight: t.minutes }))}
      />
      <p className="text-xs text-text-muted">
        {d.tlas.length} activities · {analytics.totalMinutes} min designed · class of {d.sizeOfClass}
        {(d.outcomeStatements?.length ?? 0) > 0 && ` · ${d.outcomeStatements!.length} outcomes aligned`}
      </p>
      <motion.button
        {...haptic}
        type="button"
        onClick={() => onUse(d)}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white"
      >
        <LayoutTemplate size={15} /> Use template
      </motion.button>
    </div>
  )
}

export function Templates({ designs, saveDesign }: TemplatesProps) {
  const { container, item } = useStaggerVariants()
  const navigate = useNavigate()

  const userTemplates: Template[] = designs
    .filter((d) => d.isTemplate)
    .map((design) => ({ design, whenToUse: design.description || 'One of your own published patterns.' }))

  function useTemplate(source: Design) {
    const instance = instantiateTemplate(source)
    saveDesign(instance)
    navigate(`/designer?id=${instance.id}`)
  }

  return (
    <div className="space-y-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {builtInTemplates.map((t) => (
          <motion.div key={t.design.id} variants={item}>
            <TemplateCard template={t} onUse={useTemplate} />
          </motion.div>
        ))}
      </motion.div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Your templates</h2>
        {userTemplates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/10 p-6 text-center text-sm text-text-muted">
            Publish one of your designs as a template from its card in My Designs, and it will
            appear here as a reusable starting point.
          </p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {userTemplates.map((t) => (
              <motion.div key={t.design.id} variants={item}>
                <TemplateCard template={t} onUse={useTemplate} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
