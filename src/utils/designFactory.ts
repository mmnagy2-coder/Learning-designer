import type { Design, TLA } from '../types'

export function blankDesign(): Design {
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

export function newTLA(): TLA {
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
