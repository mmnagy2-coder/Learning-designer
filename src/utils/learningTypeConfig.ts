import { BookOpen, Users, MessageCircle, Search, Dumbbell, Clapperboard } from 'lucide-react'
import type { LearningType } from '../types'

export interface LearningTypeConfig {
  type: LearningType
  label: string
  verb: string
  color: string // tailwind class fragment, e.g. 'acquisition'
  hex: string
  icon: typeof BookOpen
}

export const LEARNING_TYPES: LearningTypeConfig[] = [
  { type: 'acquisition', label: 'Acquisition', verb: 'Read Watch Listen', color: 'acquisition', hex: '#06b6d4', icon: BookOpen },
  { type: 'collaboration', label: 'Collaboration', verb: 'Collaborate', color: 'collaboration', hex: '#eab308', icon: Users },
  { type: 'discussion', label: 'Discussion', verb: 'Discuss', color: 'discussion', hex: '#3b82f6', icon: MessageCircle },
  { type: 'inquiry', label: 'Inquiry', verb: 'Investigate', color: 'inquiry', hex: '#ef4444', icon: Search },
  { type: 'practice', label: 'Practice', verb: 'Practice', color: 'practice', hex: '#a855f7', icon: Dumbbell },
  { type: 'production', label: 'Production', verb: 'Produce', color: 'production', hex: '#22c55e', icon: Clapperboard },
]

export const LEARNING_TYPE_MAP: Record<LearningType, LearningTypeConfig> = LEARNING_TYPES.reduce(
  (acc, cfg) => {
    acc[cfg.type] = cfg
    return acc
  },
  {} as Record<LearningType, LearningTypeConfig>
)

export function learningTypeColor(type: LearningType): string {
  return LEARNING_TYPE_MAP[type].hex
}

export function groupSizeCategory(groupSize: number): 'Individual' | 'Group' | 'Whole class' {
  if (groupSize <= 1) return 'Individual'
  if (groupSize <= 8) return 'Group'
  return 'Whole class'
}
