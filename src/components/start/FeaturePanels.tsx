// VISUAL DESIGN BRIEF: Two glass panels sit side-by-side on desktop and stack vertically
// below 768px, each with a distinct accent border to differentiate the two core value props.
// They fade/slide in together using the shared stagger variants.
import { motion } from 'framer-motion'
import { Palette, Share2 } from 'lucide-react'
import { useStaggerVariants } from '../shared/motion'

export function FeaturePanels() {
  const { container, item } = useStaggerVariants()

  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-16 md:grid-cols-2"
    >
      <motion.div
        variants={item}
        className="rounded-2xl border border-blue-500/30 bg-white/5 p-8 shadow-xl backdrop-blur-lg"
      >
        <Palette className="mb-4 text-accent" size={28} />
        <h3 className="mb-2 text-xl font-semibold text-slate-100">Express your pedagogy</h3>
        <p className="text-text-muted">
          Sequence Teaching &amp; Learning Activities across six research-backed learning types —
          Acquisition, Collaboration, Discussion, Inquiry, Practice, and Production — and see the
          balance of your session take shape visually as you build it.
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl border border-green-500/30 bg-white/5 p-8 shadow-xl backdrop-blur-lg"
      >
        <Share2 className="mb-4 text-production" size={28} />
        <h3 className="mb-2 text-xl font-semibold text-slate-100">Create and share designs</h3>
        <p className="text-text-muted">
          Build a library of reusable session designs, export them as JSON or a student-facing
          markdown guide, and share a link so a colleague can open your design directly.
        </p>
      </motion.div>
    </motion.section>
  )
}
