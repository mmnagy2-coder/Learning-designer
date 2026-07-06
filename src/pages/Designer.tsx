// VISUAL DESIGN BRIEF: The core workspace. A glass metadata header anchors the page with a
// live pie chart; below it, a toolbar of haptic actions, then two tabs — a horizontally
// scrolling row of tactile glass TLA columns (Timeline) or the analytics breakdown (Analysis).
// Below 768px the canvas becomes a vertical stacked list with up/down reordering instead of
// drag-and-drop.
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Check, ChevronDown, Download, FilePlus2, Share2, Upload } from 'lucide-react'
import type { Design, TLA } from '../types'
import { useDesigns } from '../hooks/useDesigns'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../components/shared/Toast'
import { useHapticProps } from '../components/shared/motion'
import { MetadataHeader } from '../components/designer/MetadataHeader'
import { TLAColumn } from '../components/designer/TLAColumn'
import { AnalysisTab } from '../components/designer/AnalysisTab'
import { downloadDesignAsJson, downloadDesignAsMarkdown, copyDesignToClipboard } from '../utils/exportDesign'
import { parseImportedDesign } from '../utils/importDesign'

function blankDesign(): Design {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Design',
    topic: '',
    learningTimeMinutes: 120,
    sizeOfClass: 20,
    description: '',
    modeOfDelivery: 'blended',
    aims: '',
    outcomes: [],
    tlas: [],
    createdAt: now,
    updatedAt: now,
    isPublic: false,
  }
}

function newTLA(): TLA {
  return {
    id: crypto.randomUUID(),
    title: 'New Activity',
    notes: '',
    resources: [],
    learningTypes: [
      {
        id: crypto.randomUUID(),
        type: 'acquisition',
        durationMinutes: 15,
        groupSize: 1,
        teacherPresent: false,
        isOnline: false,
        isSynchronous: true,
        assessmentType: 'none',
        description: '',
      },
    ],
  }
}

