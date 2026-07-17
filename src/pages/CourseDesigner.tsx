// The programme workspace: a BA (Hons) or MA programme composed of the user's modules, with
// credit validation per stage, programme outcomes, and a curriculum map. Same conventions as
// the session and module designers (URL ?id=, debounced auto-save).
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Check, ChevronDown, Download, FilePlus2, Loader2, Sparkles, Wand2, X } from 'lucide-react'
import type { Course } from '../types'
import { useCourses } from '../hooks/useCourses'
import { useModules } from '../hooks/useModules'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../components/shared/Toast'
import { useHapticProps } from '../components/shared/motion'
import { CourseHeader } from '../components/course/CourseHeader'
import { StageBoard } from '../components/course/StageBoard'
import { CurriculumMap } from '../components/course/CurriculumMap'
import { StatementsEditor } from '../components/shared/StatementsEditor'
import { blankCourse } from '../utils/courseFactory'
import { hydrateGeneratedCourse } from '../utils/importCourse'
import { AWARDS, fheqSummaryForPrompt } from '../utils/fheq'
import { udlSummaryForPrompt } from '../utils/udl'
import { DEFAULT_MODEL, sanitizeModel } from '../utils/aiModels'
import { useAI, stripCodeFences } from '../components/ai/useAI'

const COURSE_GENERATE_SYSTEM_PROMPT = `You are an expert UK higher education curriculum designer specialising in film and media production. You design whole programmes aligned to the QAA Frameworks for Higher Education Qualifications (FHEQ, 2024). When asked to generate a programme, return ONLY valid JSON with no markdown fences and no explanatory text, matching exactly this shape:

{
  "title": "string",
  "award": "BA",
  "aims": "string",
  "notes": "Entry requirements and assessment strategy overview",
  "outcomeStatements": [
    { "text": "Create professional-standard moving-image work for defined audiences", "bloomLevel": "Create" }
  ],
  "stages": [
    {
      "level": 4,
      "name": "Year 1 · Level 4",
      "modules": [
        { "name": "string", "code": "FILM401", "credits": 30, "isCore": true, "programmeOutcomeIndexes": [0, 2] }
      ]
    }
  ]
}

Rules:
- award is "BA" (BA (Hons): 360 credits — stages at levels 4, 5 and 6, exactly 120 credits each) or "MA" (180 credits — one stage at level 7).
- Module credits must be 15 or 30 and each stage's module credits must sum exactly to its target (120 per BA level; 180 for MA level 7).
- Write 5-8 programme-level outcomeStatements (Bloom's verb first). Each module's programmeOutcomeIndexes lists the zero-based programme outcomes it develops — every programme outcome must be developed by at least one module, and outcomes must progress across levels per the FHEQ:
${fheqSummaryForPrompt()}
- Design inclusively per the CAST UDL Guidelines 3.0 — vary module assessment and delivery so students have multiple means of engagement, representation, and action & expression.
- Use realistic MetFilm School film production contexts (camera, editing, VFX, sound, directing, producing, AI in film).`

const COURSE_CRITIQUE_SYSTEM_PROMPT = `You are a UK higher education periodic-review panellist critiquing a programme design. The user message contains the programme JSON (with per-stage credit totals pre-computed) and summaries of its modules — use those numbers; do not recompute them.

Structure your markdown response with exactly these five sections:

## Structure and credit totals
BA (Hons) needs 360 credits (120 per level at 4, 5, 6); MA needs 180 at level 7. Name any stage over or under target, modules without credits or levels set, and comment on core/optional balance.

## Level progression
Judge whether the programme steps up appropriately across levels per the FHEQ:
${fheqSummaryForPrompt()}

## Programme outcomes and curriculum map
Name any programme outcome no module maps to, any module mapping to nothing, and whether outcomes read as graduate-level attributes (not module-level tasks).

## Inclusive design (UDL)
Two or three programme-level prompts against the CAST UDL Guidelines 3.0 (cite checkpoint numbers) — assessment variety across the award, accessibility of the overall diet, learner choice.

## Top three changes
The three highest-impact edits, ordered, each one sentence with the reason.

Be specific; cite stage names, module titles, and PO numbers from the data. Keep the whole response under 450 words.
Checkpoint reference:
${udlSummaryForPrompt()}`

