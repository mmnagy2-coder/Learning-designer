import type { Design, LearningType, AssessmentType, TLA } from '../types'

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
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

function row(spec: RowSpec) {
  return { id: uid(), ...spec }
}

function tla(title: string, rows: RowSpec[], notes = ''): TLA {
  return {
    id: uid(),
    title,
    notes,
    learningTypes: rows.map(row),
    resources: [],
  }
}

function design(partial: {
  name: string
  topic: string
  learningTimeMinutes: number
  sizeOfClass: number
  description: string
  modeOfDelivery: Design['modeOfDelivery']
  aims: string
  outcomes: string[]
  tlas: TLA[]
  createdDaysAgo: number
}): Design {
  const now = daysAgo(partial.createdDaysAgo)
  const updated = daysAgo(Math.max(partial.createdDaysAgo - 3, 0))
  return {
    id: uid(),
    name: partial.name,
    topic: partial.topic,
    learningTimeMinutes: partial.learningTimeMinutes,
    sizeOfClass: partial.sizeOfClass,
    description: partial.description,
    modeOfDelivery: partial.modeOfDelivery,
    aims: partial.aims,
    outcomes: partial.outcomes,
    tlas: partial.tlas,
    createdAt: now,
    updatedAt: updated,
    isPublic: false,
  }
}

