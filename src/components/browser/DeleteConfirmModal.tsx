import { motion } from 'framer-motion'
import type { Design } from '../../types'
import { Modal } from '../shared/Modal'
import { useHapticProps } from '../shared/motion'

interface DeleteConfirmModalProps {
  design: Design | null
  onCancel: () => void
  onConfirm: (design: Design) => void
}

export function DeleteConfirmModal({ design, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const haptic = useHapticProps()

  return (
    <Modal isOpen={design !== null} onClose={onCancel} labelledBy="delete-modal-title">
      {design && (
        <>
          <h2 id="delete-modal-title" className="text-lg font-semibold text-strong">
            Delete '{design.name}'?
          </h2>
          <p className="mt-2 text-sm text-text-muted">This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <motion.button
              {...haptic}
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-ink/10 bg-ink/5 px-4 py-2 text-sm text-text-primary"
            >
              Cancel
            </motion.button>
            <motion.button
              {...haptic}
              type="button"
              onClick={() => onConfirm(design)}
              className="rounded-xl bg-inquiry px-4 py-2 text-sm font-medium text-white"
            >
              Delete
            </motion.button>
          </div>
        </>
      )}
    </Modal>
  )
}
