// Offline visual QA using the production rasterizer; no browser or image assets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { png } from './_png.mjs'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, '.dream-loop', 'procedural')
const runtime = path.join(output, 'runtime')
fs.mkdirSync(runtime, { recursive: true })
fs.writeFileSync(path.join(runtime, 'package.json'), '{"type":"commonjs"}')
// Every art module (and the baked sprites) is transpiled; tests and types are left out.
for (const dir of ['', 'baked']) {
  fs.mkdirSync(path.join(runtime, dir), { recursive: true })
  for (const name of fs.readdirSync(path.join(root, 'src', 'art', dir))) {
    if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
    const source = fs.readFileSync(path.join(root, 'src', 'art', dir, name), 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } })
    fs.writeFileSync(path.join(runtime, dir, name.replace(/\.ts$/, '.js')), compiled.outputText)
  }
}
const require = createRequire(import.meta.url)
const { renderRoom, animateRoom, EMPTY_ROOM } = require(path.join(runtime, 'rooms.js'))

const state = { ...EMPTY_ROOM, submitted: 8, working: 2, hasCat: true, books: 23, authors: 3, departments: 2 }
const timing = []
for (const room of ['desk', 'office', 'shelf', 'authors', 'study', 'stats']) {
  const base = renderRoom(room, state, false)
  const start = performance.now()
  let frame
  for (let i = 0; i < 20; i++) frame = animateRoom(base, room, state, i)
  timing.push({ room, averageFrameMs: +((performance.now() - start) / 20).toFixed(2) })
  fs.writeFileSync(path.join(output, `${room}.png`), png(frame, 1))
}
const empty = renderRoom('desk', EMPTY_ROOM, false)
fs.writeFileSync(path.join(output, 'desk-empty.png'), png(animateRoom(empty, 'desk', EMPTY_ROOM, 0), 1))
fs.writeFileSync(path.join(output, 'timing.json'), JSON.stringify(timing, null, 2))
console.log(JSON.stringify({ output, timing }, null, 2))

// Weather sheet: the desk-room window in each weather (storm caught mid-strike).
const { lightning } = require(path.join(runtime, 'weather.js'))
const kinds = ['clear', 'drizzle', 'storm', 'snow', 'fog', 'wind']
const crop = [280, 44, 428, 280], sheet = new (require(path.join(runtime, 'pixels.js')).Pixels)(crop[2] * 3 + 8, crop[3] * 2 + 6)
const deskBase = renderRoom('desk', EMPTY_ROOM, false)
kinds.forEach((kind, i) => {
  let tick = 40
  if (kind === 'storm') while (lightning(tick).level !== 2) tick++
  const frame = animateRoom(deskBase, 'desk', EMPTY_ROOM, tick, kind)
  const ox = 2 + (i % 3) * (crop[2] + 2), oy = 2 + Math.floor(i / 3) * (crop[3] + 2)
  for (let y = 0; y < crop[3]; y++) for (let x = 0; x < crop[2]; x++) sheet.data[(oy + y) * sheet.width + ox + x] = frame.data[(crop[1] + y) * frame.width + crop[0] + x]
})
fs.writeFileSync(path.join(output, 'weather.png'), png(sheet, 1))
