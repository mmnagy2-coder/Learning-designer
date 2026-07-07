// VISUAL DESIGN BRIEF: Sessions grouped under their module headings (each header shows the
// module name and session count), sessions ordered by scheduled date so a term reads
// top-to-bottom like a scheme of work; unassigned designs collect at the end. Deleting a card
// plays an exit animation via AnimatePresence and the remaining cards re-stagger.
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import type { Design, Module } from '../../types'
import { useModules } from '../../hooks/useModules'
import { useStaggerVariants } from '../shared/motion'
import { SkeletonCard, useMinLoadingTime } from '../shared/SkeletonCard'
import { useToast } from '../shared/Toast'
import { DesignCard } from './DesignCard'
import { DeleteConfirmModal } from './DeleteConfirmModal'

interface MyDesignsProps {
  designs: Design[]
  loaded: boolean
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleTemplate?: (design: Design) => void
}

/** Dated sessions first (ascending — a term reads chronologically), undated ones last. */
function bySessionDate(a: Design, b: Design): number {
  if (a.sessionDate && b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate)
  if (a.sessionDate) return -1
  if (b.sessionDate) return 1
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function MyDesigns({ designs, loaded, onDuplicate, onDelete, onToggleTemplate }: MyDesignsProps) {
  const ready = useMinLoadingTime(loaded)
  const { modules } = useModules()
  const { container } = useStaggerVariants()
  const [pendingDelete, setPendingDelete] = useState<Design | null>(null)
  const { showToast } = useToast()

  const groups = useMemo(() => {
    const moduleIds = new Set(modules.map((m) => m.id))
    const grouped: { module: Module; sessions: Design[] }[] = modules
      .map((module) => ({
        module,
        sessions: designs.filter((d) => d.moduleId === module.id).sort(bySessionDate),
      }))
      .filter((g) => g.sessions.length > 0)
    // Designs with no module (or a module that no longer exists) fall through here.
    const unassigned = designs.filter((d) => !d.moduleId || !moduleIds.has(d.moduleId)).sort(bySessionDate)
    return { grouped, unassigned }
  }, [designs, modules])

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/10 p-12 text-center text-text-muted">
        No designs yet. Use "New Design" above to create one.
      </div>
    )
  }

  function renderGrid(sessions: Design[]) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {sessions.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onDuplicate={(id) => {
                onDuplicate(id)
                showToast('Design duplicated', 'success')
              }}
              onDelete={(d) => setPendingDelete(d)}
              onToggleTemplate={onToggleTemplate}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {groups.grouped.map(({ module, sessions }) => (
          <section key={module.id}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <FolderOpen size={15} className="text-accent" />
              {module.name}
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium normal-case">
                {sessions.length} session{sessions.length === 1 ? '' : 's'}
              </span>
            </h2>
            {renderGrid(sessions)}
          </section>
        ))}

        {groups.unassigned.length > 0 && (
          <section>
            {groups.grouped.length > 0 && (
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Not in a module</h2>
            )}
            {renderGrid(groups.unassigned)}
          </section>
        )}
      </div>

      <DeleteConfirmModal
        design={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(design) => {
          onDelete(design.id)
          setPendingDelete(null)
          showToast('Design deleted', 'success')
        }}
      />
    </>
  )
}
