// VISUAL DESIGN BRIEF: Full-bleed cinematic hero on a dark gradient-mesh background. The
// headline reveals character-by-character as the focal point, the subheadline fades in once
// the headline finishes, and two haptic CTA buttons anchor the bottom. An organic curved SVG
// divider softens the transition into the page body below.
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useHapticProps } from '../shared/motion'

const HEADLINE = 'Design Learning That Works'

const charContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
}

const charItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function HeroSection() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const haptic = useHapticProps()

  return (
    <section className="relative overflow-hidden bg-background px-4 pb-24 pt-20 text-center md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 20% 20%, rgba(59,130,246,0.25), transparent), radial-gradient(50% 40% at 80% 30%, rgba(168,85,247,0.2), transparent), radial-gradient(40% 40% at 50% 80%, rgba(34,197,94,0.15), transparent)',
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <motion.h1
          variants={reduced ? undefined : charContainer}
          initial={reduced ? { opacity: 0 } : 'hidden'}
          animate={reduced ? { opacity: 1 } : 'show'}
          transition={reduced ? { duration: 0.6 } : undefined}
          className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl"
          aria-label={HEADLINE}
        >
          {reduced
            ? HEADLINE
            : HEADLINE.split('').map((char, i) => (
                <motion.span key={i} variants={charItem} aria-hidden className="inline-block">
                  {char === ' ' ? ' ' : char}
                </motion.span>
              ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0.3 : 1.1, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-text-muted"
        >
          A visually structured approach to learning design for film and media educators
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0.4 : 1.4, duration: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.button
            {...haptic}
            type="button"
            onClick={() => navigate('/designer')}
            className="rounded-xl bg-accent px-6 py-3 font-medium text-white shadow-lg shadow-accent/20"
          >
            Go to the Designer →
          </motion.button>
          <motion.button
            {...haptic}
            type="button"
            onClick={() => navigate('/browser')}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-100 backdrop-blur-lg"
          >
            Explore Designs →
          </motion.button>
        </motion.div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        className="absolute inset-x-0 bottom-0 h-24 w-full text-surface"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,64 C240,120 480,0 720,32 C960,64 1200,120 1440,64 L1440,120 L0,120 Z"
        />
      </svg>
    </section>
  )
}
