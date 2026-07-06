// Centered glassmorphic modal with a dimmed backdrop. Used for delete confirmations and any
// other blocking dialog in the app. Escape key and backdrop click both dismiss.
import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
}

export function Modal({ isOpen, onClose, children, labelledBy }: ModalProps) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-xl backdrop-blur-lg"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
