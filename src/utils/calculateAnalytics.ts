import type { Design, LearningType, LearningTypeRow } from '../types'
import { LEARNING_TYPES, groupSizeCategory } from './learningTypeConfig'

export interface LearningTypeSlice {
  type: LearningType
  label: string
  color: string
  minutes: number
  percent: number
}

export interface BinarySplit {
  label: string
  minutes: number
}

export interface Analytics {
  totalMinutes: number
  byLearningType: LearningTypeSlice[]
  faceToFaceVsOnline: BinarySplit[]
  teacherPresence: BinarySplit[]
  synchronicity: BinarySplit[]
  assessment: BinarySplit[]
  groupSize: BinarySplit[]
}

function allRows(design: Design): LearningTypeRow[] {
  return design.tlas.flatMap((tla) => tla.learningTypes)
}

/**
 * Every aggregation sums durationMinutes across LearningTypeRows (never per-TLA),
 * per the app's analytics rules — a TLA can mix rows with different modes/types.
 */
export function computeAnalytics(design: Design): Analytics {
  const rows = allRows(design)
  const totalMinutes = rows.reduce((sum, r) => sum + r.durationMinutes, 0)

  const byLearningType: LearningTypeSlice[] = LEARNING_TYPES.map((cfg) => {
    const minutes = rows.filter((r) => r.type === cfg.type).reduce((s, r) => s + r.durationMinutes, 0)
    return {
      type: cfg.type,
      label: cfg.label,
      color: cfg.hex,
      minutes,
      percent: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
    }
  })

  const sumWhere = (pred: (r: LearningTypeRow) => boolean) =>
    rows.filter(pred).reduce((s, r) => s + r.durationMinutes, 0)

  const faceToFaceVsOnline: BinarySplit[] = [
    { label: 'Face to face', minutes: sumWhere((r) => !r.isOnline) },
    { label: 'Online', minutes: sumWhere((r) => r.isOnline) },
  ]

  const teacherPresence: BinarySplit[] = [
    { label: 'Teacher present', minutes: sumWhere((r) => r.teacherPresent) },
    { label: 'Not present', minutes: sumWhere((r) => !r.teacherPresent) },
  ]

  const synchronicity: BinarySplit[] = [
    { label: 'Synchronous', minutes: sumWhere((r) => r.isSynchronous) },
    { label: 'Asynchronous', minutes: sumWhere((r) => !r.isSynchronous) },
  ]

  const assessment: BinarySplit[] = [
    { label: 'Formative', minutes: sumWhere((r) => r.assessmentType === 'formative') },
    { label: 'Summative', minutes: sumWhere((r) => r.assessmentType === 'summative') },
  ]

  const groupSize: BinarySplit[] = [
    { label: 'Individual', minutes: sumWhere((r) => groupSizeCategory(r.groupSize) === 'Individual') },
    { label: 'Group', minutes: sumWhere((r) => groupSizeCategory(r.groupSize) === 'Group') },
    { label: 'Whole class', minutes: sumWhere((r) => groupSizeCategory(r.groupSize) === 'Whole class') },
  ]

  return {
    totalMinutes,
    byLearningType,
    faceToFaceVsOnline,
    teacherPresence,
    synchronicity,
    assessment,
    groupSize,
  }
}

export function averageAnalytics(designs: Design[]): Analytics {
  const analyticsList = designs.map(computeAnalytics)
  const totalMinutes = analyticsList.reduce((s, a) => s + a.totalMinutes, 0)

  const byLearningType: LearningTypeSlice[] = LEARNING_TYPES.map((cfg) => {
    const minutes = analyticsList.reduce((s, a) => {
      const slice = a.byLearningType.find((x) => x.type === cfg.type)
      return s + (slice?.minutes ?? 0)
    }, 0)
    return {
      type: cfg.type,
      label: cfg.label,
      color: cfg.hex,
      minutes,
      percent: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
    }
  })

  return {
    totalMinutes,
    byLearningType,
    faceToFaceVsOnline: [],
    teacherPresence: [],
    synchronicity: [],
    assessment: [],
    groupSize: [],
  }
}
