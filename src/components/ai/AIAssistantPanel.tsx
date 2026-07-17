// VISUAL DESIGN BRIEF: A floating sparkle button anchors the bottom-right corner of every
// page. It opens a 400px glass panel that springs in from the right (a full-width bottom
// sheet below 768px), containing a gear-icon Settings tab and a pill-switched Assistant tab
// with four AI-powered modes, all routed through the Netlify Claude proxy. The Claude API key
// itself lives server-side as a Netlify environment variable — nothing here ever asks for it.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCcw,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import type { Design } from '../../types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useDesigns } from '../../hooks/useDesigns'
import { useToast } from '../shared/Toast'
import { useHapticProps } from '../shared/motion'
import { SkeletonCard } from '../shared/SkeletonCard'
import { hydrateGeneratedDesign } from '../../utils/importDesign'
import { computeAnalytics } from '../../utils/calculateAnalytics'
import { computeAlignment } from '../../utils/alignment'
import { computeUdlCoverage, udlSummaryForPrompt } from '../../utils/udl'
import { DEFAULT_MODEL, SUPPORTED_MODELS, sanitizeModel } from '../../utils/aiModels'
import { useAI, stripCodeFences, type ChatMessage } from './useAI'

type Section = 'assistant' | 'settings'
type Mode = 'generate' | 'balance' | 'advisor' | 'summary'

const MODES: { id: Mode; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'balance', label: 'Balance' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'summary', label: 'Summary' },
]


const GENERATE_SYSTEM_PROMPT = `You are an expert learning designer specialising in higher education film and media production pedagogy. You use Laurillard's Conversational Framework (Acquisition, Collaboration, Discussion, Inquiry, Practice, Production). When asked to generate a learning design, return ONLY valid JSON with no markdown fences and no explanatory text, matching exactly this shape:

{
  "name": "string",
  "topic": "string",
  "learningTimeMinutes": 120,
  "sizeOfClass": 20,
  "description": "string",
  "modeOfDelivery": "blended",
  "aims": "string",
  "outcomes": ["Apply", "Evaluate"],
  "outcomeStatements": [
    { "text": "Apply focus-pulling technique to a two-person dialogue scene", "bloomLevel": "Apply" },
    { "text": "Evaluate lens choices for broadcast interview setups", "bloomLevel": "Evaluate" }
  ],
  "tlas": [
    {
      "title": "string",
      "notes": "",
      "outcomeIndexes": [0],
      "fourDs": [],
      "udl": ["7.2", "5.1"],
      "learningTypes": [
        {
          "type": "acquisition",
          "durationMinutes": 15,
          "groupSize": 1,
          "teacherPresent": false,
          "isOnline": true,
          "isSynchronous": false,
          "assessmentType": "none",
          "description": "string"
        }
      ],
      "resources": [
        { "title": "string", "url": "https://..." }
      ]
    }
  ]
}

Use realistic MetFilm School film production contexts (camera, editing, VFX, sound, directing, AI tools). Weight activities toward hands-on practice and production (roughly 70% of total time) with acquisition and discussion making up the remainder (roughly 30%). modeOfDelivery must be one of: face-to-face, blended, wholly-online, async-online. type must be one of: acquisition, collaboration, discussion, inquiry, practice, production. assessmentType must be one of: none, formative, summative.

Constructive alignment rules: write 3-6 specific, assessable outcomeStatements (each starts with a Bloom's action verb and names concrete subject content; bloomLevel is one of Remember, Understand, Apply, Analyse, Evaluate, Create). Each activity's outcomeIndexes lists the zero-based indexes of the outcomeStatements it serves — every outcome must be served by at least one activity and every activity must serve at least one outcome. The top-level outcomes array lists only the Bloom's level names used.

If (and only if) an activity has students working with AI tools, tag it in fourDs with the relevant AI-literacy dimensions from: "delegation" (deciding what to hand to AI), "description" (communicating intent to AI), "discernment" (evaluating AI output), "diligence" (taking responsibility for AI-assisted work). Leave fourDs empty otherwise.

Design inclusively per the CAST Universal Design for Learning Guidelines 3.0: across the whole design, deliberately offer multiple means of engagement, representation, and action & expression. Tag each activity's udl array with the 1-3 checkpoint ids it genuinely designs for (do not tag everything). Valid checkpoint ids and meanings:
${udlSummaryForPrompt()}

Include 1-3 resources per activity where genuinely useful: prefer stable, well-known URLs (official documentation such as Adobe or Blackmagic, BFI, ASC, ScreenSkills); if unsure an exact page exists, use a search URL like https://www.youtube.com/results?search_query=... — never invent a specific article URL you are not certain of.`

