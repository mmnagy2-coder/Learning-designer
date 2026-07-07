import type { FourD } from '../types'

/**
 * The 4Ds AI-literacy lens, taggable per activity.
 * From the AI Fluency framework by Rick Dakan and Joseph Feller (Anthropic),
 * licensed CC BY-NC-SA 4.0.
 */
export const FOUR_DS: { id: FourD; label: string; hint: string }[] = [
  { id: 'delegation', label: 'Delegation', hint: 'Deciding what work to hand to AI and what to keep human' },
  { id: 'description', label: 'Description', hint: 'Communicating intent to AI clearly and precisely' },
  { id: 'discernment', label: 'Discernment', hint: 'Evaluating AI outputs critically before acting on them' },
  { id: 'diligence', label: 'Diligence', hint: 'Taking responsibility for AI-assisted work and its consequences' },
]

export const FOUR_DS_ATTRIBUTION =
  'The 4Ds are from the AI Fluency framework by Rick Dakan and Joseph Feller (Anthropic), licensed CC BY-NC-SA 4.0.'

export function fourDLabel(id: FourD): string {
  return FOUR_DS.find((d) => d.id === id)?.label ?? id
}
