import type { AwardType, BloomLevel, CreditValue, FheqLevel } from '../types'

/**
 * Summarised level descriptors from the QAA Frameworks for Higher Education
 * Qualifications of UK Degree-Awarding Bodies (2024). Paraphrased for UI hints
 * and AI prompts — not a substitute for the full framework document.
 */
export interface FheqDescriptor {
  level: FheqLevel
  award: string
  summary: string
  outcomeExpectations: string[]
  /** Bloom levels typical of outcomes written at this level (soft hint, never a blocker). */
  typicalVerbs: BloomLevel[]
}

export const FHEQ_LEVELS: Record<FheqLevel, FheqDescriptor> = {
  4: {
    level: 4,
    award: 'Certificate of Higher Education',
    summary:
      'Sound knowledge of the basic concepts of the subject, with the ability to evaluate and interpret these within the context of the area of study, and to develop lines of argument using basic theories and concepts.',
    outcomeExpectations: [
      'Knowledge of the underlying concepts and principles of the area of study',
      'Evaluate and interpret concepts within the context of the area of study',
      'Present, evaluate and interpret qualitative and quantitative data',
      'Develop lines of argument and make sound judgements using basic theories and concepts',
      'Communicate results of study accurately and reliably, with structured and coherent arguments',
    ],
    typicalVerbs: ['Remember', 'Understand', 'Apply'],
  },
  5: {
    level: 5,
    award: 'Foundation degree / Diploma of Higher Education',
    summary:
      'Knowledge and critical understanding of the well-established principles of the field and the way those principles have developed, with the ability to apply concepts beyond the context in which they were first studied.',
    outcomeExpectations: [
      'Knowledge and critical understanding of well-established principles, and how they have developed',
      'Apply underlying concepts and principles outside the context in which they were first studied, including in employment',
      'Knowledge of the main methods of enquiry in the subject',
      'Critically evaluate the appropriateness of different approaches to solving problems',
      'Understand the limits of their knowledge, and how this influences analyses and interpretations',
    ],
    typicalVerbs: ['Understand', 'Apply', 'Analyse'],
  },
  6: {
    level: 6,
    award: "Bachelor's degree with honours",
    summary:
      'Systematic understanding of key aspects of the field, including coherent and detailed knowledge at least some of which is informed by the forefront of the discipline, with accurate deployment of established techniques of analysis and enquiry.',
    outcomeExpectations: [
      'Systematic understanding of key aspects of the field, some informed by the forefront of the discipline',
      'Deploy accurately established techniques of analysis and enquiry',
      'Devise and sustain arguments, and solve problems, using ideas and techniques at the forefront of the discipline',
      'Critically evaluate arguments, assumptions, abstract concepts and data to make judgements',
      'Appreciate the uncertainty, ambiguity and limits of knowledge',
      'Manage their own learning, making use of scholarly reviews and primary sources',
    ],
    typicalVerbs: ['Apply', 'Analyse', 'Evaluate', 'Create'],
  },
  7: {
    level: 7,
    award: "Master's degree",
    summary:
      'Systematic understanding of knowledge and a critical awareness of current problems and/or new insights, much of it at the forefront of the discipline or area of professional practice, with originality in the application of knowledge.',
    outcomeExpectations: [
      'Systematic understanding and critical awareness of current problems and/or new insights at the forefront of the discipline or professional practice',
      'Comprehensive understanding of techniques applicable to their own research or advanced scholarship',
      'Originality in the application of knowledge, and practical understanding of how research and enquiry create and interpret knowledge',
      'Evaluate critically current research and advanced scholarship in the discipline',
      'Evaluate methodologies, develop critiques of them and, where appropriate, propose new hypotheses',
      'Self-direction and originality in tackling and solving problems; act autonomously in planning and implementing tasks at a professional level',
    ],
    typicalVerbs: ['Analyse', 'Evaluate', 'Create'],
  },
}

export const FHEQ_ATTRIBUTION =
  'Level descriptors summarised from the QAA Frameworks for Higher Education Qualifications of UK Degree-Awarding Bodies (2024).'

export const CREDIT_OPTIONS: readonly CreditValue[] = [15, 30] as const

/** UK CATS: one credit represents ten notional hours of learning. */
export function notionalHours(credits: number): number {
  return credits * 10
}

export interface AwardStageRule {
  level: FheqLevel
  credits: number
  name: string
}

export interface AwardRule {
  label: string
  totalCredits: number
  stages: AwardStageRule[]
}

export const AWARDS: Record<AwardType, AwardRule> = {
  BA: {
    label: 'BA (Hons)',
    totalCredits: 360,
    stages: [
      { level: 4, credits: 120, name: 'Year 1 · Level 4' },
      { level: 5, credits: 120, name: 'Year 2 · Level 5' },
      { level: 6, credits: 120, name: 'Year 3 · Level 6' },
    ],
  },
  MA: {
    label: 'MA',
    totalCredits: 180,
    stages: [{ level: 7, credits: 180, name: 'Level 7' }],
  },
}

const BLOOM_ORDER: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']

/**
 * Soft heuristic: does this Bloom level look plausible for outcomes at this FHEQ level?
 * Levels 6-7 expect higher-order verbs; level 4 tolerates the full lower range.
 * Used for hints only — never blocks the user.
 */
export function bloomFitsLevel(bloom: BloomLevel, level: FheqLevel): boolean {
  const idx = BLOOM_ORDER.indexOf(bloom)
  const minIdx: Record<FheqLevel, number> = { 4: 0, 5: 1, 6: 2, 7: 3 }
  return idx >= minIdx[level]
}

/** Compact FHEQ text for embedding in AI system prompts. */
export function fheqSummaryForPrompt(level?: FheqLevel): string {
  const levels = level ? [FHEQ_LEVELS[level]] : Object.values(FHEQ_LEVELS)
  return levels
    .map(
      (d) =>
        `FHEQ Level ${d.level} (${d.award}): ${d.summary} Outcomes should show: ${d.outcomeExpectations.join('; ')}.`
    )
    .join('\n')
}
