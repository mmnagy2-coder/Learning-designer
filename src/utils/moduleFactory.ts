import type { AssessmentComponent, Module, ModuleWeek } from '../types'

export function blankModule(name = 'Untitled Module'): Module {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now }
}

export function newModuleWeek(number: number): ModuleWeek {
  return { id: crypto.randomUUID(), number, topic: '', designIds: [] }
}

export function newAssessmentComponent(): AssessmentComponent {
  return {
    id: crypto.randomUUID(),
    title: 'New assessment',
    type: 'summative',
    method: '',
    weighting: 0,
    outcomeIds: [],
  }
}
