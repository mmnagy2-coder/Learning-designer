// Collapsed-by-default picker for CAST UDL 3.0 checkpoint tags on an activity.
// Grouped by principle → guideline, with full checkpoint labels (numbers alone are cryptic).
import { motion } from 'framer-motion'
import { PersonStanding } from 'lucide-react'
import { UDL_PRINCIPLES, guidelinesForPrinciple } from '../../utils/udl'
import { Collapsible } from '../shared/Collapsible'
import { useHapticProps } from '../shared/motion'

interface UdlTagPickerProps {
  selected: string[]
  onToggle: (checkpointId: string) => void
}

export function UdlTagPicker({ selected, onToggle }: UdlTagPickerProps) {
  const haptic = useHapticProps()

  return (
    <Collapsible
      title={
        <>
          <PersonStanding size={13} /> UDL · Inclusive design
          {selected.length > 0 && (
            <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {selected.length}
            </span>
          )}
        </>
      }
    >
      <div className="space-y-3">
        {UDL_PRINCIPLES.map((principle) => (
          <div key={principle.id}>
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: principle.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: principle.color }} />
              {principle.label}
            </p>
            <div className="space-y-2">
              {guidelinesForPrinciple(principle.id).map((guideline) => (
                <div key={guideline.number}>
                  <p className="mb-0.5 text-[10px] font-medium text-text-muted">
                    {guideline.number} · {guideline.name}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {guideline.checkpoints.map((c) => {
                      const active = selected.includes(c.id)
                      return (
                        <motion.button
                          {...haptic}
                          key={c.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onToggle(c.id)}
                          className={`rounded-lg border px-2 py-1 text-left text-[10px] leading-snug ${
                            active ? 'font-medium' : 'border-ink/10 text-text-muted'
                          }`}
                          style={
                            active
                              ? {
                                  borderColor: principle.color,
                                  color: principle.color,
                                  backgroundColor: `${principle.color}1f`,
                                }
                              : undefined
                          }
                        >
                          <span className="font-semibold">{c.id}</span> {c.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  )
}
