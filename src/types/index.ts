export type LearningType =
  | 'acquisition'
  | 'collaboration'
  | 'discussion'
  | 'inquiry'
  | 'practice'
  | 'production'

export type ModeOfDelivery = 'face-to-face' | 'blended' | 'wholly-online' | 'async-online'

export type AssessmentType = 'none' | 'formative' | 'summative'

export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyse' | 'Evaluate' | 'Create'

/**
 * The 4Ds AI-literacy lens, taggable per activity. From the AI Fluency framework by
 * Rick Dakan and Joseph Feller (Anthropic), licensed CC BY-NC-SA 4.0.
 */
export type FourD = 'delegation' | 'description' | 'discernment' | 'diligence'

/** A written learning outcome statement (verb + object + context), the alignment anchor. */
export interface OutcomeStatement {
  id: string
  text: string
  bloomLevel?: BloomLevel
}

export interface Resource {
  id: string
  title: string
  url: string
}

export interface LearningTypeRow {
  id: string
  type: LearningType
  durationMinutes: number
  groupSize: number // 1 = individual, 2-8 = group, 9+ = whole class
  teacherPresent: boolean
  isOnline: boolean
  isSynchronous: boolean
  assessmentType: AssessmentType
  description: string
}

export interface TLA {
  id: string
  title: string
  notes: string
  learningTypes: LearningTypeRow[]
  resources: Resource[]
  /** Ids of the design's OutcomeStatements this activity serves (constructive alignment). */
  outcomeIds?: string[]
  /** 4Ds AI-literacy tags for this activity. */
  fourDs?: FourD[]
}

export interface Design {
  id: string
  name: string
  topic: string
  learningTimeMinutes: number
  sizeOfClass: number
  description: string
  modeOfDelivery: ModeOfDelivery
  aims: string
  /** Bloom's level quick-tags (kept for filtering; the written statements live below). */
  outcomes: string[]
  /** Written learning outcome statements — the first-class outcomes activities align to. */
  outcomeStatements?: OutcomeStatement[]
  tlas: TLA[]
  createdAt: string
  updatedAt: string
  isPublic: boolean
  derivedFrom?: string
  /** Module this session belongs to (see Module). Absent = unassigned. */
  moduleId?: string
  /** Scheduled date for this session, as YYYY-MM-DD. */
  sessionDate?: string
  /** Published to the local template library (Browser → Templates). */
  isTemplate?: boolean
}

/** A module groups several session designs, each with its own date. */
export interface Module {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