export function CourseDesigner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { courses, getCourse, saveCourse } = useCourses()
  const idParam = searchParams.get('id')
  const creatingRef = useRef(false)

  const course = idParam ? getCourse(idParam) : undefined

  useEffect(() => {
    if (course) return
    if (courses.length > 0) {
      const newest = [...courses].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      setSearchParams({ id: newest.id }, { replace: true })
    } else if (!creatingRef.current) {
      creatingRef.current = true
      const blank = blankCourse()
      saveCourse(blank)
      setSearchParams({ id: blank.id }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, courses.length])

  if (!course) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-text-muted">Loading…</div>
  }

  return (
    <CourseDesignerContent
      key={course.id}
      initialCourse={course}
      saveCourse={saveCourse}
      onNavigateToCourse={(id) => setSearchParams({ id })}
    />
  )
}

interface ContentProps {
  initialCourse: Course
  saveCourse: (course: Course) => void
  onNavigateToCourse: (id: string) => void
}

function CourseDesignerContent({ initialCourse, saveCourse, onNavigateToCourse }: ContentProps) {
  const [course, setCourse] = useState<Course>(initialCourse)
  const [justSaved, setJustSaved] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [critique, setCritique] = useState<string | null>(null)
  const { modules, saveModule } = useModules()
  const { showToast } = useToast()
  const haptic = useHapticProps()
  const saveTimeoutRef = useRef<number | null>(null)
  const isFirstRender = useRef(true)
  const [storedModel] = useLocalStorage('ld_claude_model', DEFAULT_MODEL)
  const model = sanitizeModel(storedModel)
  const { send, loading, error, setError } = useAI()

  const assignedCredits = course.stages.reduce(
    (sum, stage) =>
      sum +
      stage.moduleRefs.reduce((s, ref) => s + (modules.find((m) => m.id === ref.moduleId)?.credits ?? 0), 0),
    0
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => saveCourse(course), 1000)
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course])

  function handleManualSave() {
    saveCourse(course)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  function handleNewCourse() {
    const blank = blankCourse()
    saveCourse(blank)
    onNavigateToCourse(blank.id)
    showToast('New programme created', 'success')
  }

  /** Outcome edits also clean curriculum-map references to deleted outcomes. */
  function setOutcomes(statements: Course['outcomeStatements']) {
    const ids = new Set(statements.map((s) => s.id))
    setCourse((prev) => ({
      ...prev,
      outcomeStatements: statements,
      stages: prev.stages.map((s) => ({
        ...s,
        moduleRefs: s.moduleRefs.map((r) => ({
          ...r,
          programmeOutcomeIds: r.programmeOutcomeIds?.filter((id) => ids.has(id)),
        })),
      })),
    }))
  }

  async function generate() {
    if (!generatePrompt.trim()) return
    const text = await send([{ role: 'user', content: generatePrompt }], {
      model,
      system: COURSE_GENERATE_SYSTEM_PROMPT,
    })
    if (!text) return
    try {
      const hydrated = hydrateGeneratedCourse(JSON.parse(stripCodeFences(text)))
      if (!hydrated) throw new Error('invalid')
      hydrated.modules.forEach(saveModule)
      saveCourse(hydrated.course)
      onNavigateToCourse(hydrated.course.id)
      setGenerateOpen(false)
      setGeneratePrompt('')
      showToast(`Programme generated with ${hydrated.modules.length} module stubs — open each to flesh it out`, 'success')
    } catch {
      setError('The AI response was not a valid programme — try again.')
    }
  }

  async function runCritique() {
    setCritique(null)
    const rule = AWARDS[course.award]
    const payload = {
      course,
      creditRules: rule,
      stageCredits: course.stages.map((stage) => ({
        name: stage.name,
        level: stage.level,
        target: rule.stages.find((s) => s.level === stage.level)?.credits ?? 0,
        assigned: stage.moduleRefs.reduce(
          (s, ref) => s + (modules.find((m) => m.id === ref.moduleId)?.credits ?? 0),
          0
        ),
      })),
      modules: course.stages.flatMap((stage) =>
        stage.moduleRefs.map((ref) => {
          const m = modules.find((x) => x.id === ref.moduleId)
          return {
            stage: stage.name,
            name: m?.name ?? 'missing module',
            code: m?.code,
            credits: m?.credits ?? null,
            level: m?.level ?? null,
            isCore: ref.isCore,
            outcomes: m?.outcomeStatements?.map((o) => o.text) ?? [],
            assessmentMethods: m?.assessments?.map((a) => `${a.method || a.title} (${a.type})`) ?? [],
            mapsToProgrammeOutcomes: (ref.programmeOutcomeIds ?? []).map(
              (id) => `PO${course.outcomeStatements.findIndex((o) => o.id === id) + 1}`
            ),
          }
        })
      ),
    }
    const text = await send([{ role: 'user', content: JSON.stringify(payload) }], {
      model,
      system: COURSE_CRITIQUE_SYSTEM_PROMPT,
    })
    if (text) setCritique(text)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CourseHeader course={course} assignedCredits={assignedCredits} onChange={setCourse} />

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <motion.button {...haptic} type="button" onClick={handleNewCourse} className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white">
          <FilePlus2 size={15} /> New Programme
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
                className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-ink/10 bg-elevated p-1 shadow-xl"
              >
                <button
                  role="menuitem"
                  onClick={async () => {
                    setExportOpen(false)
                    try {
                      const { downloadCourseAsDocx } = await import('../utils/exportCourseDocx')
                      await downloadCourseAsDocx(course, modules)
                    } catch {
                      showToast('Could not generate the Word file', 'error')
                    }
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-ink/5"
                >
                  Programme spec (.docx)
                </button>
                <button
                  role="menuitem"
                  onClick={async () => {
                    setExportOpen(false)
                    try {
                      const { downloadCourseAsPdf } = await import('../utils/exportCoursePdf')
                      await downloadCourseAsPdf(course, modules)
                    } catch {
                      showToast('Could not generate the PDF', 'error')
                    }
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-ink/5"
                >
                  Programme spec (PDF)
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
                Describe the programme — subject and award (BA or MA). The AI drafts the full structure as a new
                programme with lean module stubs you can then open and develop.
              </p>
              <textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g. A BA (Hons) in Film Production with strands in camera, editing and directing, and AI literacy throughout…"
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
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} Generate programme
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
        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 shadow-xl backdrop-blur-lg">
          <StatementsEditor
            label="Programme learning outcomes"
            chipPrefix="PO"
            statements={course.outcomeStatements}
            onChange={setOutcomes}
            aiSystemPrompt={`You are an expert UK higher education curriculum designer for film and media production. Write 5-8 programme-level learning outcome statements for a ${AWARDS[course.award].label} programme — graduate attributes, not module tasks${
              course.award === 'MA'
                ? ', at FHEQ level 7 (critical awareness, originality, self-direction)'
                : ", culminating at FHEQ level 6 (bachelor's with honours: systematic understanding, critical evaluation, work at the forefront of the discipline)"
            }. Each starts with a Bloom's action verb. Return ONLY a valid JSON array with no markdown fences, where each item is {"text": "string", "bloomLevel": "Remember"|"Understand"|"Apply"|"Analyse"|"Evaluate"|"Create"}.`}
            aiContext={`Programme: ${course.title}\nAward: ${AWARDS[course.award].label}\nAims: ${course.aims || 'not specified'}`}
          />
        </div>

        <StageBoard course={course} onChange={setCourse} modules={modules} saveModule={saveModule} />

        <CurriculumMap course={course} onChange={setCourse} modules={modules} />
      </div>
    </div>
  )
}
