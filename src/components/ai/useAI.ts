// Thin client for the Netlify claude-proxy function. Every AI feature in the app (Generate
// Design, Balance Checker, Film & Media Advisor, Export Summary) goes through `send` here —
// none of them ever call api.anthropic.com directly. The proxy streams Claude's response as
// SSE (Netlify kills buffered responses at ~30s, which long generations always exceeded);
// this client assembles the streamed deltas back into the full text.
import { useCallback, useState } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SendOptions {
  system?: string
  model: string
}

function friendlyError(code: number | undefined, detail?: string): string {
  let base: string
  if (code === 401) base = 'The server’s Claude API key appears invalid.'
  else if (code === 429) base = 'Rate limit reached. Wait a moment and try again.'
  else if (code === 504) base = 'The AI took too long to respond. Try again shortly.'
  else base = 'Something went wrong connecting to Claude. Try again shortly.'
  // Honest errors: include a short server-provided detail so failures are diagnosable,
  // while keeping the friendly summary up front. Never a raw stack trace.
  const trimmed = detail?.trim()
  return trimmed ? `${base} (${trimmed.slice(0, 160)})` : base
}

/** Strips accidental ```json fences from a model response before JSON.parse. */
export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

/**
 * Assembles the full response text from an Anthropic SSE stream, throwing on a
 * mid-stream error event. Exported for testing.
 */
export async function readStreamedText(res: Response): Promise<string> {
  if (!res.body) throw new Error('Empty response stream')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''

  const consumeEvent = (chunk: string) => {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue
      const dataStr = line.slice(5).trim()
      if (!dataStr) continue
      let event: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } }
      try {
        event = JSON.parse(dataStr)
      } catch {
        continue
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text ?? ''
      } else if (event.type === 'error') {
        throw new Error(event.error?.message || 'The AI stream reported an error')
      }
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // SSE events are separated by a blank line; the tail may be a partial event.
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    events.forEach(consumeEvent)
  }
  if (buffer) consumeEvent(buffer)

  return text
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

      if (!res.ok) {
        let detail: string | undefined
        let code = res.status
        try {
          const data = await res.json()
          code = data.code ?? res.status
          detail = typeof data.error === 'string' ? data.error : undefined
        } catch {
          // Non-JSON error body (e.g. a gateway HTML page) — fall back to the status code.
        }
        setError(friendlyError(code, detail))
        return null
      }

      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('text/event-stream')) {
        return await readStreamedText(res)
      }
      // Non-streaming JSON response (kept for compatibility with the pre-streaming proxy).
      const data = await res.json()
      return data.content?.[0]?.text ?? ''
    } catch (err) {
      setError(friendlyError(undefined, err instanceof Error ? err.message : undefined))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error, setError }
}