const BALANCE_SYSTEM_PROMPT = `You are a pedagogic advisor reviewing a learning design for a film and media higher education session, critiquing against explicit frameworks rather than giving generic commentary. The user message contains the design JSON plus pre-computed analytics and a constructive-alignment report — use those numbers; do not recompute them.

Structure your markdown response with exactly these five sections:

## Learning type balance
Judge against best practice for practical creative education (Laurillard). Flag passive load when acquisition + discussion exceed roughly 40% of designed time; flag missing collaboration or inquiry where the subject suggests they belong.

## Constructive alignment
Use the supplied alignment report (Biggs). Name each orphaned outcome and each unaligned activity explicitly and say what to change. If alignment is clean, say so in one sentence. If no written outcomes exist yet, say that adding them is the priority before any other refinement.

## Assessment coverage
Where formative feedback falls in the sequence (too late? absent early on?), whether summative assessment matches the stated outcomes, and whether any outcome is never assessed.

## Inclusive design (UDL)
Critique against the CAST Universal Design for Learning Guidelines 3.0 using the supplied udlCoverage report (checkpoints tagged per principle: engagement, representation, action & expression). Name any principle with zero or thin coverage and suggest two or three concrete checkpoint-level design options (citing checkpoint numbers like 7.2 or 5.1) grounded in the actual activities — consider learner variability, accessibility of materials, and multiple means of expression. If activities are untagged, say tagging them is the first step.

## Top three changes
The three highest-impact edits, ordered, each one sentence with the reason.

Be specific and constructive; cite activity titles and minutes from the data. Keep the whole response under 450 words.`

const ADVISOR_SYSTEM_PROMPT = `The educator teaches at MetFilm School (part of BIMM University) in London. Modules include camera operations, editing, VFX, colour grading, sound design, directing, and AI in film production. Students are undergraduate film production students. The educator is also researching AI's impact on cinema for an EdD at Bournemouth University. Answer as a specialist film pedagogy consultant.`

const SUMMARY_SYSTEM_PROMPT = `Generate a clean, human-readable markdown summary of this learning design formatted as a student-facing session guide. Include: session aims, outcomes, step-by-step activity descriptions with estimated times, and any linked resources. Use clear headings and bullet points.`

