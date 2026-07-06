// Live pie chart anchoring the metadata header. Recomputes only when design.tlas actually
// changes, so editing unrelated header fields (name, description, etc.) never re-renders it.
import { useMemo } from 'react'
import type { Design } from '../../types'
import { computeAnalytics } from '../../utils/calculateAnalytics'
import { LearningTypePieChart } from '../shared/LearningTypePieChart'

interface LivePieChartProps {
  design: Design
  size?: number
}

export function LivePieChart({ design, size = 180 }: LivePieChartProps) {
  const analytics = useMemo(() => computeAnalytics(design), [design.tlas])

  return <LearningTypePieChart data={analytics.byLearningType} size={size} />
}
