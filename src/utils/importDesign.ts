import type { AssessmentType, Design, LearningType, LearningTypeRow, ModeOfDelivery, Resource, TLA } from '../types'

const LEARNING_TYPES: LearningType[] = ['acquisition', 'collaboration', 'discussion', 'inquiry', 'practice', 'production']
const MODES: ModeOfDelivery[] = ['face-to-face', 'blended', 'wholly-online', 'async-online']
const ASSESSMENT_TYPES: AssessmentType[] = ['none', 'formative', 'summative']

function isResource(value: unknown): value is Resource {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return typeof r.id === 'string' && typeof r.title === 'string' && typeof r.url === 'string'
}

function isLearningTypeRow(value: unknown): value is LearningTypeRow {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.type === 'string' &&
    LEARNING_TYPES.includes(r.type as LearningType) &&
    typeof r.durationMinutes === 'number' &&
    typeof r.groupSize === 'number' &&
    typeof r.teacherPresent === 'boolean' &&
    typeof r.isOnline === 'boolean' &&
    typeof r.isSynchronous === 'boolean' &&
    typeof r.assessmentType === 'string' &&
    ASSESSMENT_TYPES.includes(r.assessmentType as AssessmentType) &&
    typeof r.description === 'string'
  )
}

function isTLA(value: unknown): value is TLA {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.notes === 'string' &&
    Array.isArray(t.learningTypes) &&
    t.learningTypes.every(isLearningTypeRow) &&
    Array.isArray(t.resources) &&
    t.resources.every(isResource)
  )
}

/** Validates a parsed JSON value against the Design shape. Returns the Design if valid, else null. */
export function validateDesign(value: unknown): Design | null {
  if (typeof value !== 'object' || value === null) return null
  const d = value as Record<string, unknown>

  const requiredStrings = ['id', 'name', 'topic', 'description', 'aims', 'createdAt', 'updatedAt']
  for (const key of requiredStrings) {
    if (typeof d[key] !== 'string') return null
  }

  if (typeof d.learningTimeMinutes !== 'number') return null
  if (typeof d.sizeOfClass !== 'number') return null
  if (typeof d.modeOfDelivery !== 'string' || !MODES.includes(d.modeOfDelivery as ModeOfDelivery)) return null
  if (!Array.isArray(d.outcomes) || !d.outcomes.every((o) => typeof o === 'string')) return null
  if (!Array.isArray(d.tlas) || !d.tlas.every(isTLA)) return null
  if (typeof d.isPublic !== 'boolean') return null

  return d as unknown as Design
}

export interface ImportResult {
  design: Design | null
  error: string | null
}

export function parseImportedDesign(jsonText: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { design: null, error: 'Invalid design file — the file is not valid JSON' }
  }
  const design = validateDesign(parsed)
  if (!design) {
    return { design: null, error: 'Invalid design file — missing required fields' }
  }
  return { design, error: null }
}

function isGeneratedLearningTypeRow(value: unknown): value is Omit<LearningTypeRow, 'id'> {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.type === 'string' &&
    LEARNING_TYPES.includes(r.type as LearningType) &&
    typeof r.durationMinutes === 'number' &&
    typeof r.groupSize === 'number' &&
    typeof r.teacherPresent === 'boolean' &&
    typeof r.isOnline === 'boolean' &&
    typeof r.isSynchronous === 'boolean' &&
    typeof r.assessmentType === 'string' &&
    ASSESSMENT_TYPES.includes(r.assessmentType as AssessmentType) &&
    typeof r.description === 'string'
  )
}

function isGeneratedTLA(value: unknown): value is { title: string; notes?: string; learningTypes: unknown[]; resources?: unknown[] } {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return typeof t.title === 'string' && Array.isArray(t.learningTypes) && t.learningTypes.every(isGeneratedLearningTypeRow)
}

/**
 * Validates and hydrates the JSON shape Claude returns for "Generate Design" — which omits
 * ids, createdAt/updatedAt, and isPublic since the model can't invent stable identifiers —
 * into a fully-formed Design ready to save and load into the Designer.
 */
export function hydrateGeneratedDesign(value: unknown): Design | null {
  if (typeof value !== 'object' || value === null) return null
  const d = value as Record<string, unknown>

  const requiredStrings = ['name', 'topic', 'description', 'aims']
  for (const key of requiredStrings) {
    if (typeof d[key] !== 'string') return null
  }
  if (typeof d.learningTimeMinutes !== 'number') return null
  if (typeof d.sizeOfClass !== 'number') return null
  if (typeof d.modeOfDelivery !== 'string' || !MODES.includes(d.modeOfDelivery as ModeOfDelivery)) return null
  if (!Array.isArray(d.outcomes) || !d.outcomes.every((o) => typeof o === 'string')) return null
  if (!Array.isArray(d.tlas) || !d.tlas.every(isGeneratedTLA)) return null

  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    name: d.name as string,
    topic: d.topic as string,
    learningTimeMinutes: d.learningTimeMinutes as number,
    sizeOfClass: d.sizeOfClass as number,
    description: d.description as string,
    modeOfDelivery: d.modeOfDelivery as ModeOfDelivery,
    aims: d.aims as string,
    outcomes: d.outcomes as string[],
    createdAt: now,
    updatedAt: now,
    isPublic: false,
    tlas: (d.tlas as { title: string; notes?: string; learningTypes: unknown[]; resources?: unknown[] }[]).map((t) => ({
      id: crypto.randomUUID(),
      title: t.title,
      notes: t.notes ?? '',
      resources: (t.resources ?? []).map((r) => {
        const res = r as { title?: string; url?: string }
        return { id: crypto.randomUUID(), title: res.title ?? '', url: res.url ?? '' }
      }),
      learningTypes: (t.learningTypes as Omit<LearningTypeRow, 'id'>[]).map((row) => ({ id: crypto.randomUUID(), ...row })),
    })),
  }
}
