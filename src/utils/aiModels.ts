// Single source of truth for which Claude models the app offers. The original default
// (claude-3-5-sonnet-20241022) was retired by Anthropic in Oct 2025 and now returns
// "model not found" — claude-sonnet-5 is its designated replacement.
export const SUPPORTED_MODELS = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — balanced (recommended)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — fastest, cheapest' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — most capable' },
] as const

export const DEFAULT_MODEL = 'claude-sonnet-5'

/** Maps a stored model id to a supported one — retired ids fall back to the default. */
export function sanitizeModel(model: string): string {
  return SUPPORTED_MODELS.some((m) => m.id === model) ? model : DEFAULT_MODEL
}
