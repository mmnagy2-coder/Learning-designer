// Streams chat responses from the Anthropic API to the browser. Netlify buffers ordinary
// function responses and cuts them off at ~30s — long generations (a full learning design)
// were dying with a 504 while the quick Test Connection call passed. Streaming avoids the
// buffer limit entirely: headers go out as soon as Claude produces its first token, and the
// SSE body is piped through untouched for the frontend to assemble.
// The API key comes from the ANTHROPIC_API_KEY environment variable set in Netlify's
// dashboard (Site configuration -> Environment variables) — never from the client.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed', code: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(500, {
      error: 'ANTHROPIC_API_KEY is not set in Netlify environment variables',
      code: 500,
    })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid request body', code: 400 })
  }

  const { messages, system, model } = payload

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse(400, { error: 'Missing messages', code: 400 })
  }

  let anthropicRes
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        max_tokens: 8192,
        system: system || undefined,
        messages,
        stream: true,
      }),
    })
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error', code: 500 })
  }

  if (anthropicRes.status === 401) {
    return jsonResponse(401, { error: 'Invalid API key', code: 401 })
  }
  if (anthropicRes.status === 429) {
    return jsonResponse(429, { error: 'Rate limit reached', code: 429 })
  }
  if (!anthropicRes.ok || !anthropicRes.body) {
    const text = await anthropicRes.text().catch(() => '')
    return jsonResponse(500, { error: text || 'Claude API request failed', code: 500 })
  }

  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
