// VISUAL DESIGN BRIEF: The written learning outcomes panel in the metadata header. Numbered
// LO chips (LO1, LO2…) each hold a full statement with an optional Bloom's badge; a collapsed
// composer scaffolds new statements as verb + object + context, and the AI suggest flow
// drafts subject-specific statements the user adds one by one. These statements are the
// anchors activities align to on the Timeline.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { BloomLevel, Design, OutcomeStatement } from '../../types'
import { useHapticProps } from '../shared/motion'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { DEFAULT_MODEL, sanitizeModel } from '../../utils/aiModels'
import { useAI, stripCodeFences } from '../ai/useAI'

export const BLOOM_LEVELS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']

/** Verb scaffolds per Bloom level, offered as starting points when composing a statement. */
const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  Remember: ['Identify', 'List', 'Recall', 'Name'],
  Understand: ['Explain', 'Describe', 'Summarise', 'Compare'],
  Apply: ['Apply', 'Operate', 'Demonstrate', 'Use'],
  Analyse: ['Analyse', 'Deconstruct', 'Examine', 'Differentiate'],
  Evaluate: ['Evaluate', 'Critique', 'Justify', 'Assess'],
  Create: ['Create', 'Produce', 'Design', 'Compose'],
}

const OUTCOMES_SYSTEM_PROMPT = `You are an expert learning designer for higher education film and media production. Given a session's name, topic, and aims, write 4-6 specific, assessable learning outcome statements for undergraduate film production students. Each starts with an action verb from Bloom's taxonomy and names concrete subject content, e.g. "Apply focus-pulling technique to a two-person dialogue scene". Return ONLY a valid JSON array with no markdown fences and no other text, where each item is {"text": "string", "bloomLevel": "Remember"|"Understand"|"Apply"|"Analyse"|"Evaluate"|"Create"}.`

interface OutcomesEditorProps {
  design: Design
  onChange: (design: Design) => void
}

export function OutcomesEditor({ design, onChange }: OutcomesEditorProps) {
  const haptic = useHapticProps()
  const [composing, setComposing] = useState(false)
  const [draftLevel, setDraftLevel] = useState<BloomLevel | ''>('')
  const [draftText, setDraftText] = useState('')
  const [suggestions, setSuggestions] = useState<{ text: string; bloomLevel?: BloomLevel }[]>([])
  const [storedModel] = useLocalStorage('ld_claude_model', DEFAULT_MODEL)
  const model = sanitizeModel(storedModel)
  const { send, loading, error } = useAI()

  const statements = design.outcomeStatements ?? []

  // Earlier versions stored AI-drafted statements as free strings inside design.outcomes,
  // mixed with the Bloom's level tags. Migrate any such legacy strings into first-class
  // outcome statements once, on open.
  useEffect(() => {
    const legacy = design.outcomes.filter((o) => !BLOOM_LEVELS.includes(o as BloomLevel))
    if (legacy.length === 0) return
    onChange({
      ...design,
      outcomes: design.outcomes.filter((o) => BLOOM_LEVELS.includes(o as BloomLevel)),
      outcomeStatements: [
        ...statements,
        ...legacy.map((text) => ({ id: crypto.randomUUID(), text })),
      ],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addStatement(text: string, bloomLevel?: BloomLevel) {
    const trimmed = text.trim()
    if (!trimmed) return
    onChange({
      ...design,
      outcomeStatements: [...statements, { id: crypto.randomUUID(), text: trimmed, bloomLevel }],
    })
  }

  function updateStatement(id: string, text: string) {
    onChange({
      ...design,
      outcomeStatements: statements.map((s) => (s.id === id ? { ...s, text } : s)),
    })
  }

  function removeStatement(id: string) {
    onChange({
      ...design,
      outcomeStatements: statements.filter((s) => s.id !== id),
      // Alignment references to a deleted outcome are cleaned up with it.
      tlas: design.tlas.map((t) => ({
        ...t,
        outcomeIds: (t.outcomeIds ?? []).filter((oid) => oid !== id),
      })),
    })
  }

  function confirmDraft() {
    addStatement(draftText, draftLevel || undefined)
    setDraftText('')
    setDraftLevel('')
    setComposing(false)
  }

  async function suggest() {
    const text = await send(
      [
        {
          role: 'user',
          content: `Session name: ${design.name}\nTopic: ${design.topic || 'not specified'}\nAims: ${design.aims || 'not specified'}\nMode: ${design.modeOfDelivery}`,
        },
      ],
      { model, system: OUTCOMES_SYSTEM_PROMPT }
    )
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
      <p className="text-xs font-medium text-text-muted">Learning outcomes</p>

      {statements.length > 0 && (
        <ol className="space-y-1.5">
          {statements.map((s, i) => (
            <li key={s.id} className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <span className="mt-0.5 shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                LO{i + 1}
              </span>
              <input
                aria-label={`Learning outcome ${i + 1}`}
                value={s.text}
                onChange={(e) => updateStatement(s.id, e.target.value)}
                className="w-full bg-transparent text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent rounded"
              />
              {s.bloomLevel && (
                <span className="mt-0.5 shrink-0 text-[10px] text-text-muted">{s.bloomLevel}</span>
              )}
              <motion.button
                {...haptic}
                type="button"
                aria-label={`Remove outcome ${i + 1}`}
                onClick={() => removeStatement(s.id)}
                className="mt-0.5 shrink-0 text-text-muted hover:text-inquiry"
              >
                <X size={13} />
              </motion.button>
            </li>
          ))}
        </ol>
      )}

      {composing ? (
        <div className="space-y-2 rounded-lg border border-ink/10 p-3">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="outcome-bloom">
              Bloom's level
            </label>
            <select
              id="outcome-bloom"
              value={draftLevel}
              onChange={(e) => {
                const level = e.target.value as BloomLevel | ''
                setDraftLevel(level)
                // Seed the statement with a verb scaffold if the text is still empty.
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
              aria-label="Outcome statement"
              placeholder="verb + object + context, e.g. Apply focus-pulling technique to a dialogue scene"
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
          <motion.button
            {...haptic}
            type="button"
            onClick={suggest}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-40"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest outcomes
          </motion.button>
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
