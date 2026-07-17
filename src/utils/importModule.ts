// Validation and hydration for Module JSON — both AI-generated skeletons (no ids; outcome
// references by index) and user-exported module files (full records). Mirrors importDesign.ts.
import type {
  AssessmentComponent,
  BloomLevel,
  CreditValue,
  FheqLevel,
  Module,
  ModuleWeek,
  OutcomeStatement,
  Resource,
} from '../types'

const BLOOM_LEVELS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const FHEQ_LEVELS: FheqLevel[] = [4, 5, 6, 7]
const CREDIT_VALUES: CreditValue[] = [15, 30]

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function toCredits(v: unknown): CreditValue | undefined {
  if (typeof v !== 'number') return undefined
  // The model occasionally invents 20 or 40; snap to the nearest offered size.
  return v <= 22 ? 15 : 30
}

function toLevel(v: unknown): FheqLevel | undefined {
  return typeof v === 'number' && FHEQ_LEVELS.includes(v as FheqLevel) ? (v as FheqLevel) : undefined
}

interface GeneratedAssessment {
  title?: unknown
  type?: unknown
  method?: unknown
  weighting?: unknown
  weekDue?: unknown
  outcomeIndexes?: unknown
}

interface GeneratedWeek {
  number?: unknown
  topic?: unknown
  notes?: unknown
}

/**
 * Validates and hydrates the JSON shape Claude returns for "Generate module" — no ids,
 * assessments reference outcomes by zero-based index — into a full Module record.
 */
export function hydrateGeneratedModule(value: unknown): Module | null {
  if (typeof value !== 'object' || value === null) return null
  const m = value as Record<string, unknown>
  if (typeof m.name !== 'string' || m.name.trim() === '') return null

  const now = new Date().toISOString()

  const rawStatements = Array.isArray(m.outcomeStatements) ? m.outcomeStatements : []
  const outcomeStatements: OutcomeStatement[] = rawStatements
    .filter((o): o is { text: string; bloomLevel?: string } => typeof (o as { text?: unknown })?.text === 'string')
    .map((o) => ({
      id: crypto.randomUUID(),
      text: o.text,
      bloomLevel: BLOOM_LEVELS.includes(o.bloomLevel as BloomLevel) ? (o.bloomLevel as BloomLevel) : undefined,
    }))

  const rawAssessments = Array.isArray(m.assessments) ? m.assessments : []
  const assessments: AssessmentComponent[] = rawAssessments
    .filter((a): a is GeneratedAssessment => typeof a === 'object' && a !== null)
    .filter((a) => typeof a.title === 'string')
    .map((a) => ({
      id: crypto.randomUUID(),
      title: a.title as string,
      type: a.type === 'formative' ? 'formative' : 'summative',
      method: asString(a.method) ?? '',
      weighting: typeof a.weighting === 'number' && a.weighting >= 0 ? a.weighting : 0,
      weekDue: typeof a.weekDue === 'number' ? a.weekDue : undefined,
      outcomeIds: (Array.isArray(a.outcomeIndexes) ? a.outcomeIndexes : [])
        .filter((i): i is number => typeof i === 'number' && i >= 0 && i < outcomeStatements.length)
        .map((i) => outcomeStatements[i].id),
    }))

  const rawWeeks = Array.isArray(m.weeks) ? m.weeks : []
  const weeks: ModuleWeek[] = rawWeeks
    .filter((w): w is GeneratedWeek => typeof w === 'object' && w !== null)
    .map((w, i) => ({
      id: crypto.randomUUID(),
      number: typeof w.number === 'number' ? w.number : i + 1,
      topic: asString(w.topic) ?? '',
      notes: asString(w.notes),
      designIds: [],
    }))

  const rawReading = Array.isArray(m.readingList) ? m.readingList : []
  const readingList: Resource[] = rawReading
    .filter((r): r is { title?: string; url?: string } => typeof r === 'object' && r !== null)
    .filter((r) => typeof r.title === 'string')
    .map((r) => ({ id: crypto.randomUUID(), title: r.title ?? '', url: asString(r.url) ?? '' }))

  return {
    id: crypto.randomUUID(),
    name: m.name,
    createdAt: now,
    updatedAt: now,
    code: asString(m.code),
    credits: toCredits(m.credits),
    level: toLevel(m.level),
    aims: asString(m.aims),
    indicativeContent: asString(m.indicativeContent),
    outcomeStatements: outcomeStatements.length > 0 ? outcomeStatements : undefined,
    assessments: assessments.length > 0 ? assessments : undefined,
    weeks: weeks.length > 0 ? weeks : undefined,
    readingList: readingList.length > 0 ? readingList : undefined,
  }
}

/** Validates a user-exported module JSON file (full record with ids). */
export function parseImportedModule(jsonText: string): { module: Module | null; error: string | null } {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { module: null, error: 'Invalid module file — the file is not valid JSON' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { module: null, error: 'Invalid module file — missing required fields' }
  }
  const m = parsed as Record<string, unknown>
  const requiredStrings = ['id', 'name', 'createdAt', 'updatedAt']
  for (const key of requiredStrings) {
    if (typeof m[key] !== 'string') return { module: null, error: 'Invalid module file — missing required fields' }
  }
  // Descriptor fields are optional; sanitise the enumerated ones rather than rejecting.
  const module = parsed as Module
  return {
    module: {
      ...module,
      credits: module.credits !== undefined ? toCredits(module.credits) : undefined,
      level: module.level !== undefined ? toLevel(module.level) : undefined,
      // Week design links may reference sessions that don't exist in this browser; the
      // planner simply won't render those, so they're safe to keep for same-browser round-trips.
      weeks: module.weeks?.map((w) => ({ ...w, designIds: Array.isArray(w.designIds) ? w.designIds : [] })),
    },
    error: null,
  }
}
