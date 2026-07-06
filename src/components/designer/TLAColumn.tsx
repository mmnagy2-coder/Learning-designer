// A single Teaching & Learning Activity column: glass card, segmented color bar, editable
// title, a list of learning-type rows with a full icon toolbar, then collapsed-by-default
// Notes and Resources sections. Draggable via dnd-kit on desktop (pointer + keyboard); on
// mobile the drag handle is replaced by explicit up/down reorder buttons.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import type { TLA, LearningTypeRow as LearningTypeRowModel } from '../../types'
import { ColorBar } from './ColorBar'
import { LearningTypeRow } from './LearningTypeRow'
import { ResourcesList } from './ResourcesList'
import { Collapsible } from '../shared/Collapsible'
import { useHapticProps } from '../shared/motion'

interface TLAColumnProps {
  tla: TLA
  onChange: (tla: TLA) => void
  onDelete: () => void
  dragDisabled?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  /** The design's topic, used to ground AI resource suggestions for this activity. */
  designTopic?: string
}

function newRow(): LearningTypeRowModel {
  return {
    id: crypto.randomUUID(),
    type: 'acquisition',
    durationMinutes: 15,
    groupSize: 1,
    teacherPresent: false,
    isOnline: false,
    isSynchronous: true,
    assessmentType: 'none',
    description: '',
  }
}

export function TLAColumn({ tla, onChange, onDelete, dragDisabled = false, onMoveUp, onMoveDown, canMoveUp, canMoveDown, designTopic }: TLAColumnProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const haptic = useHapticProps()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tla.id,
    disabled: dragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const totalMinutes = tla.learningTypes.reduce((s, r) => s + r.durationMinutes, 0)

  function updateRow(id: string, patch: LearningTypeRowModel) {
    onChange({ ...tla, learningTypes: tla.learningTypes.map((r) => (r.id === id ? patch : r)) })
  }

  function deleteRow(id: string) {
    onChange({ ...tla, learningTypes: tla.learningTypes.filter((r) => r.id !== id) })
  }

  function addRow() {
    onChange({ ...tla, learningTypes: [...tla.learningTypes, newRow()] })
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-ink/5 shadow-xl backdrop-blur-lg md:w-80"
    >
      <ColorBar rows={tla.learningTypes} />

      <div className="flex items-center gap-2 px-4 pt-3">
        {dragDisabled ? (
          <div className="flex flex-col">
            <motion.button
              {...haptic}
              type="button"
              aria-label={`Move ${tla.title} up`}
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="text-text-muted disabled:opacity-30"
            >
              <ChevronUp size={16} />
            </motion.button>
            <motion.button
              {...haptic}
              type="button"
              aria-label={`Move ${tla.title} down`}
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="text-text-muted disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </motion.button>
          </div>
        ) : (
          <button
            {...attributes}
            {...listeners}
            type="button"
            aria-label={`Reorder ${tla.title}`}
            className="cursor-grab touch-none rounded-lg p-1 text-text-muted ring-accent focus-visible:outline-none focus-visible:ring-2 active:cursor-grabbing"
          >
            <GripVertical size={16} />
          </button>
        )}

        <label className="sr-only" htmlFor={`title-${tla.id}`}>
          TLA title
        </label>
        <input
          id={`title-${tla.id}`}
          value={tla.title}
          onChange={(e) => onChange({ ...tla, title: e.target.value })}
          className="flex-1 truncate bg-transparent text-base font-semibold text-strong focus:outline-none focus:ring-2 focus:ring-accent rounded"
        />

        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-1">
            <motion.button
              {...haptic}
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-2 py-1 text-xs text-text-muted"
            >
              Cancel
            </motion.button>
            <motion.button
              {...haptic}
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-inquiry px-2 py-1 text-xs font-medium text-white"
            >
              Confirm delete?
            </motion.button>
          </div>
        ) : (
          <motion.button
            {...haptic}
            type="button"
            aria-label={`Delete ${tla.title}`}
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 text-text-muted hover:text-inquiry"
          >
            <X size={16} />
          </motion.button>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        {tla.learningTypes.map((row) => (
          <LearningTypeRow key={row.id} row={row} onChange={(patch) => updateRow(row.id, patch)} onDelete={() => deleteRow(row.id)} />
        ))}

        <motion.button
          {...haptic}
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-ink/10 py-2 text-xs font-medium text-accent"
        >
          <Plus size={14} /> Add Learning Type
        </motion.button>
      </div>

      <div className="border-t border-ink/10 px-4 py-2 text-xs font-medium text-text-muted">
        Total: {totalMinutes} min
      </div>

      <div className="border-t border-ink/10 px-4">
        <Collapsible title="Notes">
          <textarea
            value={tla.notes}
            onChange={(e) => onChange({ ...tla, notes: e.target.value })}
            placeholder="Notes for this activity..."
            rows={3}
            className="w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </Collapsible>
      </div>

      <div className="border-t border-ink/10 px-4">
        <ResourcesList
          resources={tla.resources}
          onChange={(resources) => onChange({ ...tla, resources })}
          suggestContext={[
            designTopic ? `Course topic: ${designTopic}` : '',
            `Activity: ${tla.title}`,
            ...tla.learningTypes.map((r) => r.description).filter(Boolean),
          ]
            .filter(Boolean)
            .join('\n')}
        />
      </div>
    </motion.div>
  )
}