export function Designer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { designs, loaded, getDesign, saveDesign } = useDesigns()
  const idParam = searchParams.get('id')
  const [effectiveId, setEffectiveId] = useState<string | null>(null)

  // Resolve which design id this page instance should render: the URL param if valid,
  // otherwise the most recent design, otherwise a freshly created blank one.
  useEffect(() => {
    if (!loaded || effectiveId) return
    if (idParam && getDesign(idParam)) {
      setEffectiveId(idParam)
      return
    }
    if (designs.length > 0) {
      const newest = [...designs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      setEffectiveId(newest.id)
      setSearchParams({ id: newest.id }, { replace: true })
    } else {
      const blank = blankDesign()
      saveDesign(blank)
      setEffectiveId(blank.id)
      setSearchParams({ id: blank.id }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, idParam, designs.length])

  if (!effectiveId) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-text-muted">Loading…</div>
  }

  return (
    <DesignerContent
      key={effectiveId}
      designId={effectiveId}
      getDesign={getDesign}
      saveDesign={saveDesign}
      onNavigateToDesign={(id) => {
        setEffectiveId(id)
        setSearchParams({ id })
      }}
    />
  )
}

interface DesignerContentProps {
  designId: string
  getDesign: (id: string) => Design | undefined
  saveDesign: (design: Design) => void
  onNavigateToDesign: (id: string) => void
}

function DesignerContent({ designId, getDesign, saveDesign, onNavigateToDesign }: DesignerContentProps) {
  const [design, setDesign] = useState<Design>(() => getDesign(designId) ?? blankDesign())
  const [tab, setTab] = useState<'timeline' | 'analysis'>('timeline')
  const [justSaved, setJustSaved] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const isMobile = useIsMobile()
  const { showToast } = useToast()
  const haptic = useHapticProps()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const isFirstRender = useRef(true)

  // Debounced auto-save: 1000ms after the design stops changing, persist it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      saveDesign({ ...design, updatedAt: new Date().toISOString() })
    }, 1000)
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design])

  // Wheel-to-horizontal conversion with edge detection, attached natively so preventDefault
  // reliably works (React's synthetic wheel listener may be passive).
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (!el || e.deltaY === 0) return
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleManualSave() {
    saveDesign({ ...design, updatedAt: new Date().toISOString() })
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  function handleNewDesign() {
    const blank = blankDesign()
    saveDesign(blank)
    onNavigateToDesign(blank.id)
    showToast('New design created', 'success')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const { design: imported, error } = parseImportedDesign(text)
    if (error || !imported) {
      showToast(error ?? 'Invalid design file — missing required fields', 'error')
      return
    }
    saveDesign(imported)
    onNavigateToDesign(imported.id)
    showToast('Design imported', 'success')
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?id=${design.id}`
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('Link copied', 'success'))
      .catch(() => showToast('Could not copy link', 'error'))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDesign((prev) => {
      const oldIndex = prev.tlas.findIndex((t) => t.id === active.id)
      const newIndex = prev.tlas.findIndex((t) => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return { ...prev, tlas: arrayMove(prev.tlas, oldIndex, newIndex) }
    })
  }

  function addTLA() {
    setDesign((prev) => ({ ...prev, tlas: [...prev.tlas, newTLA()] }))
  }

  function updateTLA(id: string, updated: TLA) {
    setDesign((prev) => ({ ...prev, tlas: prev.tlas.map((t) => (t.id === id ? updated : t)) }))
  }

  function deleteTLA(id: string) {
    setDesign((prev) => ({ ...prev, tlas: prev.tlas.filter((t) => t.id !== id) }))
  }

  function moveTLA(index: number, direction: -1 | 1) {
    setDesign((prev) => {
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= prev.tlas.length) return prev
      return { ...prev, tlas: arrayMove(prev.tlas, index, newIndex) }
    })
  }

  function handleCanvasKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!canvasRef.current) return
    if (e.key === 'ArrowRight') {
      canvasRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    } else if (e.key === 'ArrowLeft') {
      canvasRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <MetadataHeader design={design} onChange={setDesign} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(['timeline', 'analysis'] as const).map((t) => (
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
          <motion.button {...haptic} type="button" onClick={handleNewDesign} className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white">
            <FilePlus2 size={15} /> New Design
          </motion.button>

          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} aria-label="Import design file" />
          <motion.button {...haptic} type="button" onClick={handleImportClick} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary">
            <Upload size={15} /> Import
          </motion.button>

          <div className="relative">
            <motion.button
              {...haptic}
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary"
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
                  className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-white/10 bg-elevated p-1 shadow-xl"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      downloadDesignAsJson(design)
                      setExportOpen(false)
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                  >
                    Download as JSON
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      downloadDesignAsMarkdown(design)
                      setExportOpen(false)
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                  >
                    Download as Markdown
                  </button>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setExportOpen(false)
                      try {
                        await copyDesignToClipboard(design)
                        showToast('Copied to clipboard', 'success')
                      } catch {
                        showToast('Could not copy to clipboard', 'error')
                      }
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                  >
                    Copy to Clipboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button {...haptic} type="button" onClick={handleShare} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary">
            <Share2 size={15} /> Share
          </motion.button>

          <motion.button
            {...haptic}
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary"
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

      <div className="mt-6">
        {tab === 'analysis' ? (
          <AnalysisTab design={design} />
        ) : (
          <>
            <motion.button
              {...haptic}
              type="button"
              onClick={addTLA}
              className="mb-4 flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              + Add TLA
            </motion.button>

            {design.tlas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-text-muted">
                Add a TLA to start building your session.
              </div>
            ) : isMobile ? (
              <div className="flex flex-col gap-4">
                {design.tlas.map((tla, i) => (
                  <TLAColumn
                    key={tla.id}
                    tla={tla}
                    onChange={(updated) => updateTLA(tla.id, updated)}
                    onDelete={() => deleteTLA(tla.id)}
                    dragDisabled
                    onMoveUp={() => moveTLA(i, -1)}
                    onMoveDown={() => moveTLA(i, 1)}
                    canMoveUp={i > 0}
                    canMoveDown={i < design.tlas.length - 1}
                  />
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={design.tlas.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
                  <div
                    ref={canvasRef}
                    tabIndex={0}
                    onKeyDown={handleCanvasKeyDown}
                    aria-label="Teaching and learning activity canvas, use arrow keys to scroll"
                    className="flex gap-4 overflow-x-auto pb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <AnimatePresence initial={false}>
                      {design.tlas.map((tla) => (
                        <TLAColumn key={tla.id} tla={tla} onChange={(updated) => updateTLA(tla.id, updated)} onDelete={() => deleteTLA(tla.id)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
      </div>
    </div>
  )
}