export function AIAssistantPanel() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section>('assistant')
  const [mode, setMode] = useState<Mode>('generate')
  const haptic = useHapticProps()

  const [storedModel, setModel] = useLocalStorage('ld_claude_model', DEFAULT_MODEL)
  // A browser may still have a retired model id persisted from an earlier version —
  // sanitize on read so those users silently move to the current default.
  const model = sanitizeModel(storedModel)
  const [keyStatus, setKeyStatus] = useLocalStorage<'valid' | 'invalid' | null>('ld_key_test_status', null)

  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { getDesign } = useDesigns()
  const currentDesign =
    location.pathname.startsWith('/designer') ? (getDesign(searchParams.get('id') ?? '') ?? null) : null

  // The key itself lives server-side now, so we only block the UI if a Test Connection
  // explicitly failed — there's nothing for the user to "set" client-side to unblock it.
  const keyBlocked = keyStatus === 'invalid'

  return (
    <>
      <motion.button
        {...haptic}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-xl shadow-accent/30"
      >
        <Sparkles size={18} /> AI Assistant
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 md:bg-transparent"
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-2xl border border-ink/10 bg-elevated/95 shadow-2xl backdrop-blur-lg md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[400px] md:rounded-none md:rounded-l-2xl"
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" />
                  <h2 className="font-semibold text-strong">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    {...haptic}
                    type="button"
                    aria-label="Settings"
                    aria-pressed={section === 'settings'}
                    onClick={() => setSection(section === 'settings' ? 'assistant' : 'settings')}
                    className={`rounded-lg p-2 ${section === 'settings' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    <SettingsIcon size={16} />
                  </motion.button>
                  <motion.button
                    {...haptic}
                    type="button"
                    aria-label="Close AI Assistant"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-2 text-text-muted hover:text-text-primary"
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {section === 'settings' ? (
                  <SettingsSection model={model} setModel={setModel} keyStatus={keyStatus} setKeyStatus={setKeyStatus} />
                ) : (
                  <AssistantSection mode={mode} setMode={setMode} keyBlocked={keyBlocked} model={model} currentDesign={currentDesign} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface SettingsSectionProps {
  model: string
  setModel: (v: string) => void
  keyStatus: 'valid' | 'invalid' | null
  setKeyStatus: (v: 'valid' | 'invalid' | null) => void
}

function SettingsSection({ model, setModel, keyStatus, setKeyStatus }: SettingsSectionProps) {
  const [testing, setTesting] = useState(false)
  const { send } = useAI()
  const { resetToSampleData } = useDesigns()
  const { showToast } = useToast()
  const haptic = useHapticProps()

  async function testConnection() {
    setTesting(true)
    const result = await send([{ role: 'user', content: 'Reply with only the word OK.' }], {
      model,
      system: 'Reply with only the word OK.',
    })
    setKeyStatus(result ? 'valid' : 'invalid')
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-medium text-text-muted">Claude API key</p>
        <p className="text-xs text-text-muted">
          Set as the <code className="rounded bg-ink/10 px-1 py-0.5">ANTHROPIC_API_KEY</code> environment variable in
          your Netlify site's settings — Site configuration → Environment variables. It's never entered here.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <motion.button
            {...haptic}
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-text-primary disabled:opacity-40"
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </motion.button>
          {keyStatus === 'valid' && <span className="text-xs font-medium text-production">Connected</span>}
          {keyStatus === 'invalid' && <span className="text-xs font-medium text-inquiry">Not working</span>}
        </div>
      </div>

      <div>
        <label htmlFor="model-select" className="mb-1 block text-xs font-medium text-text-muted">
          Model
        </label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {SUPPORTED_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-surface">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-ink/10 pt-4">
        <motion.button
          {...haptic}
          type="button"
          onClick={() => {
            showToast('Sample data will be restored', 'info')
            resetToSampleData()
          }}
          className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-medium text-text-primary"
        >
          <RefreshCcw size={14} /> Reset to sample data
        </motion.button>
      </div>
    </div>
  )
}

function KeyWarningBanner() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-collaboration/30 bg-collaboration/10 p-3 text-xs text-collaboration">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      The last connection test failed — check ANTHROPIC_API_KEY in Netlify and Test Connection again in Settings.
    </div>
  )
}

interface AssistantSectionProps {
  mode: Mode
  setMode: (m: Mode) => void
  keyBlocked: boolean
  model: string
  currentDesign: Design | null
}

function AssistantSection({ mode, setMode, keyBlocked, model, currentDesign }: AssistantSectionProps) {
  const haptic = useHapticProps()

  return (
    <div>
      {keyBlocked && <KeyWarningBanner />}

      <div className="mb-4 flex gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
        {MODES.map((m) => (
          <motion.button
            {...haptic}
            key={m.id}
            type="button"
            disabled={keyBlocked}
            onClick={() => setMode(m.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-30 ${
              mode === m.id ? 'bg-accent text-white' : 'text-text-muted'
            }`}
          >
            {m.label}
          </motion.button>
        ))}
      </div>

      {!keyBlocked && (
        <>
          {mode === 'generate' && <GenerateDesignMode model={model} />}
          {mode === 'balance' && <BalanceCheckerMode model={model} design={currentDesign} />}
          {mode === 'advisor' && <AdvisorMode model={model} />}
          {mode === 'summary' && <ExportSummaryMode model={model} design={currentDesign} />}
        </>
      )}
    </div>
  )
}

function NoDesignNotice() {
  return (
    <div className="rounded-xl border border-dashed border-ink/10 p-6 text-center text-sm text-text-muted">
      Open a design in the Designer to use this feature.
    </div>
  )
}

