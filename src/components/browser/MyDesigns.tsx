// VISUAL DESIGN BRIEF: A staggered card grid, newest designs first. Deleting a card plays an
// exit animation (slide + fade) via AnimatePresence and the remaining cards re-stagger into
// their new positions — no jarring layout jump.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Design } from '../../types'
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
}

export function MyDesigns({ designs, loaded, onDuplicate, onDelete }: MyDesignsProps) {
  const ready = useMinLoadingTime(loaded)
  const { container } = useStaggerVariants()
  const [pendingDelete, setPendingDelete] = useState<Design | null>(null)
  const { showToast } = useToast()

  const sorted = [...designs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-text-muted">
        No designs yet. Create one in the Designer.
      </div>
    )
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {sorted.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onDuplicate={(id) => {
                onDuplicate(id)
                showToast('Design duplicated', 'success')
              }}
              onDelete={(d) => setPendingDelete(d)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

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
