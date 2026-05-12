export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { code, data } = await request.json()
    if (!code || !data) {
      return new Response(JSON.stringify({ error: 'code and data required' }), { status: 400 })
    }

    const key = `save:${code}`
    await env.SAVE_KV.put(key, JSON.stringify(data))
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'save failed' }), { status: 500 })
  }
}
