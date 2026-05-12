import 'dotenv/config'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const { prompt } = req.body
  if (!prompt) {
    return res.status(400).json({ error: 'prompt required' })
  }

  const fullPrompt = `A book cover illustration for a Chinese novel. Style: minimalist, elegant, editorial design with subtle surreal elements. The novel synopsis: ${prompt}. No text on the cover.`

  if (!openai) {
    const hash = prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const hue = Math.abs(hash) % 360
    const placeholderUrl = `https://placehold.co/400x560/${hue.toString(16).padStart(2, '0')}5070/${(hue + 180) % 360}${hue % 50 + 30}/svg?text=封面生成中...`
    return res.json({ imageUrl: placeholderUrl, placeholder: true })
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    })
    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      return res.status(500).json({ error: 'no image returned' })
    }
    return res.json({ imageUrl })
  } catch (err) {
    console.error('DALL-E error:', err)
    return res.status(500).json({ error: 'generation failed' })
  }
}
