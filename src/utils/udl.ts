import type { Design } from '../types'

/**
 * CAST Universal Design for Learning Guidelines 3.0, modelled as taggable data
 * (mirrors the fourDs pattern). Checkpoints are tagged per activity as ids like '7.1'.
 * © CAST, Inc. 2024. Used with attribution — see UDL_ATTRIBUTION.
 */
export type UdlPrinciple = 'engagement' | 'representation' | 'action-expression'

export type UdlTier = 'Access' | 'Support' | 'Executive Function'

export interface UdlCheckpoint {
  /** CAST checkpoint number, e.g. '7.1'. */
  id: string
  label: string
  guideline: string
  guidelineNumber: number
  principle: UdlPrinciple
}

export interface UdlGuideline {
  number: number
  name: string
  principle: UdlPrinciple
  tier: UdlTier
  checkpoints: { id: string; label: string }[]
}

export const UDL_PRINCIPLES: { id: UdlPrinciple; label: string; color: string }[] = [
  { id: 'engagement', label: 'Engagement', color: '#1e7b34' },
  { id: 'representation', label: 'Representation', color: '#5f4b8b' },
  { id: 'action-expression', label: 'Action & Expression', color: '#0a7abf' },
]

export const UDL_GUIDELINES: UdlGuideline[] = [
  // Multiple means of Engagement
  {
    number: 7,
    name: 'Welcoming Interests & Identities',
    principle: 'engagement',
    tier: 'Access',
    checkpoints: [
      { id: '7.1', label: 'Optimize choice and autonomy' },
      { id: '7.2', label: 'Optimize relevance, value, and authenticity' },
      { id: '7.3', label: 'Nurture joy and play' },
      { id: '7.4', label: 'Address biases, threats, and distractions' },
    ],
  },
  {
    number: 8,
    name: 'Sustaining Effort & Persistence',
    principle: 'engagement',
    tier: 'Support',
    checkpoints: [
      { id: '8.1', label: 'Clarify the meaning and purpose of goals' },
      { id: '8.2', label: 'Optimize challenge and support' },
      { id: '8.3', label: 'Foster collaboration, interdependence, and collective learning' },
      { id: '8.4', label: 'Foster belonging and community' },
      { id: '8.5', label: 'Offer action-oriented feedback' },
    ],
  },
  {
    number: 9,
    name: 'Emotional Capacity',
    principle: 'engagement',
    tier: 'Executive Function',
    checkpoints: [
      { id: '9.1', label: 'Recognize expectations, beliefs, and motivations' },
      { id: '9.2', label: 'Develop awareness of self and others' },
      { id: '9.3', label: 'Promote individual and collective reflection' },
      { id: '9.4', label: 'Cultivate empathy and restorative practices' },
    ],
  },
  // Multiple means of Representation
  {
    number: 1,
    name: 'Perception',
    principle: 'representation',
    tier: 'Access',
    checkpoints: [
      { id: '1.1', label: 'Support opportunities to customize the display of information' },
      { id: '1.2', label: 'Support multiple ways to perceive information' },
      { id: '1.3', label: 'Represent a diversity of perspectives and identities in authentic ways' },
    ],
  },
  {
    number: 2,
    name: 'Language & Symbols',
    principle: 'representation',
    tier: 'Support',
    checkpoints: [
      { id: '2.1', label: 'Clarify vocabulary, symbols, and language structures' },
      { id: '2.2', label: 'Support decoding of text, mathematical notation, and symbols' },
      { id: '2.3', label: 'Cultivate understanding and respect across languages and dialects' },
      { id: '2.4', label: 'Address biases in the use of language and symbols' },
      { id: '2.5', label: 'Illustrate through multiple media' },
    ],
  },
  {
    number: 3,
    name: 'Building Knowledge',
    principle: 'representation',
    tier: 'Executive Function',
    checkpoints: [
      { id: '3.1', label: 'Connect prior knowledge to new learning' },
      { id: '3.2', label: 'Highlight and explore patterns, critical features, big ideas, and relationships' },
      { id: '3.3', label: 'Cultivate multiple ways of knowing and making meaning' },
      { id: '3.4', label: 'Maximize transfer and generalization' },
    ],
  },
  // Multiple means of Action & Expression
  {
    number: 4,
    name: 'Interaction',
    principle: 'action-expression',
    tier: 'Access',
    checkpoints: [
      { id: '4.1', label: 'Vary and honor the methods for response, navigation, and movement' },
      { id: '4.2', label: 'Optimize access to accessible materials and assistive technologies and tools' },
    ],
  },
  {
    number: 5,
    name: 'Expression & Communication',
    principle: 'action-expression',
    tier: 'Support',
    checkpoints: [
      { id: '5.1', label: 'Use multiple media for communication' },
      { id: '5.2', label: 'Use multiple tools for construction, composition, and creativity' },
      { id: '5.3', label: 'Build fluencies with graduated support for practice and performance' },
      { id: '5.4', label: 'Address biases related to modes of expression and communication' },
    ],
  },
  {
    number: 6,
    name: 'Strategy Development',
    principle: 'action-expression',
    tier: 'Executive Function',
    checkpoints: [
      { id: '6.1', label: 'Set meaningful goals' },
      { id: '6.2', label: 'Anticipate and plan for challenges' },
      { id: '6.3', label: 'Organize information and resources' },
      { id: '6.4', label: 'Enhance capacity for monitoring progress' },
      { id: '6.5', label: 'Challenge exclusionary practices' },
    ],
  },
]

