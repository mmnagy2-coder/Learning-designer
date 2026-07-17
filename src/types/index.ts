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
  /** CAST UDL 3.0 checkpoint ids (e.g. '7.1') this activity designs for. */
  udl?: string[]
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

/** FHEQ levels per the QAA Frameworks for Higher Education Qualifications (2024). */
export type FheqLevel = 4 | 5 | 6 | 7

/** UK CATS credit sizes offered by the module designer. Notional hours = credits x 10. */
export type CreditValue = 15 | 30

export type AwardType = 'BA' | 'MA'

/** One component of a module's assessment strategy. */
export interface AssessmentComponent {
  id: string
  title: string
  type: 'formative' | 'summative'
  /** e.g. 'Portfolio', 'Essay', 'Practical presentation'. */
  method: string
  /** Percentage weighting — summative components should sum to 100 (UI-validated, soft). */
  weighting: number
  weekDue?: number
  /** Ids of the module's OutcomeStatements this component assesses. */
  outcomeIds: string[]
}

/** One week in a module's delivery plan. */
export interface ModuleWeek {
  id: string
  number: number
  topic: string
  /** Session Designs delivered this week (ids into ld_designs). */
  designIds: string[]
  notes?: string
}

/**
 * A module groups several session designs and, optionally, carries a full UK module
 * descriptor (FHEQ-aligned). All descriptor fields are optional so records created
 * before the module designer existed keep working unchanged.
 */
export interface Module {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  /** Institutional module code, e.g. 'FILM501'. */
  code?: string
  credits?: CreditValue
  level?: FheqLevel
  aims?: string
  /** Module-level learning outcomes activities and assessments align to. */
  outcomeStatements?: OutcomeStatement[]
  assessments?: AssessmentComponent[]
  indicativeContent?: string
  readingList?: Resource[]
  weeks?: ModuleWeek[]
}

/** A module's place in a programme stage, plus its curriculum-map contributions. */
export interface CourseModuleRef {
  moduleId: string
  isCore: boolean
  /** Programme OutcomeStatement ids this module contributes to (curriculum map). */
  programmeOutcomeIds?: string[]
}

/** One stage (year/level) of a programme. */
export interface CourseStage {
  id: string
  name: string
  level: FheqLevel
  moduleRefs: CourseModuleRef[]
}

/** A whole programme of study (BA (Hons) or MA), composed of the user's modules. */
export interface Course {
  id: string
  title: string
  award: AwardType
  aims: string
  /** Programme-level learning outcomes. */
  outcomeStatements: OutcomeStatement[]
  stages: CourseStage[]
  /** Entry requirements, assessment strategy overview, and other free notes. */
  notes?: string
  createdAt: string
  updatedAt: string
}
