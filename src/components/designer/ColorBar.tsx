// Segmented color bar across the top of a TLA column, one segment per learning-type row,
// widths proportional to duration. Transitions smoothly whenever a row's duration changes.
import type { LearningTypeRow } from '../../types'
import { learningTypeColor } from '../../utils/learningTypeConfig'
import { SegmentedBar } from '../shared/SegmentedBar'

interface ColorBarProps {
  rows: LearningTypeRow[]
}

export function ColorBar({ rows }: ColorBarProps) {
  const segments = rows.map((row) => ({
    key: row.id,
    color: learningTypeColor(row.type),
    weight: row.durationMinutes,
  }))

  return <SegmentedBar segments={segments} height={5} rounded={false} />
}
