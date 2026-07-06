import { useReducedMotion } from 'framer-motion'
import type { Transition, Variants } from 'framer-motion'

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

const reducedContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const reducedItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

/** Stagger variants that collapse to opacity-only when the user prefers reduced motion. */
export function useStaggerVariants() {
  const reduced = useReducedMotion()
  return reduced ? { container: reducedContainer, item: reducedItem } : { container: staggerContainer, item: staggerItem }
}

const hapticTransition: Transition = { type: 'spring', stiffness: 400, damping: 17 }

/** Spread onto any motion element for the app's standard haptic-style click + hover feedback. */
export function useHapticProps() {
  const reduced = useReducedMotion()
  if (reduced) return {}
  return {
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02 },
    transition: hapticTransition,
  }
}

/** Standard entrance animation: fade + slide up 8px, 250ms ease-out (opacity-only when reduced). */
export function useFadeSlideUp() {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.25 },
    }
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' as const },
  }
}
