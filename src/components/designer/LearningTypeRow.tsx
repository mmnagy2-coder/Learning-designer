import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users2, Wifi, WifiOff, Radio, Clock, X } from 'lucide-react'
import type { AssessmentType, LearningTypeRow as LearningTypeRowModel } from '../../types'
import { LEARNING_TYPES, learningTypeColor } from '../../utils/learningTypeConfig'
import { useHapticProps } from '../shared/motion'

interface LearningTypeRowProps {
  row: LearningTypeRowModel
  onChange: (row: LearningTypeRowModel) => void
  onDelete: () => void
}

const ASSESSMENT_CYCLE: AssessmentType[] = ['none', 'formative', 'summative']
const ASSESSMENT_LABEL: Record<AssessmentType, string> = { none: 'No assessment', formative: 'Formative', summative: 'Summative' }

function IconToggle({
  active,
  onClick,
  label,
  ActiveIcon,
  InactiveIcon,
  activeText,
  inactiveText,
}: {
  active: boolean
  onClick: () => void
  label: string
  ActiveIcon: typeof User
  InactiveIcon: typeof User
  activeText: string
  inactiveText: string
}) {
  const haptic = useHapticProps()
  const Icon = active ? ActiveIcon : InactiveIcon
  return (
    <motion.button
      {...haptic}
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={active ? activeText : inactiveText}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
        active ? 'border-accent/50 bg-accent/10 text-accent' : 'border-ink/10 text-text-muted'
      }`}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{active ? activeText : inactiveText}</span>
    </motion.button>
  )
}

export function LearningTypeRow({ row, onChange, onDelete }: LearningTypeRowProps) {
  const [descFocused, setDescFocused] = useState(false)
  const haptic = useHapticProps()
  const color = learningTypeColor(row.type)

  function patch(partial: Partial<LearningTypeRowModel>) {
    onChange({ ...row, ...partial })
  }

  return (
    <div className="rounded-xl bg-ink/5 py-3 pl-3 pr-2" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`type-${row.id}`}>
          Learning type
        </label>
        <select
          id={`type-${row.id}`}
          value={row.type}
          onChange={(e) => patch({ type: e.target.value as LearningTypeRowModel['type'] })}
          className="rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {LEARNING_TYPES.map((cfg) => (
            <option key={cfg.type} value={cfg.type} className="bg-surface">
              {cfg.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`duration-${row.id}`}>
          Duration in minutes
        </label>
        <input
          id={`duration-${row.id}`}
          type="number"
          min={0}
          value={row.durationMinutes}
          onChange={(e) => patch({ durationMinutes: Math.max(0, Number(e.target.value)) })}
          className="w-20 rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          aria-describedby={`duration-unit-${row.id}`}
        />
        <span id={`duration-unit-${row.id}`} className="text-xs text-text-muted">
          min
        </span>

        <label className="sr-only" htmlFor={`groupsize-${row.id}`}>
          Group size
        </label>
        <div className="flex items-center gap-1">
          <Users2 size={13} className="text-text-muted" />
          <input
            id={`groupsize-${row.id}`}
            type="number"
            min={1}
            value={row.groupSize}
            onChange={(e) => patch({ groupSize: Math.max(1, Number(e.target.value)) })}
            className="w-16 rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <motion.button
          {...haptic}
          type="button"
          aria-label="Delete row"
          onClick={onDelete}
          className="ml-auto text-text-muted hover:text-inquiry"
        >
          <X size={16} />
        </motion.button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <IconToggle
          active={row.teacherPresent}
          onClick={() => patch({ teacherPresent: !row.teacherPresent })}
          label="Toggle teacher present"
          ActiveIcon={User}
          InactiveIcon={User}
          activeText="Teacher present"
          inactiveText="No teacher"
        />
        <IconToggle
          active={row.isOnline}
          onClick={() => patch({ isOnline: !row.isOnline })}
          label="Toggle online / face-to-face"
          ActiveIcon={Wifi}
          InactiveIcon={WifiOff}
          activeText="Online"
          inactiveText="Face-to-face"
        />
        <IconToggle
          active={row.isSynchronous}
          onClick={() => patch({ isSynchronous: !row.isSynchronous })}
          label="Toggle synchronous / asynchronous"
          ActiveIcon={Radio}
          InactiveIcon={Clock}
          activeText="Synchronous"
          inactiveText="Asynchronous"
        />
        <motion.button
          {...haptic}
          type="button"
          aria-label="Cycle assessment type"
          onClick={() => {
            const next = ASSESSMENT_CYCLE[(ASSESSMENT_CYCLE.indexOf(row.assessmentType) + 1) % ASSESSMENT_CYCLE.length]
            patch({ assessmentType: next })
          }}
          className={`rounded-full border px-2 py-1 text-xs font-medium ${
            row.assessmentType === 'none'
              ? 'border-ink/10 text-text-muted'
              : row.assessmentType === 'formative'
                ? 'border-collaboration/50 bg-collaboration/10 text-collaboration'
                : 'border-inquiry/50 bg-inquiry/10 text-inquiry'
          }`}
        >
          {ASSESSMENT_LABEL[row.assessmentType]}
        </motion.button>
      </div>

      <label className="sr-only" htmlFor={`desc-${row.id}`}>
        Row description
      </label>
      <textarea
        id={`desc-${row.id}`}
        value={row.description}
        onChange={(e) => patch({ description: e.target.value })}
        onFocus={() => setDescFocused(true)}
        onBlur={() => setDescFocused(false)}
        placeholder="Describe this activity..."
        rows={descFocused ? 3 : 1}
        className="mt-2 w-full resize-none rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  )
}
