import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Animates a number from 0 to `end` over `duration` ms using requestAnimationFrame.
 * Re-runs whenever `end` changes (callers pair this with useInView for a
 * "trigger once when it enters the viewport" effect).
 */
export function useCountUp(end: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(t)
      setValue(from + (end - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setValue(end)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration])

  return value
}
