// The built-in template library: the seed designs promoted to named, documented starting
// points, plus two authored patterns (crit session, screening + debate) that showcase full
// outcome alignment. "Use template" deep-clones with fresh ids so edits never touch the
// original.
import type { AssessmentType, Design, LearningType, OutcomeStatement, TLA } from '../types'
import { seedDesigns } from './seedData'

export interface Template {
  design: Design
  whenToUse: string
}

function uid(): string {
  return crypto.randomUUID()
}

interface RowSpec {
  type: LearningType
  durationMinutes: number
  groupSize: number
  teacherPresent: boolean
  isOnline: boolean
  isSynchronous: boolean
  assessmentType: AssessmentType
  description: string
}

function mkTla(title: string, rows: RowSpec[], outcomeIds: string[] = []): TLA {
  return {
    id: uid(),
    title,
    notes: '',
    resources: [],
    outcomeIds,
    learningTypes: rows.map((r) => ({ id: uid(), ...r })),
  }
}

function mkTemplateDesign(partial: Omit<Design, 'id' | 'createdAt' | 'updatedAt' | 'isPublic'>): Design {
  const now = new Date('2026-01-01').toISOString()
  return { ...partial, id: uid(), createdAt: now, updatedAt: now, isPublic: false }
}

// --- Crit session -------------------------------------------------------------------------

const critOutcomes: OutcomeStatement[] = [
  { id: uid(), text: "Critique peers' work-in-progress using craft-specific vocabulary", bloomLevel: 'Evaluate' },
  { id: uid(), text: 'Justify creative decisions in response to structured critique', bloomLevel: 'Evaluate' },
  { id: uid(), text: 'Formulate an actionable revision plan from received feedback', bloomLevel: 'Create' },
]

const critSession = mkTemplateDesign({
  name: 'Crit Session',
  topic: 'Work-in-progress critique',
  learningTimeMinutes: 90,
  sizeOfClass: 15,
  description: 'A structured crit: brief framing, presentations with peer critique, and a closing synthesis where every student leaves with a revision plan.',
  modeOfDelivery: 'face-to-face',
  aims: 'To develop critical vocabulary and the ability to give, receive, and act on craft-focused feedback',
  outcomes: ['Evaluate', 'Create'],
  outcomeStatements: critOutcomes,
  tlas: [
    mkTla(
      'Framing the crit',
      [
        { type: 'acquisition', durationMinutes: 10, groupSize: 15, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Tutor frames the critique protocol and the craft vocabulary expected today.' },
      ],
      [critOutcomes[0].id]
    ),
    mkTla(
      'Presentations & peer critique',
      [
        { type: 'discussion', durationMinutes: 40, groupSize: 15, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Each student presents work-in-progress; peers critique using the protocol.' },
        { type: 'collaboration', durationMinutes: 15, groupSize: 5, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Small groups distil the strongest feedback for each presenter.' },
      ],
      [critOutcomes[0].id, critOutcomes[1].id]
    ),
    mkTla(
      'Synthesis & revision plan',
      [
        { type: 'production', durationMinutes: 15, groupSize: 1, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Each student writes a concrete revision plan from the feedback received.' },
      ],
      [critOutcomes[2].id]
    ),
  ],
})

// --- Screening and debate -----------------------------------------------------------------

const screeningOutcomes: OutcomeStatement[] = [
  { id: uid(), text: 'Analyse how formal film techniques construct meaning in the screened work', bloomLevel: 'Analyse' },
  { id: uid(), text: 'Evaluate competing critical positions on the screened film', bloomLevel: 'Evaluate' },
  { id: uid(), text: "Construct an evidenced argument about the film's formal approach", bloomLevel: 'Create' },
]

const screeningDebate = mkTemplateDesign({
  name: 'Screening and Debate',
  topic: 'Critical screening',
  learningTimeMinutes: 120,
  sizeOfClass: 20,
  description: 'A screening bracketed by critical framing and a structured two-position debate, closing with an individually written position piece.',
  modeOfDelivery: 'face-to-face',
  aims: 'To develop critical analysis of screen work and the ability to argue an evidenced position about it',
  outcomes: ['Analyse', 'Evaluate', 'Create'],
  outcomeStatements: screeningOutcomes,
  tlas: [
    mkTla(
      'Pre-screening framing',
      [
        { type: 'acquisition', durationMinutes: 10, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Tutor sets the critical questions to watch for.' },
      ],
      [screeningOutcomes[0].id]
    ),
    mkTla(
      'Screening',
      [
        { type: 'acquisition', durationMinutes: 45, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Whole-class screening with note-taking against the framing questions.' },
      ],
      [screeningOutcomes[0].id]
    ),
    mkTla(
      'Structured debate',
      [
        { type: 'collaboration', durationMinutes: 10, groupSize: 10, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Two teams prepare opposing critical positions.' },
        { type: 'discussion', durationMinutes: 35, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Moderated debate between the two positions, evidence required.' },
      ],
      [screeningOutcomes[1].id]
    ),
    mkTla(
      'Position piece',
      [
        { type: 'production', durationMinutes: 20, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'formative', description: 'Individual short written argument submitted online after the session.' },
      ],
      [screeningOutcomes[2].id]
    ),
  ],
})

// --- Library ------------------------------------------------------------------------------

const seedBlurbs = [
  'First week of any practical programme: facilities, safety procedures, and a low-stakes first shoot.',
  'Kit workshop pattern: theory online before the session, hands-on drills in pairs, then a group production task.',
  'Software workshop pattern: short demos alternating with long individual practice blocks and peer review.',
  'Technique-introduction pattern building to an individually assessed artefact.',
  'Critical + practical AI session — investigate tools, use them hands-on, reflect on their place in the craft.',
]

export const builtInTemplates: Template[] = [
  ...seedDesigns.map((design, i) => ({
    design,
    whenToUse: seedBlurbs[i] ?? 'A documented starting point for a common session pattern.',
  })),
  { design: critSession, whenToUse: 'Any point where students have work-in-progress that would benefit from structured peer critique.' },
  { design: screeningDebate, whenToUse: 'Film-studies style sessions: build analysis and argumentation around a shared screening.' },
]

/** Deep-clones a template into a fresh, editable design with all-new ids. */
export function instantiateTemplate(source: Design): Design {
  const now = new Date().toISOString()
  const outcomeIdMap = new Map<string, string>()
  const outcomeStatements = (source.outcomeStatements ?? []).map((o) => {
    const id = uid()
    outcomeIdMap.set(o.id, id)
    return { ...o, id }
  })

  return {
    ...source,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    isPublic: false,
    isTemplate: false,
    derivedFrom: source.id,
    moduleId: undefined,
    sessionDate: undefined,
    outcomeStatements: outcomeStatements.length > 0 ? outcomeStatements : undefined,
    tlas: source.tlas.map((t) => ({
      ...t,
      id: uid(),
      learningTypes: t.learningTypes.map((r) => ({ ...r, id: uid() })),
      resources: t.resources.map((r) => ({ ...r, id: uid() })),
      outcomeIds: (t.outcomeIds ?? [])
        .map((oid) => outcomeIdMap.get(oid))
        .filter((oid): oid is string => Boolean(oid)),
    })),
  }
}
