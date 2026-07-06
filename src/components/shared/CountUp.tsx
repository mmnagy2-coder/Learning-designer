// Displays a number that animates from 0 up to `value` the first time it scrolls into view,
// and never re-triggers on subsequent scroll in/out.
import { useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'

interface CountUpProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function CountUp({ value, duration = 1200, decimals = 0, suffix = '', prefix = '', className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [hasTriggered, setHasTriggered] = useState(false)

  if (isInView && !hasTriggered) setHasTriggered(true)

  const animated = useCountUp(hasTriggered ? value : 0, duration)

  return (
    <span ref={ref} className={className}>
      {prefix}
      {animated.toFixed(decimals)}
      {suffix}
    </span>
  )
}
