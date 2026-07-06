// Collapsible resources section on each TLA column: manual add (title + URL), plus an AI
// "Suggest resources" flow — Claude proposes readings/videos/tools for the activity and the
// user ticks which ones to keep before anything is added.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { Resource } from '../../types'
import { Collapsible } from '../shared/Collapsible'
import { useHapticProps } from '../shared/motion'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useAI, stripCodeFences } from '../ai/useAI'

const RESOURCES_SYSTEM_PROMPT = `You are a resource curator for higher education film and media production teaching. Given a learning activity, suggest 3-5 learning resources (readings, videos, official documentation, tools) that directly support it for undergraduate film production students. Prefer stable, well-known URLs: official documentation (e.g. Adobe, Blackmagic, ARRI), publisher pages, established film organisations (BFI, ASC, ScreenSkills), or specific YouTube channels. If you are not certain an exact URL exists, use a search URL instead, e.g. https://www.youtube.com/results?search_query=focus+pulling+tutorial — never invent a specific article or video URL you are unsure of. Return ONLY a valid JSON array of objects with exactly these keys: {"title": "string", "url": "string"} — no markdown fences, no other text.`

interface SuggestedResource {
  title: string
  url: string
  checked: boolean
}

interface ResourcesListProps {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
  /** Free-text description of the activity, used to ground AI resource suggestions. */
  suggestContext?: string
}

export function ResourcesList({ resources, onChange, suggestContext }: ResourcesListProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestedResource[]>([])
  const [model] = useLocalStorage('ld_claude_model', 'claude-3-5-sonnet-20241022')
  const { send, loading, error } = useAI()
  const haptic = useHapticProps()

  function addResource() {
    if (!title.trim() || !url.trim()) return
    onChange([...resources, { id: crypto.randomUUID(), title: title.trim(), url: url.trim() }])
    setTitle('')
    setUrl('')
    setAdding(false)
  }

  function removeResource(id: string) {
    onChange(resources.filter((r) => r.id !== id))
  }

  async function suggest() {
    const text = await send(
      [{ role: 'user', content: `Activity:\n${suggestContext || 'General film production teaching activity'}` }],
      { model, system: RESOURCES_SYSTEM_PROMPT }
    )
    if (!text) return
    try {
      const parsed = JSON.parse(stripCodeFences(text))
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (r): r is { title: string; url: string } =>
            typeof r === 'object' && r !== null && typeof r.title === 'string' && typeof r.url === 'string'
        )
        setSuggestions(valid.map((r) => ({ ...r, checked: true })))
      }
    } catch {
      // Malformed response — the button stays available to retry.
    }
  }

  function toggleSuggestion(index: number) {
    setSuggestions((prev) => prev.map((s, i) => (i === index ? { ...s, checked: !s.checked } : s)))
  }

  function addSelected() {
    const selected = suggestions.filter((s) => s.checked)
    if (selected.length === 0) return
    onChange([...resources, ...selected.map((s) => ({ id: crypto.randomUUID(), title: s.title, url: s.url }))])
    setSuggestions([])
  }

  return (
    <Collapsible title={`Resources (${resources.length})`}>
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/5 px-3 py-2 text-sm">
            <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-accent hover:underline">
              {r.title}
            </a>
            <motion.button
              {...haptic}
              type="button"
              aria-label={`Remove resource ${r.title}`}
              onClick={() => removeResource(r.id)}
              className="text-text-muted hover:text-inquiry"
            >
              <X size={14} />
            </motion.button>
          </div>
        ))}

        {adding ? (
          <div className="space-y-2 rounded-lg border border-ink/10 p-3">
            <input
              aria-label="Resource title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              aria-label="Resource URL"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-ink/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex justify-end gap-2">
              <motion.button
                {...haptic}
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg px-3 py-1 text-xs text-text-muted"
              >
                Cancel
              </motion.button>
              <motion.button
                {...haptic}
                type="button"
                onClick={addResource}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white"
              >
                Add
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              {...haptic}
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs font-medium text-accent"
            >
              <Plus size={14} /> Add Resource
            </motion.button>
            <motion.button
              {...haptic}
              type="button"
              onClick={suggest}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-medium text-accent disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Suggest resources
            </motion.button>
          </div>
        )}

        {error && <p className="text-xs text-inquiry">{error}</p>}

        {suggestions.length > 0 && (
          <div className="space-y-2 rounded-lg border border-dashed border-ink/10 p-3">
            <p className="text-xs font-medium text-text-muted">Suggested — untick any you don't want:</p>
            {suggestions.map((s, i) => (
              <label key={`${s.url}-${i}`} className="flex items-start gap-2 text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={s.checked}
                  onChange={() => toggleSuggestion(i)}
                  className="mt-0.5 accent-blue-500"
                />
                <span>
                  {s.title}
                  <a href={s.url} target="_blank" rel="noreferrer" className="ml-1 break-all text-accent hover:underline">
                    {s.url}
                  </a>
                </span>
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <motion.button
                {...haptic}
                type="button"
                onClick={() => setSuggestions([])}
                className="rounded-lg px-3 py-1 text-xs text-text-muted"
              >
                Dismiss
              </motion.button>
              <motion.button
                {...haptic}
                type="button"
                onClick={addSelected}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white"
              >
                Add selected
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  )
}
