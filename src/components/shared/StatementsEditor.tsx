// Generalised written-outcomes editor for module and programme outcomes: numbered chips with
// Bloom badges, a verb-scaffolded composer, an AI suggest flow, and optional FHEQ soft hints.
// (The session Designer keeps its own OutcomesEditor, which also maintains activity alignment.)
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { BloomLevel, FheqLevel, OutcomeStatement } from '../../types'
import { bloomFitsLevel, FHEQ_LEVELS } from '../../utils/fheq'
import { useHapticProps } from './motion'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { DEFAULT_MODEL, sanitizeModel } from '../../utils/aiModels'
import { useAI, stripCodeFences } from '../ai/useAI'

const BLOOM_LEVELS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']

const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  Remember: ['Identify', 'List', 'Recall', 'Name'],
  Understand: ['Explain', 'Describe', 'Summarise', 'Compare'],
  Apply: ['Apply', 'Operate', 'Demonstrate', 'Use'],
  Analyse: ['Analyse', 'Deconstruct', 'Examine', 'Differentiate'],
  Evaluate: ['Evaluate', 'Critique', 'Justify', 'Assess'],
  Create: ['Create', 'Produce', 'Design', 'Compose'],
}

interface StatementsEditorProps {
  label: string
  /** Prefix for the numbered chips, e.g. 'LO' or 'PO'. */
  chipPrefix?: string
  statements: OutcomeStatement[]
  onChange: (statements: OutcomeStatement[]) => void
  /** System prompt for the AI suggest flow; suggest button hidden when absent. */
  aiSystemPrompt?: string
  /** User-message context sent to the AI suggest flow. */
  aiContext?: string
  /** When set, statements whose Bloom level looks low for this FHEQ level get a soft hint. */
  fheqLevel?: FheqLevel
}