function GenerateDesignMode({ model }: { model: string }) {
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState<Design | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const { send, loading, error, setError } = useAI()
  const { saveDesign } = useDesigns()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const haptic = useHapticProps()

  async function generate() {
    if (!prompt.trim()) return
    setParseError(null)
    setGenerated(null)
    const text = await send([{ role: 'user', content: prompt }], { model, system: GENERATE_SYSTEM_PROMPT })
    if (!text) return
    try {
      const parsed = JSON.parse(stripCodeFences(text))
      const hydrated = hydrateGeneratedDesign(parsed)
      if (!hydrated) {
        setParseError("Couldn't parse the AI's response — try rephrasing your request")
        return
      }
      setGenerated(hydrated)
    } catch {
      setParseError("Couldn't parse the AI's response — try rephrasing your request")
    }
  }

  function loadIntoDesigner() {
    if (!generated) return
    saveDesign(generated)
    navigate(`/designer?id=${generated.id}`)
    showToast('Design loaded into Designer', 'success')
  }

  return (
    <div className="space-y-3">
      <label htmlFor="generate-prompt" className="sr-only">
        Learning objective
      </label>
      <textarea
        id="generate-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Teach students how to operate a broadcast camera in 2 hours with a class of 20."
        rows={4}
        className="w-full resize-none rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <motion.button
        {...haptic}
        type="button"
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Generate Design
      </motion.button>

      {loading && (
        <div className="space-y-2">
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-inquiry/30 bg-inquiry/10 p-3 text-xs text-inquiry">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {parseError && <div className="rounded-lg border border-inquiry/30 bg-inquiry/10 p-3 text-xs text-inquiry">{parseError}</div>}

      {generated && (
        <div className="rounded-lg border border-production/30 bg-production/10 p-3">
          <p className="text-sm font-medium text-strong">{generated.name}</p>
          <p className="mt-1 text-xs text-text-muted">
            {generated.tlas.length} TLAs · {generated.learningTimeMinutes} min target
          </p>
          <motion.button
            {...haptic}
            type="button"
            onClick={loadIntoDesigner}
            className="mt-3 w-full rounded-lg bg-production px-3 py-2 text-xs font-medium text-white"
          >
            Load into Designer
          </motion.button>
        </div>
      )}
    </div>
  )
}

function BalanceCheckerMode({ model, design }: { model: string; design: Design | null }) {
  const [result, setResult] = useState<string | null>(null)
  const { send, loading, error } = useAI()
  const haptic = useHapticProps()

  async function analyse() {
    if (!design) return
    // Send pre-computed numbers alongside the design so the model critiques against them
    // instead of re-deriving (and mis-deriving) the arithmetic.
    const payload = {
      design,
      analytics: computeAnalytics(design),
      alignment: computeAlignment(design),
      udlCoverage: computeUdlCoverage(design),
    }
    const text = await send([{ role: 'user', content: JSON.stringify(payload) }], { model, system: BALANCE_SYSTEM_PROMPT })
    if (text) setResult(text)
  }

  if (!design) return <NoDesignNotice />

  return (
    <div className="space-y-3">
      <motion.button
        {...haptic}
        type="button"
        onClick={analyse}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Analyse My Design
      </motion.button>

      {loading && <SkeletonCard />}

      {error && (
        <div className="rounded-lg border border-inquiry/30 bg-inquiry/10 p-3 text-xs text-inquiry">
          {error}
          <button type="button" onClick={analyse} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {result && (
        <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-ink/10 bg-ink/5 p-3 text-strong">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

function AdvisorMode({ model }: { model: string }) {
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const { send, loading, error } = useAI()
  const haptic = useHapticProps()

  async function submit() {
    if (!input.trim()) return
    const nextHistory: ChatMessage[] = [...history, { role: 'user', content: input }]
    setHistory(nextHistory)
    setInput('')
    const text = await send(nextHistory, { model, system: ADVISOR_SYSTEM_PROMPT })
    if (text) setHistory((h) => [...h, { role: 'assistant', content: text }])
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {history.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 text-sm ${
              m.role === 'user' ? 'ml-6 bg-accent/10 text-strong' : 'mr-6 bg-ink/5 text-strong'
            }`}
          >
            {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
          </div>
        ))}
        {loading && <SkeletonCard />}
        {error && (
          <div className="rounded-lg border border-inquiry/30 bg-inquiry/10 p-3 text-xs text-inquiry">
            {error}
            <button type="button" onClick={submit} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}
      </div>
      <div className="mt-auto flex gap-2">
        <label htmlFor="advisor-input" className="sr-only">
          Ask the film pedagogy advisor
        </label>
        <input
          id="advisor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Ask about your teaching..."
          className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <motion.button
          {...haptic}
          type="button"
          aria-label="Send message"
          onClick={submit}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-lg bg-accent px-3 text-white disabled:opacity-40"
        >
          <Send size={15} />
        </motion.button>
      </div>
    </div>
  )
}

function ExportSummaryMode({ model, design }: { model: string; design: Design | null }) {
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const { send, loading, error } = useAI()
  const haptic = useHapticProps()

  async function generate() {
    if (!design) return
    const text = await send([{ role: 'user', content: JSON.stringify(design) }], { model, system: SUMMARY_SYSTEM_PROMPT })
    if (text) setResult(text)
  }

  async function copy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard permission denied — silently ignore, the Download option still works.
    }
  }

  function download() {
    if (!result || !design) return
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${design.name.replace(/[^a-z0-9]+/gi, '_')}_summary.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    window.setTimeout(() => setDownloaded(false), 1500)
  }

  if (!design) return <NoDesignNotice />

  return (
    <div className="space-y-3">
      <motion.button
        {...haptic}
        type="button"
        onClick={generate}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate Summary
      </motion.button>

      {loading && <SkeletonCard />}

      {error && (
        <div className="rounded-lg border border-inquiry/30 bg-inquiry/10 p-3 text-xs text-inquiry">
          {error}
          <button type="button" onClick={generate} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="prose prose-invert prose-sm max-h-96 max-w-none overflow-y-auto rounded-lg border border-ink/10 bg-ink/5 p-3 text-strong">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <div className="flex gap-2">
            <motion.button
              {...haptic}
              type="button"
              onClick={copy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-medium text-text-primary"
            >
              {copied ? <Check size={14} className="text-production" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </motion.button>
            <motion.button
              {...haptic}
              type="button"
              onClick={download}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-medium text-text-primary"
            >
              {downloaded ? <Check size={14} className="text-production" /> : <Download size={14} />}
              {downloaded ? 'Downloaded!' : 'Download as .md'}
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}
