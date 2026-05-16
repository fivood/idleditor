// ──── Shared utilities for API security ────

/**
 * Simple rate limiter using Cloudflare KV.
 * Returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(env, key, maxRequests, windowSeconds) {
  const rlKey = `rl:${key}`
  const now = Math.floor(Date.now() / 1000)

  const raw = await env.SAVE_KV.get(rlKey)
  let record = raw ? JSON.parse(raw) : { count: 0, windowStart: now }

  // Reset window if expired
  if (now - record.windowStart >= windowSeconds) {
    record = { count: 0, windowStart: now }
  }

  record.count++

  if (record.count > maxRequests) {
    // Update KV but deny request
    await env.SAVE_KV.put(rlKey, JSON.stringify(record), { expirationTtl: windowSeconds })
    return { allowed: false, remaining: 0 }
  }

  await env.SAVE_KV.put(rlKey, JSON.stringify(record), { expirationTtl: windowSeconds })
  return { allowed: true, remaining: maxRequests - record.count }
}

/**
 * Get client IP from Cloudflare request headers.
 */
export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
}

/**
 * Validate that a string input doesn't exceed max length.
 */
export function validateLength(value, maxLength, fieldName = 'input') {
  if (typeof value !== 'string') return { valid: false, error: `${fieldName} must be a string` }
  if (value.length > maxLength) return { valid: false, error: `${fieldName} exceeds max length (${maxLength})` }
  return { valid: true }
}

/**
 * Create a JSON error response.
 */
export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Create a JSON success response.
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Sanitize user input before inserting into LLM prompts.
 * Strips potential prompt injection patterns.
 */
export function sanitizeForPrompt(input, maxLength = 2000) {
  if (typeof input !== 'string') return ''
  return input
    .slice(0, maxLength)
    // Remove common prompt injection patterns
    .replace(/忽略以上|ignore above|system:|assistant:|<\|.*?\|>/gi, '')
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}
