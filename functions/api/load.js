import { checkRateLimit, getClientIP, validateLength, errorResponse, jsonResponse } from './_shared.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const secret = url.searchParams.get('secret') || ''

  if (!code) {
    return errorResponse('code required')
  }

  // Validate code format
  const codeCheck = validateLength(code, 32, 'code')
  if (!codeCheck.valid) return errorResponse(codeCheck.error)
  if (!/^[a-zA-Z0-9_-]{4,32}$/.test(code)) {
    return errorResponse('code must be 4-32 alphanumeric characters')
  }

  // Rate limit: 20 loads per minute per IP
  const ip = getClientIP(request)
  const rl = await checkRateLimit(env, `load:${ip}`, 20, 60)
  if (!rl.allowed) {
    return errorResponse('Rate limit exceeded. Try again later.', 429)
  }

  try {
    // Verify secret if save has one
    const existingMeta = await env.SAVE_KV.get(`meta:${code}`)
    if (existingMeta) {
      const meta = JSON.parse(existingMeta)
      if (meta.secret && meta.secret !== secret) {
        return errorResponse('Invalid secret for this save code', 403)
      }
    }

    const key = `save:${code}`
    const raw = await env.SAVE_KV.get(key)
    if (!raw) {
      return jsonResponse(null)
    }
    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return errorResponse('load failed', 500)
  }
}
