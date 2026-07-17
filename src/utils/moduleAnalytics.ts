import type { Design, Module } from '../types'
import { averageAnalytics, type LearningTypeSlice } from './calculateAnalytics'
import { mergeUdlCoverage, type UdlCoverage } from './udl'
import { notionalHours } from './fheq'

export interface ModuleOutcomeCoverage {
  outcomeId: string
  text: string
  bloomLevel?: string
  /** Titles of summative assessment components that assess this outcome. */
  summativeBy: string[]
  /** Titles of formative components that assess this outcome. */
  formativeBy: string[]
}

export interface ModuleAnalytics {
  linkedDesignCount: number
  /** Total designed minutes across the module's linked session designs. */
  designedMinutes: number
  /** Credits x 10 hours x 60, or null when credits are unset. */
  notionalMinutes: number | null
  /** Learning-type balance merged across all linked sessions. */
  byLearningType: LearningTypeSlice[]
  outcomeCoverage: ModuleOutcomeCoverage[]
  /** Sum of summative component weightings (should be 100). */
  summativeWeightingTotal: number
  udl: UdlCoverage
}

/** Aggregates a module's linked session designs plus its own descriptor data. */
export function computeModuleAnalytics(module: Module, linkedDesigns: Design[]): ModuleAnalytics {
  const merged = averageAnalytics(linkedDesigns)
  const assessments = module.assessments ?? []

  const outcomeCoverage: ModuleOutcomeCoverage[] = (module.outcomeStatements ?? []).map((o) => ({
    outcomeId: o.id,
    text: o.text,
    bloomLevel: o.bloomLevel,
    summativeBy: assessments.filter((a) => a.type === 'summative' && a.outcomeIds.includes(o.id)).map((a) => a.title),
    formativeBy: assessments.filter((a) => a.type === 'formative' && a.outcomeIds.includes(o.id)).map((a) => a.title),
  }))

  return {
    linkedDesignCount: linkedDesigns.length,
    designedMinutes: merged.totalMinutes,
    notionalMinutes: module.credits ? notionalHours(module.credits) * 60 : null,
    byLearningType: merged.byLearningType,
    outcomeCoverage,
    summativeWeightingTotal: assessments
      .filter((a) => a.type === 'summative')
      .reduce((s, a) => s + (Number.isFinite(a.weighting) ? a.weighting : 0), 0),
    udl: mergeUdlCoverage(linkedDesigns),
  }
}
