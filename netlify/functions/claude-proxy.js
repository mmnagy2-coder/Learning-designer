// Proxies chat requests to the Anthropic API so the API key never touches the browser's
// network tab as a cross-origin request, and CORS is handled server-side. The key is supplied
// per-request by the client (stored in the user's own localStorage) and is never persisted here.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed', code: 405 })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Invalid request body', code: 400 })
  }

  const { messages, system, apiKey, model } = payload

  if (!apiKey || typeof apiKey !== 'string') {
    return jsonResponse(401, { error: 'Missing API key', code: 401 })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse(400, { error: 'Missing messages', code: 400 })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: system || undefined,
        messages,
      }),
    })

    if (anthropicRes.status === 401) {
      return jsonResponse(401, { error: 'Invalid API key', code: 401 })
    }
    if (anthropicRes.status === 429) {
      return jsonResponse(429, { error: 'Rate limit reached', code: 429 })
    }
    if (!anthropicRes.ok) {
      const text = await anthropicRes.text().catch(() => '')
      return jsonResponse(500, { error: text || 'Claude API request failed', code: 500 })
    }

    const data = await anthropicRes.json()
    return jsonResponse(200, data)
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error', code: 500 })
  }
}
