// VISUAL DESIGN BRIEF: A data-dense but calm breakdown of the design's balance — a large
// learning-type pie with count-up percentage labels, four small donut comparisons in a row,
// a horizontal stacked bar for group-size distribution, and a designed-vs-target comparison.
// All numbers animate in via count-up the first time this tab scrolls into view.
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Design } from '../../types'
import { computeAnalytics, type BinarySplit } from '../../utils/calculateAnalytics'
import { CountUp } from '../shared/CountUp'
import { SegmentedBar } from '../shared/SegmentedBar'

interface AnalysisTabProps {
  design: Design
}

const DONUT_COLORS = ['#3b82f6', '#94a3b8']
const GROUP_SIZE_COLORS: Record<string, string> = {
  Individual: '#3b82f6',
  Group: '#eab308',
  'Whole class': '#22c55e',
}

function MiniDonut({ title, splits }: { title: string; splits: BinarySplit[] }) {
  const total = splits.reduce((s, x) => s + x.minutes, 0)
  const data = splits.filter((s) => s.minutes > 0)

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4 text-center shadow-xl backdrop-blur-lg">
      <h4 className="mb-2 text-sm font-medium text-strong">{title}</h4>
      <div className="mx-auto h-32 w-32">
        {total === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-ink/10 text-xs text-text-muted">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="minutes" nameKey="label" innerRadius={32} outerRadius={56} paddingAngle={2}>
                {data.map((entry, i) => (
                  <Cell key={entry.label} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} min`, name]}
                contentStyle={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 space-y-1 text-xs">
        {splits.map((s, i) => (
          <div key={s.label} className="flex items-center justify-center gap-1.5 text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            {s.label}: {total > 0 ? Math.round((s.minutes / total) * 100) : 0}%
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalysisTab({ design }: AnalysisTabProps) {
  const analytics = useMemo(() => computeAnalytics(design), [design.tlas])

  if (analytics.totalMinutes === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/10 p-16 text-center text-text-muted">
        Add TLAs with durations to see your analysis
      </div>
    )
  }

  const groupSizeTotal = analytics.groupSize.reduce((s, g) => s + g.minutes, 0)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
        <h3 className="mb-4 text-lg font-semibold text-strong">Learning type balance</h3>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-64 w-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byLearningType.filter((t) => t.minutes > 0)}
                  dataKey="minutes"
                  nameKey="label"
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {analytics.byLearningType
                    .filter((t) => t.minutes > 0)
                    .map((entry) => (
                      <Cell key={entry.type} fill={entry.color} stroke="none" />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} min`, name]}
                  contentStyle={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            {analytics.byLearningType.map((t) => (
              <div key={t.type} className="flex items-center gap-2 rounded-xl bg-ink/5 px-3 py-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                <div>
                  <div className="font-medium text-strong">{t.label}</div>
                  <div className="text-xs text-text-muted">
                    <CountUp value={t.percent} decimals={0} suffix="%" /> · {t.minutes} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniDonut title="Face to face vs Online" splits={analytics.faceToFaceVsOnline} />
        <MiniDonut title="Teacher present vs Not" splits={analytics.teacherPresence} />
        <MiniDonut title="Synchronous vs Async" splits={analytics.synchronicity} />
        <MiniDonut title="Formative vs Summative" splits={analytics.assessment} />
      </div>

      <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
        <h3 className="mb-4 text-lg font-semibold text-strong">Individual vs Group vs Whole class</h3>
        <SegmentedBar
          segments={analytics.groupSize.map((g) => ({ key: g.label, color: GROUP_SIZE_COLORS[g.label], weight: g.minutes }))}
          height={20}
        />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
          {analytics.groupSize.map((g) => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GROUP_SIZE_COLORS[g.label] }} />
              {g.label}: {g.minutes} min ({groupSizeTotal > 0 ? Math.round((g.minutes / groupSizeTotal) * 100) : 0}%)
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 text-center shadow-xl backdrop-blur-lg">
          <p className="text-xs uppercase tracking-wide text-text-muted">Designed time</p>
          <div className="mt-1 text-3xl font-bold text-accent">
            <CountUp value={analytics.totalMinutes} suffix=" min" />
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 text-center shadow-xl backdrop-blur-lg">
          <p className="text-xs uppercase tracking-wide text-text-muted">Target learning time</p>
          <div className="mt-1 text-3xl font-bold text-strong">
            <CountUp value={design.learningTimeMinutes} suffix=" min" />
          </div>
        </div>
      </div>
    </div>
  )
}