export const UDL_CHECKPOINTS: UdlCheckpoint[] = UDL_GUIDELINES.flatMap((g) =>
  g.checkpoints.map((c) => ({
    id: c.id,
    label: c.label,
    guideline: g.name,
    guidelineNumber: g.number,
    principle: g.principle,
  }))
)

export const UDL_ATTRIBUTION =
  'UDL checkpoints from CAST (2024), Universal Design for Learning Guidelines version 3.0. udlguidelines.cast.org'

const checkpointById = new Map(UDL_CHECKPOINTS.map((c) => [c.id, c]))

export function isValidUdlId(id: string): boolean {
  return checkpointById.has(id)
}

export function udlCheckpointLabel(id: string): string {
  return checkpointById.get(id)?.label ?? id
}

export function udlPrincipleOf(id: string): UdlPrinciple | undefined {
  return checkpointById.get(id)?.principle
}

export function guidelinesForPrinciple(principle: UdlPrinciple): UdlGuideline[] {
  return UDL_GUIDELINES.filter((g) => g.principle === principle)
}

export interface UdlPrincipleCoverage {
  principle: UdlPrinciple
  label: string
  color: string
  /** Distinct checkpoints tagged somewhere in the design. */
  tagged: number
  /** Checkpoints available under this principle. */
  total: number
}

export interface UdlCoverage {
  byPrinciple: UdlPrincipleCoverage[]
  /** Distinct checkpoint ids tagged anywhere in the design, in taxonomy order. */
  taggedCheckpoints: string[]
  untaggedTlaIds: string[]
  hasAnyTags: boolean
}

/** Aggregates UDL checkpoint tags across a design's activities. */
export function computeUdlCoverage(design: Design): UdlCoverage {
  const tagged = new Set<string>()
  const untaggedTlaIds: string[] = []
  for (const tla of design.tlas) {
    const ids = (tla.udl ?? []).filter(isValidUdlId)
    if (ids.length === 0) untaggedTlaIds.push(tla.id)
    ids.forEach((id) => tagged.add(id))
  }

  const byPrinciple = UDL_PRINCIPLES.map(({ id, label, color }) => {
    const all = UDL_CHECKPOINTS.filter((c) => c.principle === id)
    return {
      principle: id,
      label,
      color,
      tagged: all.filter((c) => tagged.has(c.id)).length,
      total: all.length,
    }
  })

  return {
    byPrinciple,
    taggedCheckpoints: UDL_CHECKPOINTS.filter((c) => tagged.has(c.id)).map((c) => c.id),
    untaggedTlaIds,
    hasAnyTags: tagged.size > 0,
  }
}

/** Merge coverage across several designs (module-level aggregation). */
export function mergeUdlCoverage(designs: Design[]): UdlCoverage {
  const tagged = new Set<string>()
  const untaggedTlaIds: string[] = []
  for (const design of designs) {
    const coverage = computeUdlCoverage(design)
    coverage.taggedCheckpoints.forEach((id) => tagged.add(id))
    untaggedTlaIds.push(...coverage.untaggedTlaIds)
  }
  const byPrinciple = UDL_PRINCIPLES.map(({ id, label, color }) => {
    const all = UDL_CHECKPOINTS.filter((c) => c.principle === id)
    return {
      principle: id,
      label,
      color,
      tagged: all.filter((c) => tagged.has(c.id)).length,
      total: all.length,
    }
  })
  return {
    byPrinciple,
    taggedCheckpoints: UDL_CHECKPOINTS.filter((c) => tagged.has(c.id)).map((c) => c.id),
    untaggedTlaIds,
    hasAnyTags: tagged.size > 0,
  }
}

/** Compact taxonomy text for embedding in AI system prompts. */
export function udlSummaryForPrompt(): string {
  return UDL_GUIDELINES.map(
    (g) =>
      `${g.name} (${UDL_PRINCIPLES.find((p) => p.id === g.principle)?.label}): ` +
      g.checkpoints.map((c) => `${c.id} ${c.label}`).join('; ')
  ).join('\n')
}
