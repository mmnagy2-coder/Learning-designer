import type { AwardType, Course, CourseStage } from '../types'
import { AWARDS } from './fheq'

/** Stage scaffold for an award: BA (Hons) = levels 4/5/6, MA = level 7. */
export function stagesForAward(award: AwardType): CourseStage[] {
  return AWARDS[award].stages.map((s) => ({
    id: crypto.randomUUID(),
    name: s.name,
    level: s.level,
    moduleRefs: [],
  }))
}

export function blankCourse(award: AwardType = 'BA'): Course {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Programme',
    award,
    aims: '',
    outcomeStatements: [],
    stages: stagesForAward(award),
    createdAt: now,
    updatedAt: now,
  }
}
