export type LearningType =
  | 'acquisition'
  | 'collaboration'
  | 'discussion'
  | 'inquiry'
  | 'practice'
  | 'production'

export type ModeOfDelivery = 'face-to-face' | 'blended' | 'wholly-online' | 'async-online'

export type AssessmentType = 'none' | 'formative' | 'summative'

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
  outcomes: string[]
  tlas: TLA[]
  createdAt: string
  updatedAt: string
  isPublic: boolean
  derivedFrom?: string
}
