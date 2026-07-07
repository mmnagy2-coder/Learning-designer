import type { Design } from '../types'

export interface OutcomeAlignment {
  outcomeId: string
  text: string
  bloomLevel?: string
  /** How many activities declare they serve this outcome. */
  tlaCount: number
  /** Total designed minutes across the activities serving this outcome. */
  minutes: number
}

export interface AlignmentReport {
  hasOutcomes: boolean
  outcomes: OutcomeAlignment[]
  /** Outcomes no activity serves — Biggs' classic validation red flag. */
  orphanedOutcomes: OutcomeAlignment[]
  /** Activities that serve no outcome (only flagged once outcomes exist). */
  unalignedTlas: { id: string; title: string }[]
}

/** Constructive alignment: maps each written outcome to the activities that serve it. */
export function computeAlignment(design: Design): AlignmentReport {
  const statements = design.outcomeStatements ?? []
  const hasOutcomes = statements.length > 0

  const outcomes: OutcomeAlignment[] = statements.map((o) => {
    const servingTlas = design.tlas.filter((t) => (t.outcomeIds ?? []).includes(o.id))
    return {
      outcomeId: o.id,
      text: o.text,
      bloomLevel: o.bloomLevel,
      tlaCount: servingTlas.length,
      minutes: servingTlas.reduce(
        (sum, t) => sum + t.learningTypes.reduce((s, r) => s + r.durationMinutes, 0),
        0
      ),
    }
  })

  return {
    hasOutcomes,
    outcomes,
    orphanedOutcomes: outcomes.filter((o) => o.tlaCount === 0),
    unalignedTlas: hasOutcomes
      ? design.tlas
          .filter((t) => (t.outcomeIds ?? []).length === 0)
          .map((t) => ({ id: t.id, title: t.title }))
      : [],
  }
}
