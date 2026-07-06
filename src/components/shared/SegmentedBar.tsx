// Thin horizontal bar split into proportional colored segments. Used as the mini color bar on
// design cards and as the per-TLA color bar in the Designer (see designer/ColorBar.tsx).
import { motion } from 'framer-motion'

export interface BarSegment {
  color: string
  weight: number
  key: string
}

interface SegmentedBarProps {
  segments: BarSegment[]
  height?: number
  rounded?: boolean
}

export function SegmentedBar({ segments, height = 6, rounded = true }: SegmentedBarProps) {
  const total = segments.reduce((s, seg) => s + seg.weight, 0)

  return (
    <div
      className={`flex w-full overflow-hidden bg-white/5 ${rounded ? 'rounded-full' : ''}`}
      style={{ height }}
      role="img"
      aria-label="Learning type balance"
    >
      {total === 0 ? (
        <div className="h-full w-full bg-white/10" />
      ) : (
        segments
          .filter((seg) => seg.weight > 0)
          .map((seg) => (
            <motion.div
              key={seg.key}
              layout
              className="h-full"
              style={{ backgroundColor: seg.color }}
              initial={false}
              animate={{ width: `${(seg.weight / total) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          ))
      )}
    </div>
  )
}
