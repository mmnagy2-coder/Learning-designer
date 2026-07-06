import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import type { Resource } from '../../types'
import { Collapsible } from '../shared/Collapsible'
import { useHapticProps } from '../shared/motion'

interface ResourcesListProps {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
}

export function ResourcesList({ resources, onChange }: ResourcesListProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
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

  return (
    <Collapsible title={`Resources (${resources.length})`}>
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
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
          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <input
              aria-label="Resource title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              aria-label="Resource URL"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-white/5 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
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
          <motion.button
            {...haptic}
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-medium text-accent"
          >
            <Plus size={14} /> Add Resource
          </motion.button>
        )}
      </div>
    </Collapsible>
  )
}
