// The module workspace: a full UK module descriptor (FHEQ-aligned) built over the same
// URL-as-source-of-truth + debounced-auto-save conventions as the session Designer.
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FilePlus2,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react'
import type { Module } from '../types'
import { useModules } from '../hooks/useModules'
import { useDesigns } from '../hooks/useDesigns'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../components/shared/Toast'
import { useHapticProps } from '../components/shared/motion'
import { ModuleHeader } from '../components/module/ModuleHeader'
import { AssessmentEditor } from '../components/module/AssessmentEditor'
import { WeekPlanner } from '../components/module/WeekPlanner'
import { ModuleAnalysis } from '../components/module/ModuleAnalysis'
import { StatementsEditor } from '../components/shared/StatementsEditor'
import { ResourcesList } from '../components/designer/ResourcesList'
import { blankModule } from '../utils/moduleFactory'
import { computeModuleAnalytics } from '../utils/moduleAnalytics'
import { hydrateGeneratedModule, parseImportedModule } from '../utils/importModule'
import { downloadModuleAsJson } from '../utils/exportModule'
import { fheqSummaryForPrompt, FHEQ_LEVELS } from '../utils/fheq'
import { udlSummaryForPrompt } from '../utils/udl'
import { DEFAULT_MODEL, sanitizeModel } from '../utils/aiModels'
import { useAI, stripCodeFences } from '../components/ai/useAI'

const MODULE_GENERATE_SYSTEM_PROMPT = `You are an expert UK higher education learning designer specialising in film and media production. You design module descriptors aligned to the QAA Frameworks for Higher Education Qualifications (FHEQ, 2024). When asked to generate a module, return ONLY valid JSON with no markdown fences and no explanatory text, matching exactly this shape:

{
  "name": "string",
  "code": "FILM501",
  "credits": 15,
  "level": 5,
  "aims": "string",
  "indicativeContent": "string",
  "outcomeStatements": [
    { "text": "Evaluate lens choices for broadcast interview setups", "bloomLevel": "Evaluate" }
  ],
  "assessments": [
    { "title": "string", "type": "summative", "method": "Portfolio", "weighting": 60, "weekDue": 12, "outcomeIndexes": [0, 1] }
  ],
  "weeks": [
    { "number": 1, "topic": "string", "notes": "string" }
  ],
  "readingList": [
    { "title": "string", "url": "https://..." }
  ]
}

Rules:
- credits must be 15 or 30 (UK CATS; one credit = ten notional learning hours, so 15 credits = 150 hours, 30 = 300 hours). Plan 11-12 weeks for a 15-credit module and up to 24 for a 30-credit module unless the user says otherwise.
- level must be 4, 5, 6, or 7, and the outcomes must genuinely match that FHEQ level:
${fheqSummaryForPrompt()}
- Write 4-6 assessable outcomeStatements; each starts with a Bloom's action verb (bloomLevel one of Remember, Understand, Apply, Analyse, Evaluate, Create) appropriate to the FHEQ level.
- assessments: type is "formative" or "summative"; summative weightings must sum to exactly 100; every outcome must be assessed by at least one summative component (via zero-based outcomeIndexes); include at least one early formative component (weighting 0).
- Design inclusively per the CAST UDL Guidelines 3.0 (multiple means of engagement, representation, action & expression) — reflect this in weekly topics, assessment method variety, and reading list formats.
- Reading list: prefer stable, well-known sources; if unsure an exact URL exists, use a search URL — never invent a specific article URL.
- Use realistic MetFilm School film production contexts.`

const MODULE_CRITIQUE_SYSTEM_PROMPT = `You are a UK higher education quality reviewer critiquing a module descriptor before validation. The user message contains the module JSON plus pre-computed analytics (designed session minutes vs notional hours, outcome-assessment coverage, summative weighting total, UDL coverage across linked sessions) — use those numbers; do not recompute them.

Structure your markdown response with exactly these five sections:

## FHEQ level fit
Judge whether the outcomes match the stated FHEQ level, using this framework: ${''}
${fheqSummaryForPrompt()}
Name any outcome pitched too low or too high for the level.

## Credit volume and workload
One credit = ten notional hours. Compare designed session time against notional hours and comment on whether the delivery plan, assessment load, and independent study expectation look right for the credit size.

## Assessment strategy
Weightings (must total 100% summative), outcome coverage (name any outcome not summatively assessed), formative feedback timing, and method variety.

## Inclusive design (UDL)
Critique against the CAST UDL Guidelines 3.0 using the supplied UDL coverage. Suggest two or three checkpoint-level improvements (cite checkpoint numbers) grounded in the actual weeks and assessments. Checkpoint reference:
${udlSummaryForPrompt()}

## Top three changes
The three highest-impact edits before validation, ordered, each one sentence with the reason.

Be specific; cite outcome numbers, week numbers, and component titles from the data. Keep the whole response under 450 words.`

