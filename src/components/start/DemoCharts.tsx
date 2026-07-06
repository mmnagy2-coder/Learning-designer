// VISUAL DESIGN BRIEF: A stats + chart section proving the tool works with real data. Three
// count-up numbers sit above an averaged pie chart of all seed designs, followed by a "try it
// out" panel showing a single example design's pie so a first-time visitor sees the payoff
// before ever opening the Designer.
import { motion } from 'framer-motion'
import { CountUp } from '../shared/CountUp'
import { LearningTypePieChart } from '../shared/LearningTypePieChart'
import { SkeletonCard, useMinLoadingTime } from '../shared/SkeletonCard'
import { useStaggerVariants } from '../shared/motion'
import type { Design } from '../../types'
import { averageAnalytics, computeAnalytics } from '../../utils/calculateAnalytics'

interface DemoChartsProps {
  designs: Design[]
  loaded: boolean
}

export function DemoCharts({ designs, loaded }: DemoChartsProps) {
  const ready = useMinLoadingTime(loaded)
  const { container, item } = useStaggerVariants()

  if (!ready) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  const avg = averageAnalytics(designs)
  const totalMinutes = designs.reduce((s, d) => s + computeAnalytics(d).totalMinutes, 0)
  const distinctTypes = avg.byLearningType.filter((t) => t.minutes > 0).length
  const design5 = designs[4]
  const design5Analytics = design5 ? computeAnalytics(design5) : null

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3"
      >
        <motion.div variants={item} className="rounded-2xl border border-ink/10 bg-ink/5 p-6 backdrop-blur-lg">
          <div className="text-3xl font-bold text-accent">
            <CountUp value={designs.length} />
          </div>
          <p className="mt-1 text-sm text-text-muted">Designs created</p>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-ink/10 bg-ink/5 p-6 backdrop-blur-lg">
          <div className="text-3xl font-bold text-accent">
            <CountUp value={totalMinutes / 60} decimals={1} suffix="h" />
          </div>
          <p className="mt-1 text-sm text-text-muted">Designed hours</p>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-ink/10 bg-ink/5 p-6 backdrop-blur-lg">
          <div className="text-3xl font-bold text-accent">
            <CountUp value={distinctTypes} />
          </div>
          <p className="mt-1 text-sm text-text-muted">Learning types used</p>
        </motion.div>
      </motion.div>

      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-ink/10 bg-ink/5 p-8 backdrop-blur-lg sm:flex-row sm:justify-center"
      >
        <LearningTypePieChart data={avg.byLearningType} size={220} />
        <div className="text-left">
          <h3 className="text-lg font-semibold text-strong">Average balance across your designs</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Averaged across all {designs.length} sample designs, weighted toward hands-on practice
            and production time.
          </p>
        </div>
      </motion.div>

      {design5 && design5Analytics && (
        <motion.div
          variants={item}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-10 rounded-2xl border border-ink/10 bg-ink/5 p-8 backdrop-blur-lg"
        >
          <h3 className="mb-4 text-lg font-semibold text-strong">Try it out: {design5.name}</h3>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <LearningTypePieChart data={design5Analytics.byLearningType} size={200} />
            <div className="text-left">
              <p className="text-sm text-text-muted">{design5.description}</p>
              <p className="mt-2 text-sm text-text-muted">
                {design5Analytics.totalMinutes} minutes designed · target {design5.learningTimeMinutes} minutes
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  )
}
