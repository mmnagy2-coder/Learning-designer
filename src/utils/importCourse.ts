// Hydration for AI-generated programme skeletons. The model emits a course outline whose
// stages contain lean module stubs (title/code/credits only); hydration mints real Module
// records for them plus the Course that references them — the caller saves both.
import type {
  AwardType,
  BloomLevel,
  Course,
  CourseStage,
  FheqLevel,
  Module,
  OutcomeStatement,
} from '../types'
import { AWARDS } from './fheq'

const BLOOM_LEVELS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const FHEQ_LEVEL_VALUES: FheqLevel[] = [4, 5, 6, 7]

interface GeneratedCourseModule {
  name?: unknown
  code?: unknown
  credits?: unknown
  isCore?: unknown
  programmeOutcomeIndexes?: unknown
}

interface GeneratedStage {
  level?: unknown
  name?: unknown
  modules?: unknown
}

export interface HydratedCourse {
  course: Course
  /** New lean Module records created for the programme's stages. */
  modules: Module[]
}

export function hydrateGeneratedCourse(value: unknown): HydratedCourse | null {
  if (typeof value !== 'object' || value === null) return null
  const c = value as Record<string, unknown>
  if (typeof c.title !== 'string' || c.title.trim() === '') return null
  const award: AwardType = c.award === 'MA' ? 'MA' : 'BA'

  const now = new Date().toISOString()

  const rawStatements = Array.isArray(c.outcomeStatements) ? c.outcomeStatements : []
  const outcomeStatements: OutcomeStatement[] = rawStatements
    .filter((o): o is { text: string; bloomLevel?: string } => typeof (o as { text?: unknown })?.text === 'string')
    .map((o) => ({
      id: crypto.randomUUID(),
      text: o.text,
      bloomLevel: BLOOM_LEVELS.includes(o.bloomLevel as BloomLevel) ? (o.bloomLevel as BloomLevel) : undefined,
    }))

  const modules: Module[] = []
  const rawStages = Array.isArray(c.stages) ? c.stages : []
  const stages: CourseStage[] = rawStages
    .filter((s): s is GeneratedStage => typeof s === 'object' && s !== null)
    .filter((s) => typeof s.level === 'number' && FHEQ_LEVEL_VALUES.includes(s.level as FheqLevel))
    .map((s) => {
      const level = s.level as FheqLevel
      const ruleName = AWARDS[award].stages.find((r) => r.level === level)?.name
      const moduleRefs = (Array.isArray(s.modules) ? s.modules : [])
        .filter((m): m is GeneratedCourseModule => typeof m === 'object' && m !== null)
        .filter((m) => typeof m.name === 'string')
        .map((m) => {
          const module: Module = {
            id: crypto.randomUUID(),
            name: m.name as string,
            createdAt: now,
            updatedAt: now,
            code: typeof m.code === 'string' ? m.code : undefined,
            credits: typeof m.credits === 'number' ? (m.credits <= 22 ? 15 : 30) : undefined,
            level,
          }
          modules.push(module)
          return {
            moduleId: module.id,
            isCore: m.isCore !== false,
            programmeOutcomeIds: (Array.isArray(m.programmeOutcomeIndexes) ? m.programmeOutcomeIndexes : [])
              .filter((i): i is number => typeof i === 'number' && i >= 0 && i < outcomeStatements.length)
              .map((i) => outcomeStatements[i].id),
          }
        })
      return {
        id: crypto.randomUUID(),
        name: typeof s.name === 'string' ? s.name : (ruleName ?? `Level ${level}`),
        level,
        moduleRefs,
      }
    })

  if (stages.length === 0) return null

  return {
    course: {
      id: crypto.randomUUID(),
      title: c.title,
      award,
      aims: typeof c.aims === 'string' ? c.aims : '',
      outcomeStatements,
      stages,
      notes: typeof c.notes === 'string' ? c.notes : undefined,
      createdAt: now,
      updatedAt: now,
    },
    modules,
  }
}
