export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { prompt } = await request.json()
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400 })
    }

    const fullPrompt = `A book cover illustration for a Chinese novel. Style: minimalist, elegant, editorial design with subtle surreal elements. No text on the cover. Novel synopsis: ${prompt}`

    if (!env.OPENAI_API_KEY) {
      const hash = prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const hue = Math.abs(hash) % 360
      const placeholderUrl = `https://placehold.co/400x560/${hue.toString(16).padStart(2, '0')}5070/${(hue + 180) % 360}${hue % 50 + 30}/svg?text=cover`
      return new Response(JSON.stringify({ imageUrl: placeholderUrl, placeholder: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    const data = await openaiRes.json()
    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'generation failed' }), { status: 500 })
    }

    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'no image returned' }), { status: 500 })
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'generation failed' }), { status: 500 })
  }
}
