// VISUAL DESIGN BRIEF: A data-dense but calm breakdown of the design's balance — a large
// learning-type pie with count-up percentage labels, four small donut comparisons in a row,
// a horizontal stacked bar for group-size distribution, and a designed-vs-target comparison.
// All numbers animate in via count-up the first time this tab scrolls into view.
import { useMemo } from 'react'
import { AlertTriangle, BrainCircuit, CheckCircle2, PersonStanding, Target } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Design } from '../../types'
import { computeAnalytics, type BinarySplit } from '../../utils/calculateAnalytics'
import { computeAlignment } from '../../utils/alignment'
import { FOUR_DS, FOUR_DS_ATTRIBUTION } from '../../utils/fourDs'
import { computeUdlCoverage, udlCheckpointLabel, UDL_ATTRIBUTION } from '../../utils/udl'
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

function AlignmentCard({ design }: { design: Design }) {
  const alignment = useMemo(() => computeAlignment(design), [design.outcomeStatements, design.tlas])

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <Target size={18} className="text-accent" /> Constructive alignment
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Which activities serve which learning outcomes — orphaned outcomes and unaligned activities
        are the first things a validation panel looks for.
      </p>

      {!alignment.hasOutcomes ? (
        <div className="rounded-xl border border-dashed border-ink/10 p-6 text-center text-sm text-text-muted">
          Add written learning outcomes in the header, then tag each activity with the outcomes it
          serves to see the alignment map here.
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2">
            {alignment.outcomes.map((o, i) => (
              <li key={o.outcomeId} className="flex items-start gap-2 rounded-xl bg-ink/5 px-3 py-2 text-sm">
                {o.tlaCount > 0 ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-production" />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-inquiry" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="mr-1.5 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    LO{i + 1}
                  </span>
                  <span className="text-text-primary">{o.text}</span>
                </div>
                <span className={`shrink-0 text-xs ${o.tlaCount > 0 ? 'text-text-muted' : 'font-medium text-inquiry'}`}>
                  {o.tlaCount > 0 ? `${o.tlaCount} ${o.tlaCount === 1 ? 'activity' : 'activities'} · ${o.minutes} min` : 'orphaned — no activity serves this'}
                </span>
              </li>
            ))}
          </ul>

          {alignment.unalignedTlas.length > 0 && (
            <div className="rounded-xl border border-collaboration/40 bg-collaboration/10 px-3 py-2 text-xs text-collaboration">
              <span className="font-semibold">Unaligned activities: </span>
              {alignment.unalignedTlas.map((t) => t.title).join(', ')} — tag each with the outcome(s)
              it serves via the LO chips on its card.
            </div>
          )}

          {alignment.orphanedOutcomes.length === 0 && alignment.unalignedTlas.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-production/40 bg-production/10 px-3 py-2 text-xs text-production">
              <CheckCircle2 size={14} /> Every outcome is served by at least one activity, and every
              activity serves at least one outcome.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FourDsCard({ design }: { design: Design }) {
  const perD = useMemo(
    () =>
      FOUR_DS.map((d) => {
        const tagged = design.tlas.filter((t) => (t.fourDs ?? []).includes(d.id))
        return {
          ...d,
          count: tagged.length,
          minutes: tagged.reduce((sum, t) => sum + t.learningTypes.reduce((s, r) => s + r.durationMinutes, 0), 0),
        }
      }),
    [design.tlas]
  )

  if (perD.every((d) => d.count === 0)) return null

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <BrainCircuit size={18} className="text-practice" /> AI literacy · the 4Ds
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Where this session develops each dimension of working with AI.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {perD.map((d) => (
          <div key={d.id} className="rounded-xl bg-ink/5 px-3 py-2 text-center" title={d.hint}>
            <div className={`text-lg font-bold ${d.count > 0 ? 'text-practice' : 'text-text-muted'}`}>{d.count}</div>
            <div className="text-xs font-medium text-text-primary">{d.label}</div>
            <div className="text-[10px] text-text-muted">{d.minutes} min</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-text-muted">{FOUR_DS_ATTRIBUTION}</p>
    </div>
  )
}

function UdlCard({ design }: { design: Design }) {
  const coverage = useMemo(() => computeUdlCoverage(design), [design.tlas])

  if (!coverage.hasAnyTags) return null

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-strong">
        <PersonStanding size={18} className="text-accent" /> Inclusive design · UDL
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        Coverage of the CAST UDL 3.0 checkpoints across this session's activities — aim for at
        least one option under each of the three principles.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {coverage.byPrinciple.map((p) => (
          <div key={p.principle} className="rounded-xl bg-ink/5 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium" style={{ color: p.color }}>
                {p.label}
              </span>
              <span className="text-[10px] text-text-muted">
                {p.tagged}/{p.total} checkpoints
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.total > 0 ? (p.tagged / p.total) * 100 : 0}%`, backgroundColor: p.color }}
              />
            </div>
            {p.tagged === 0 && (
              <p className="mt-1 text-[10px] text-inquiry">No options designed under this principle yet.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {coverage.taggedCheckpoints.map((id) => (
          <span
            key={id}
            title={udlCheckpointLabel(id)}
            className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[10px] text-text-muted"
          >
            <span className="font-semibold">{id}</span> {udlCheckpointLabel(id)}
          </span>
        ))}
      </div>

      {coverage.untaggedTlaIds.length > 0 && (
        <p className="mt-3 text-[10px] text-text-muted">
          {coverage.untaggedTlaIds.length}{' '}
          {coverage.untaggedTlaIds.length === 1 ? 'activity has' : 'activities have'} no UDL tags yet —
          use the UDL section on each activity card.
        </p>
      )}
      <p className="mt-3 text-[10px] text-text-muted">{UDL_ATTRIBUTION}</p>
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

      <AlignmentCard design={design} />

      <FourDsCard design={design} />

      <UdlCard design={design} />

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
