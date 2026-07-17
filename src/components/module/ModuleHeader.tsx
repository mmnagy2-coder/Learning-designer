// The module descriptor header: name/code, credit and FHEQ level segmented controls with a
// live notional-hours badge and level descriptor hint, then aims and indicative content.
import { motion } from 'framer-motion'
import { Clock, Info } from 'lucide-react'
import type { CreditValue, FheqLevel, Module } from '../../types'
import { CREDIT_OPTIONS, FHEQ_ATTRIBUTION, FHEQ_LEVELS, notionalHours } from '../../utils/fheq'
import { Collapsible } from '../shared/Collapsible'
import { useHapticProps } from '../shared/motion'

interface ModuleHeaderProps {
  module: Module
  onChange: (module: Module) => void
}

const LEVEL_OPTIONS: FheqLevel[] = [4, 5, 6, 7]

export function ModuleHeader({ module, onChange }: ModuleHeaderProps) {
  const haptic = useHapticProps()
  const descriptor = module.level ? FHEQ_LEVELS[module.level] : undefined

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <label className="sr-only" htmlFor="module-name">
            Module name
          </label>
          <input
            id="module-name"
            value={module.name}
            onChange={(e) => onChange({ ...module, name: e.target.value })}
            placeholder="Module title"
            className="w-full bg-transparent text-2xl font-bold text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent rounded"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="module-code">
                Module code
              </label>
              <input
                id="module-code"
                value={module.code ?? ''}
                onChange={(e) => onChange({ ...module, code: e.target.value || undefined })}
                placeholder="e.g. FILM501"
                className="w-32 rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Credits</p>
              <div className="flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
                {CREDIT_OPTIONS.map((c) => (
                  <motion.button
                    {...haptic}
                    key={c}
                    type="button"
                    aria-pressed={module.credits === c}
                    onClick={() => onChange({ ...module, credits: c as CreditValue })}
                    className={`rounded-lg px-3 py-1 text-sm font-medium ${
                      module.credits === c ? 'bg-accent text-white' : 'text-text-muted'
                    }`}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">FHEQ level</p>
              <div className="flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
                {LEVEL_OPTIONS.map((l) => (
                  <motion.button
                    {...haptic}
                    key={l}
                    type="button"
                    aria-pressed={module.level === l}
                    onClick={() => onChange({ ...module, level: l })}
                    className={`rounded-lg px-3 py-1 text-sm font-medium ${
                      module.level === l ? 'bg-accent text-white' : 'text-text-muted'
                    }`}
                  >
                    {l}
                  </motion.button>
                ))}
              </div>
            </div>

            {module.credits && (
              <div className="flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-accent">
                <Clock size={14} />
                {module.credits} credits = {notionalHours(module.credits)} notional hours
              </div>
            )}
          </div>
        </div>
      </div>

      {descriptor && (
        <div className="mt-3 rounded-xl border border-ink/10 bg-ink/5 px-3">
          <Collapsible
            title={
              <span className="flex items-center gap-1.5 text-xs">
                <Info size={13} className="text-accent" />
                Level {descriptor.level} · {descriptor.award} — what outcomes at this level should show
              </span>
            }
          >
            <p className="text-xs text-text-muted">{descriptor.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-text-muted">
              {descriptor.outcomeExpectations.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-text-muted">{FHEQ_ATTRIBUTION}</p>
          </Collapsible>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="module-aims">
            Module aims
          </label>
          <textarea
            id="module-aims"
            value={module.aims ?? ''}
            onChange={(e) => onChange({ ...module, aims: e.target.value || undefined })}
            placeholder="What this module sets out to do, and why it matters in the programme…"
            rows={4}
            className="w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="module-content">
            Indicative content
          </label>
          <textarea
            id="module-content"
            value={module.indicativeContent ?? ''}
            onChange={(e) => onChange({ ...module, indicativeContent: e.target.value || undefined })}
            placeholder="Topics, techniques, and themes the module typically covers…"
            rows={4}
            className="w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </div>
  )
}