export function ModuleDesigner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { modules, getModule, saveModule } = useModules()
  const idParam = searchParams.get('id')
  const creatingRef = useRef(false)

  const module = idParam ? getModule(idParam) : undefined

  useEffect(() => {
    if (module) return
    if (modules.length > 0) {
      const newest = [...modules].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      setSearchParams({ id: newest.id }, { replace: true })
    } else if (!creatingRef.current) {
      creatingRef.current = true
      const blank = blankModule()
      saveModule(blank)
      setSearchParams({ id: blank.id }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, modules.length])

  if (!module) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-text-muted">Loading…</div>
  }

  return (
    <ModuleDesignerContent
      key={module.id}
      initialModule={module}
      saveModule={saveModule}
      onNavigateToModule={(id) => setSearchParams({ id })}
    />
  )
}

interface ContentProps {
  initialModule: Module
  saveModule: (module: Module) => void
  onNavigateToModule: (id: string) => void
}

function ModuleDesignerContent({ initialModule, saveModule, onNavigateToModule }: ContentProps) {
  const [module, setModule] = useState<Module>(initialModule)
  const [tab, setTab] = useState<'descriptor' | 'analysis'>('descriptor')
  const [justSaved, setJustSaved] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [critique, setCritique] = useState<string | null>(null)
  const { designs, saveDesign } = useDesigns()
  const { showToast } = useToast()
  const haptic = useHapticProps()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const isFirstRender = useRef(true)
  const [storedModel] = useLocalStorage('ld_claude_model', DEFAULT_MODEL)
  const model = sanitizeModel(storedModel)
  const { send, loading, error, setError } = useAI()

  const linkedDesigns = designs.filter((d) => d.moduleId === module.id)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => saveModule(module), 1000)
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module])

  function handleManualSave() {
    saveModule(module)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  function handleNewModule() {
    const blank = blankModule()
    saveModule(blank)
    onNavigateToModule(blank.id)
    showToast('New module created', 'success')
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const { module: imported, error: importError } = parseImportedModule(text)
    if (importError || !imported) {
      showToast(importError ?? 'Invalid module file', 'error')
      return
    }
    saveModule(imported)
    onNavigateToModule(imported.id)
    showToast('Module imported', 'success')
  }

  /** Outcome edits also clean up assessment references to deleted outcomes. */
  function setOutcomes(statements: Module['outcomeStatements']) {
    const ids = new Set((statements ?? []).map((s) => s.id))
    setModule((prev) => ({
      ...prev,
      outcomeStatements: statements?.length ? statements : undefined,
      assessments: prev.assessments?.map((a) => ({
        ...a,
        outcomeIds: a.outcomeIds.filter((id) => ids.has(id)),
      })),
    }))
  }

  async function generate() {
    if (!generatePrompt.trim()) return
    const text = await send([{ role: 'user', content: generatePrompt }], {
      model,
      system: MODULE_GENERATE_SYSTEM_PROMPT,
    })
    if (!text) return
    try {
      const generated = hydrateGeneratedModule(JSON.parse(stripCodeFences(text)))
      if (!generated) throw new Error('invalid')
      saveModule(generated)
      onNavigateToModule(generated.id)
      setGenerateOpen(false)
      setGeneratePrompt('')
      showToast('Module generated — review and refine it', 'success')
    } catch {
      setError('The AI response was not a valid module — try again.')
    }
  }

  async function runCritique() {
    setCritique(null)
    const payload = {
      module,
      analytics: computeModuleAnalytics(module, linkedDesigns),
      fheqDescriptor: module.level ? FHEQ_LEVELS[module.level] : null,
    }
    const text = await send([{ role: 'user', content: JSON.stringify(payload) }], {
      model,
      system: MODULE_CRITIQUE_SYSTEM_PROMPT,
    })
    if (text) setCritique(text)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ModuleHeader module={module} onChange={setModule} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
          {(['descriptor', 'analysis'] as const).map((t) => (
            <motion.button
              {...haptic}
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${
                tab === t ? 'bg-accent text-white' : 'text-text-muted'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button {...haptic} type="button" onClick={handleNewModule} className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white">
            <FilePlus2 size={15} /> New Module
          </motion.button>

          <motion.button
            {...haptic}
            type="button"
            onClick={() => setGenerateOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-text-primary"
          >
            <Wand2 size={15} /> AI Generate
          </motion.button>

          <motion.button
            {...haptic}
            type="button"
            onClick={runCritique}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-text-primary disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} AI Critique
          </motion.button>

          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} aria-label="Import module file" />
          <motion.button {...haptic} type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-text-primary">
            <Upload size={15} /> Import
          </motion.button>

          <div className="relative">
            <motion.button
              {...haptic}
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-text-primary"
            >
              <Download size={15} /> Export <ChevronDown size={14} />
            </motion.button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-ink/10 bg-elevated p-1 shadow-xl"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      downloadModuleAsJson(module)
                      setExportOpen(false)
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-ink/5"
                  >
                    Download as JSON
                  </button>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setExportOpen(false)
                      try {
                        const { downloadModuleAsDocx } = await import('../utils/exportModuleDocx')
                        await downloadModuleAsDocx(module, linkedDesigns)
                      } catch {
                        showToast('Could not generate the Word file', 'error')
                      }
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-ink/5"
                  >
                    Module descriptor (.docx)
                  </button>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setExportOpen(false)
                      try {
                        const { downloadModuleAsPdf } = await import('../utils/exportModulePdf')
                        await downloadModuleAsPdf(module, linkedDesigns)
                      } catch {
                        showToast('Could not generate the PDF', 'error')
                      }
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-ink/5"
                  >
                    Module descriptor (PDF)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            {...haptic}
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-text-primary"
          >
            <AnimatePresence mode="wait">
              {justSaved ? (
                <motion.span key="saved" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-production">
                  <Check size={15} /> Saved
                </motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Save
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {generateOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-ink/10 bg-ink/5 p-4 shadow-xl backdrop-blur-lg">
              <p className="mb-2 text-xs text-text-muted">
                Describe the module — subject, credit size, and FHEQ level. The AI drafts a full descriptor as a
                new module; your current module is untouched.
              </p>
              <textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g. A 30-credit level 5 module on documentary production, blending fieldwork with editing craft…"
                rows={3}
                className="w-full resize-none rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="mt-2 flex justify-end gap-2">
                <motion.button {...haptic} type="button" onClick={() => setGenerateOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-text-muted">
                  Cancel
                </motion.button>
                <motion.button
                  {...haptic}
                  type="button"
                  onClick={generate}
                  disabled={loading || !generatePrompt.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} Generate module
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-xs text-inquiry">{error}</p>}

      <AnimatePresence>
        {critique && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-strong">
                <Sparkles size={15} className="text-accent" /> AI critique
              </h3>
              <motion.button {...haptic} type="button" aria-label="Close critique" onClick={() => setCritique(null)} className="text-text-muted hover:text-inquiry">
                <X size={15} />
              </motion.button>
            </div>
            <div className="prose prose-sm max-w-none text-sm text-text-primary [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-strong [&_li]:my-0.5 [&_ul]:my-1">
              <ReactMarkdown>{critique}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-4">
        {tab === 'analysis' ? (
          <ModuleAnalysis module={module} linkedDesigns={linkedDesigns} />
        ) : (
          <>
            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
              <StatementsEditor
                label="Module learning outcomes"
                statements={module.outcomeStatements ?? []}
                onChange={setOutcomes}
                fheqLevel={module.level}
                aiSystemPrompt={`You are an expert UK higher education learning designer for film and media production. Write 4-6 specific, assessable module-level learning outcome statements${
                  module.level
                    ? ` appropriate to FHEQ level ${module.level}. At this level, outcomes should show: ${FHEQ_LEVELS[module.level].outcomeExpectations.join('; ')}.`
                    : '.'
                } Each starts with a Bloom's action verb and names concrete subject content. Return ONLY a valid JSON array with no markdown fences, where each item is {"text": "string", "bloomLevel": "Remember"|"Understand"|"Apply"|"Analyse"|"Evaluate"|"Create"}.`}
                aiContext={`Module: ${module.name}\nCode: ${module.code ?? 'not set'}\nCredits: ${module.credits ?? 'not set'}\nFHEQ level: ${module.level ?? 'not set'}\nAims: ${module.aims ?? 'not specified'}\nIndicative content: ${module.indicativeContent ?? 'not specified'}`}
              />
            </div>

            <AssessmentEditor
              assessments={module.assessments ?? []}
              outcomes={module.outcomeStatements ?? []}
              weekCount={module.weeks?.length ?? 0}
              onChange={(assessments) =>
                setModule((prev) => ({ ...prev, assessments: assessments.length > 0 ? assessments : undefined }))
              }
            />

            <WeekPlanner module={module} onChange={setModule} designs={designs} saveDesign={saveDesign} />

            <div className="rounded-2xl border border-ink/10 bg-ink/5 px-6 py-3 shadow-xl backdrop-blur-lg">
              <div className="flex items-center gap-2 pt-2 text-lg font-semibold text-strong">
                <BookOpen size={18} className="text-accent" /> Indicative reading & resources
              </div>
              <ResourcesList
                resources={module.readingList ?? []}
                onChange={(readingList) =>
                  setModule((prev) => ({ ...prev, readingList: readingList.length > 0 ? readingList : undefined }))
                }
                suggestContext={`Module reading list for: ${module.name}${module.level ? ` (FHEQ level ${module.level})` : ''}\nAims: ${module.aims ?? ''}\nIndicative content: ${module.indicativeContent ?? ''}`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
