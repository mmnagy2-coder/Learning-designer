// The Browser's Modules section: card per module showing its descriptor badges (code, FHEQ
// level, credits/notional hours) and linked session count, opening in the Module Designer.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, GraduationCap, Trash2 } from 'lucide-react'
import type { Design, Module } from '../../types'
import { useModules } from '../../hooks/useModules'
import { notionalHours } from '../../utils/fheq'
import { blankModule } from '../../utils/moduleFactory'
import { useHapticProps } from '../shared/motion'
import { useToast } from '../shared/Toast'

interface ModulesSectionProps {
  designs: Design[]
}

export function ModulesSection({ designs }: ModulesSectionProps) {
  const { modules, saveModule, deleteModule } = useModules()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const haptic = useHapticProps()
  const navigate = useNavigate()
  const { showToast } = useToast()

  function handleNewModule() {
    const blank = blankModule()
    saveModule(blank)
    navigate(`/module?id=${blank.id}`)
  }

  const sorted = [...modules].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          FHEQ-aligned module descriptors. Sessions link to modules from the session Designer or the
          module's delivery plan.
        </p>
        <motion.button
          {...haptic}
          type="button"
          onClick={handleNewModule}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          <FilePlus2 size={15} /> New Module
        </motion.button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/10 p-12 text-center text-text-muted">
          No modules yet. Create one to start a 15- or 30-credit FHEQ-aligned module descriptor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((module) => {
            const sessionCount = designs.filter((d) => d.moduleId === module.id).length
            return (
              <ModuleCard
                key={module.id}
                module={module}
                sessionCount={sessionCount}
                confirming={confirmingId === module.id}
                onOpen={() => navigate(`/module?id=${module.id}`)}
                onDeleteRequest={() => setConfirmingId(module.id)}
                onDeleteCancel={() => setConfirmingId(null)}
                onDeleteConfirm={() => {
                  deleteModule(module.id)
                  setConfirmingId(null)
                  showToast('Module deleted — its sessions are now unassigned', 'success')
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ModuleCardProps {
  module: Module
  sessionCount: number
  confirming: boolean
  onOpen: () => void
  onDeleteRequest: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}

function ModuleCard({ module, sessionCount, confirming, onOpen, onDeleteRequest, onDeleteCancel, onDeleteConfirm }: ModuleCardProps) {
  const haptic = useHapticProps()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-ink/10 bg-ink/5 p-5 shadow-xl backdrop-blur-lg"
    >
      <button type="button" onClick={onOpen} className="text-left">
        <h3 className="flex items-start gap-2 text-base font-semibold text-strong hover:text-accent">
          <GraduationCap size={17} className="mt-0.5 shrink-0 text-accent" />
          {module.name}
        </h3>
      </button>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {module.code && (
          <span className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
            {module.code}
          </span>
        )}
        {module.level && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            FHEQ level {module.level}
          </span>
        )}
        {module.credits && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            {module.credits} credits · {notionalHours(module.credits)}h
          </span>
        )}
        {!module.credits && !module.level && (
          <span className="rounded-full border border-dashed border-ink/10 px-2 py-0.5 text-[10px] text-text-muted">
            descriptor not started
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-text-muted">
        {sessionCount} linked session{sessionCount === 1 ? '' : 's'}
        {module.outcomeStatements?.length ? ` · ${module.outcomeStatements.length} outcomes` : ''}
        {module.assessments?.length ? ` · ${module.assessments.length} assessments` : ''}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
        <motion.button {...haptic} type="button" onClick={onOpen} className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
          Open designer
        </motion.button>
        {confirming ? (
          <div className="flex items-center gap-1">
            <motion.button {...haptic} type="button" onClick={onDeleteCancel} className="rounded-lg px-2 py-1 text-xs text-text-muted">
              Cancel
            </motion.button>
            <motion.button {...haptic} type="button" onClick={onDeleteConfirm} className="rounded-lg bg-inquiry px-2 py-1 text-xs font-medium text-white">
              Confirm delete?
            </motion.button>
          </div>
        ) : (
          <motion.button
            {...haptic}
            type="button"
            aria-label={`Delete module ${module.name}`}
            onClick={onDeleteRequest}
            className="text-text-muted hover:text-inquiry"
          >
            <Trash2 size={15} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