export function StatementsEditor({
  label,
  chipPrefix = 'LO',
  statements,
  onChange,
  aiSystemPrompt,
  aiContext,
  fheqLevel,
}: StatementsEditorProps) {
  const haptic = useHapticProps()
  const [composing, setComposing] = useState(false)
  const [draftLevel, setDraftLevel] = useState<BloomLevel | ''>('')
  const [draftText, setDraftText] = useState('')
  const [suggestions, setSuggestions] = useState<{ text: string; bloomLevel?: BloomLevel }[]>([])
  const [storedModel] = useLocalStorage('ld_claude_model', DEFAULT_MODEL)
  const model = sanitizeModel(storedModel)
  const { send, loading, error } = useAI()

  const misfit = fheqLevel
    ? statements.filter((s) => s.bloomLevel && !bloomFitsLevel(s.bloomLevel, fheqLevel))
    : []

  function addStatement(text: string, bloomLevel?: BloomLevel) {
    const trimmed = text.trim()
    if (!trimmed) return
    onChange([...statements, { id: crypto.randomUUID(), text: trimmed, bloomLevel }])
  }

  function confirmDraft() {
    addStatement(draftText, draftLevel || undefined)
    setDraftText('')
    setDraftLevel('')
    setComposing(false)
  }

  async function suggest() {
    if (!aiSystemPrompt) return
    const text = await send([{ role: 'user', content: aiContext ?? '' }], { model, system: aiSystemPrompt })
    if (!text) return
    try {
      const parsed = JSON.parse(stripCodeFences(text))
      if (Array.isArray(parsed)) {
        const existing = new Set(statements.map((s) => s.text))
        setSuggestions(
          parsed
            .filter((s): s is { text: string; bloomLevel?: BloomLevel } => typeof s?.text === 'string')
            .map((s) => ({
              text: s.text,
              bloomLevel: BLOOM_LEVELS.includes(s.bloomLevel as BloomLevel) ? s.bloomLevel : undefined,
            }))
            .filter((s) => !existing.has(s.text))
        )
      }
    } catch {
      // Malformed response — the button stays available to retry.
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-muted">{label}</p>

      {statements.length > 0 && (
        <ol className="space-y-1.5">
          {statements.map((s, i) => (
            <li key={s.id} className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <span className="mt-0.5 shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {chipPrefix}
                {i + 1}
              </span>
              <input
                aria-label={`${label} ${i + 1}`}
                value={s.text}
                onChange={(e) =>
                  onChange(statements.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))
                }
                className="w-full bg-transparent text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent rounded"
              />
              {s.bloomLevel && <span className="mt-0.5 shrink-0 text-[10px] text-text-muted">{s.bloomLevel}</span>}
              <motion.button
                {...haptic}
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => onChange(statements.filter((x) => x.id !== s.id))}
                className="mt-0.5 shrink-0 text-text-muted hover:text-inquiry"
              >
                <X size={13} />
              </motion.button>
            </li>
          ))}
        </ol>
      )}

      {misfit.length > 0 && fheqLevel && (
        <div className="flex items-start gap-2 rounded-lg border border-collaboration/40 bg-collaboration/10 px-3 py-2 text-xs text-collaboration">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            {misfit.length === statements.length ? 'All outcomes sit' : `${misfit.length} of ${statements.length} outcomes sit`} at
            Bloom levels that look low for FHEQ level {fheqLevel} ({FHEQ_LEVELS[fheqLevel].award}) —
            level {fheqLevel} outcomes typically use {FHEQ_LEVELS[fheqLevel].typicalVerbs.join(', ')} verbs.
            A hint, not a rule.
          </span>
        </div>
      )}

      {composing ? (
        <div className="space-y-2 rounded-lg border border-ink/10 p-3">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`statements-bloom-${label}`}>
              Bloom's level
            </label>
            <select
              id={`statements-bloom-${label}`}
              value={draftLevel}
              onChange={(e) => {
                const level = e.target.value as BloomLevel | ''
                setDraftLevel(level)
                if (level && !draftText.trim()) setDraftText(`${BLOOM_VERBS[level][0]} `)
              }}
              className="shrink-0 rounded-lg bg-ink/5 px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="" className="bg-surface">
                Level…
              </option>
              {BLOOM_LEVELS.map((l) => (
                <option key={l} value={l} className="bg-surface">
                  {l}
                </option>
              ))}
            </select>
            <input
              autoFocus
              aria-label={`${label} statement`}
              placeholder="verb + object + context"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmDraft()
                if (e.key === 'Escape') setComposing(false)
              }}
              className="w-full rounded-lg bg-ink/5 px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {draftLevel && (
            <div className="flex flex-wrap gap-1">
              {BLOOM_VERBS[draftLevel].map((verb) => (
                <motion.button
                  {...haptic}
                  key={verb}
                  type="button"
                  onClick={() => setDraftText(`${verb} `)}
                  className="rounded-full border border-ink/10 px-2 py-0.5 text-[10px] text-text-muted hover:border-accent hover:text-accent"
                >
                  {verb}
                </motion.button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <motion.button {...haptic} type="button" onClick={() => setComposing(false)} className="rounded-lg px-3 py-1 text-xs text-text-muted">
              Cancel
            </motion.button>
            <motion.button {...haptic} type="button" onClick={confirmDraft} className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white">
              Add
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <motion.button
            {...haptic}
            type="button"
            onClick={() => setComposing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent"
          >
            <Plus size={13} /> Add outcome
          </motion.button>
          {aiSystemPrompt && (
            <motion.button
              {...haptic}
              type="button"
              onClick={suggest}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-40"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest outcomes
            </motion.button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-inquiry">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="space-y-1">
          {suggestions.map((s) => (
            <li key={s.text}>
              <motion.button
                {...haptic}
                type="button"
                onClick={() => {
                  addStatement(s.text, s.bloomLevel)
                  setSuggestions((prev) => prev.filter((x) => x.text !== s.text))
                }}
                className="flex w-full items-start gap-2 rounded-lg border border-dashed border-ink/10 px-3 py-1.5 text-left text-xs text-text-muted hover:border-accent hover:text-text-primary"
              >
                <Plus size={13} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  {s.text}
                  {s.bloomLevel && <span className="ml-1 text-[10px] opacity-70">({s.bloomLevel})</span>}
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
