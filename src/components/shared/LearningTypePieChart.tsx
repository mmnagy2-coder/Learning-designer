// Shared Recharts pie renderer for a set of learning-type slices. Used by the live Designer
// pie, the Start page demo charts, and Browser directory mini-pies so the rendering logic
// (colors, empty state, sizing) lives in exactly one place.
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { LearningTypeSlice } from '../../utils/calculateAnalytics'

interface LearningTypePieChartProps {
  data: LearningTypeSlice[]
  size?: number
  innerRadius?: number
  showTooltip?: boolean
}

export function LearningTypePieChart({ data, size = 200, innerRadius = 0, showTooltip = true }: LearningTypePieChartProps) {
  const filtered = data.filter((d) => d.minutes > 0)

  if (filtered.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border border-dashed border-white/10 text-xs text-text-muted"
      >
        No data
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="minutes"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={size / 2 - 4}
            paddingAngle={2}
          >
            {filtered.map((entry) => (
              <Cell key={entry.type} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              formatter={(value: number, name: string) => [`${value} min`, name]}
              contentStyle={{
                background: '#16213e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
