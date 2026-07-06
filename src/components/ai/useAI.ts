// Thin client for the Netlify claude-proxy function. Every AI feature in the app (Generate
// Design, Balance Checker, Film & Media Advisor, Export Summary) goes through `send` here —
// none of them ever call api.anthropic.com directly.
import { useCallback, useState } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SendOptions {
  system?: string
  model: string
}

function friendlyError(code: number | undefined): string {
  if (code === 401) return 'The server’s Claude API key appears invalid.'
  if (code === 429) return 'Rate limit reached. Wait a moment and try again.'
  return 'Something went wrong connecting to Claude. Try again shortly.'
}

/** Strips accidental ```json fences from a model response before JSON.parse. */
export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (messages: ChatMessage[], options: SendOptions): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/claude-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system: options.system, model: options.model }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(friendlyError(data.code ?? res.status))
        return null
      }
      const text = data.content?.[0]?.text ?? ''
      return text
    } catch {
      setError(friendlyError(undefined))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error, setError }
}
