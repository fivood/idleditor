export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return new Response(JSON.stringify({ error: 'code required' }), { status: 400 })
  }

  try {
    const key = `save:${code}`
    const raw = await env.SAVE_KV.get(key)
    if (!raw) {
      return new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'load failed' }), { status: 500 })
  }
}