const design1 = design({
  name: 'Week 1 – Induction and Health & Safety',
  topic: 'Film Production Induction',
  learningTimeMinutes: 180,
  sizeOfClass: 30,
  description: 'A first-week induction session covering facilities, safety, and the production environment.',
  modeOfDelivery: 'face-to-face',
  aims: 'To introduce students to MetFilm School facilities, safety procedures, and the production environment',
  outcomes: ['Remember', 'Understand'],
  createdDaysAgo: 42,
  tlas: [
    tla('Introduction & Welcome', [
      { type: 'acquisition', durationMinutes: 20, groupSize: 30, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Welcome briefing introducing the course team, facilities, and cohort.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 30, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Open Q&A about expectations and the term ahead.' },
    ]),
    tla('Health & Safety Walkthrough', [
      { type: 'acquisition', durationMinutes: 30, groupSize: 30, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Guided walkthrough of studio, grip, and electrical safety procedures.' },
      { type: 'practice', durationMinutes: 15, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'formative', description: 'Complete the online H&S quiz individually.' },
    ]),
    tla('Equipment Overview', [
      { type: 'inquiry', durationMinutes: 20, groupSize: 5, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Small groups investigate the camera and lighting store inventory.' },
      { type: 'collaboration', durationMinutes: 15, groupSize: 5, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Groups compare findings and plan equipment booking procedure.' },
    ]),
    tla('First Shoot Exercise', [
      { type: 'production', durationMinutes: 30, groupSize: 2, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Pairs shoot a short test clip using booked equipment.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 30, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Whole-class debrief on the first shoot exercise.' },
    ]),
  ],
})

const design2 = design({
  name: 'Camera Operations & Racking',
  topic: 'Camera operation fundamentals',
  learningTimeMinutes: 180,
  sizeOfClass: 25,
  description: 'A practical session building camera operation, focus pulling, and composition skills for broadcast TV.',
  modeOfDelivery: 'blended',
  aims: 'To develop practical skills in camera operation, focus pulling, and shot composition for broadcast television',
  outcomes: ['Apply', 'Analyse'],
  createdDaysAgo: 35,
  tlas: [
    tla('Broadcast Camera Principles', [
      { type: 'acquisition', durationMinutes: 20, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Pre-session video on broadcast camera sensors and lens systems.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 25, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Class discussion linking theory to today’s practical exercises.' },
    ]),
    tla('Focus Pulling Technique', [
      { type: 'acquisition', durationMinutes: 15, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Short video demonstrating focus pulling marks and technique.' },
      { type: 'practice', durationMinutes: 30, groupSize: 2, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Paired focus-pulling drills with tutor feedback.' },
      { type: 'inquiry', durationMinutes: 15, groupSize: 2, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Pairs test different lens/aperture combinations and note results.' },
    ]),
    tla('Multi-Camera Setup', [
      { type: 'collaboration', durationMinutes: 25, groupSize: 5, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Groups plan and rig a multi-camera studio setup.' },
      { type: 'production', durationMinutes: 20, groupSize: 5, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Groups shoot a short multi-camera sequence.' },
    ]),
    tla('Technical Review', [
      { type: 'discussion', durationMinutes: 15, groupSize: 25, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Whole-class review of footage and technique.' },
      { type: 'production', durationMinutes: 10, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'formative', description: 'Individual upload of a technical self-assessment clip.' },
    ]),
  ],
})

const design3 = design({
  name: 'Editing and Post-Production – Session A',
  topic: 'Non-linear editing fundamentals',
  learningTimeMinutes: 180,
  sizeOfClass: 20,
  description: 'An introduction to Premiere Pro editing workflows for narrative film and television.',
  modeOfDelivery: 'blended',
  aims: 'To develop competency in Premiere Pro editing workflows for narrative film and television',
  outcomes: ['Apply', 'Create'],
  createdDaysAgo: 28,
  tlas: [
    tla('NLE Principles', [
      { type: 'acquisition', durationMinutes: 15, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Pre-session video on non-linear editing concepts.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Discussion of editing workflows across genres.' },
    ]),
    tla('Rough Cut Assembly', [
      { type: 'practice', durationMinutes: 40, groupSize: 1, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Individual rough-cut assembly in Premiere Pro with tutor support.' },
      { type: 'inquiry', durationMinutes: 10, groupSize: 1, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Self-review of pacing and continuity in the rough cut.' },
    ]),
    tla('Sound & Colour', [
      { type: 'acquisition', durationMinutes: 10, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Short video on sound levelling and basic colour correction.' },
      { type: 'practice', durationMinutes: 35, groupSize: 1, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Individual sound mix and colour grade of the rough cut.' },
    ]),
    tla('Peer Review', [
      { type: 'production', durationMinutes: 15, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Upload the finished cut for peer review.' },
      { type: 'collaboration', durationMinutes: 25, groupSize: 2, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Paired peer feedback exchange on final cuts.' },
    ]),
  ],
})

const design4 = design({
  name: 'Visual Effects – Compositing Fundamentals',
  topic: 'Green screen and compositing for film and TV',
  learningTimeMinutes: 120,
  sizeOfClass: 20,
  description: 'An introduction to compositing workflows using Adobe After Effects for VFX in film production.',
  modeOfDelivery: 'blended',
  aims: 'To introduce students to compositing workflows using Adobe After Effects for VFX in film production',
  outcomes: ['Understand', 'Apply', 'Create'],
  createdDaysAgo: 20,
  tlas: [
    tla('VFX in Contemporary Cinema', [
      { type: 'acquisition', durationMinutes: 20, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Lecture surveying VFX and compositing in contemporary film.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Discussion of VFX examples students found compelling.' },
    ]),
    tla('Green Screen Theory', [
      { type: 'acquisition', durationMinutes: 10, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'none', description: 'Video on green screen lighting and keying theory.' },
      { type: 'inquiry', durationMinutes: 15, groupSize: 2, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Pairs examine sample footage for keying problems.' },
    ]),
    tla('Keying Workshop', [
      { type: 'practice', durationMinutes: 35, groupSize: 1, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'formative', description: 'Individual keying practice in After Effects with tutor support.' },
    ]),
    tla('Final Composite', [
      { type: 'production', durationMinutes: 30, groupSize: 1, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'summative', description: 'Individual submission of a final composited shot.' },
    ]),
  ],
})

const design5 = design({
  name: 'Introduction to AI in Film Production',
  topic: 'AI tools in contemporary film and media production',
  learningTimeMinutes: 120,
  sizeOfClass: 20,
  description: 'A critical and practical introduction to AI-powered tools across the production pipeline.',
  modeOfDelivery: 'blended',
  aims: 'To critically evaluate and practically apply AI-powered tools across pre-production, production, and post-production workflows',
  outcomes: ['Analyse', 'Evaluate', 'Create'],
  createdDaysAgo: 8,
  tlas: [
    tla('AI in Cinema Today', [
      { type: 'acquisition', durationMinutes: 15, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Lecture surveying AI tools currently used in film production.' },
      { type: 'discussion', durationMinutes: 15, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Class debate on the ethics and craft implications of AI tools.' },
    ]),
    tla('Tool Landscape', [
      { type: 'inquiry', durationMinutes: 20, groupSize: 4, teacherPresent: false, isOnline: true, isSynchronous: true, assessmentType: 'none', description: 'Small groups investigate current AI tools in a shared online session.' },
    ]),
    tla('Prompt-to-Scene Workshop', [
      { type: 'practice', durationMinutes: 25, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: true, assessmentType: 'formative', description: 'Individual practice generating a short scene with an AI video tool.' },
      { type: 'collaboration', durationMinutes: 10, groupSize: 4, teacherPresent: false, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Groups compare and critique generated scenes.' },
    ]),
    tla('Critical Reflection', [
      { type: 'production', durationMinutes: 25, groupSize: 1, teacherPresent: false, isOnline: true, isSynchronous: false, assessmentType: 'formative', description: 'Individual written reflection produced and submitted online.' },
      { type: 'discussion', durationMinutes: 10, groupSize: 20, teacherPresent: true, isOnline: false, isSynchronous: true, assessmentType: 'none', description: 'Whole-class closing discussion on AI’s role in their own practice.' },
    ]),
  ],
})

export const seedDesigns: Design[] = [design1, design2, design3, design4, design5]
