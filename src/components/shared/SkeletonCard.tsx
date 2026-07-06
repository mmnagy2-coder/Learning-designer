// Shimmering placeholder shown while localStorage/seed data is "loading" (gated by a
// minimum-400ms timer combined with a data-loaded flag — see useMinLoadingTime below).
import { useEffect, useState } from 'react'

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-ink/10 bg-ink/5 p-5">
      <div className="mb-3 h-4 w-2/3 rounded bg-ink/10" />
      <div className="mb-2 h-3 w-1/2 rounded bg-ink/10" />
      <div className="h-3 w-1/3 rounded bg-ink/10" />
    </div>
  )
}

/**
 * Enforces a minimum 400ms loading state: real content only renders once both the
 * data-loaded flag and the timer have fired.
 */
export function useMinLoadingTime(dataLoaded: boolean, minMs = 400): boolean {
  const [timerDone, setTimerDone] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimerDone(true), minMs)
    return () => window.clearTimeout(timeout)
  }, [minMs])

  return dataLoaded && timerDone
}
