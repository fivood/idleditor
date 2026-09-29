// Offline visual QA using the production rasterizer; no browser or image assets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { deflateSync } from 'node:zlib'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, '.dream-loop', 'procedural')
const runtime = path.join(output, 'runtime')
fs.mkdirSync(runtime, { recursive: true })
fs.writeFileSync(path.join(runtime, 'package.json'), '{"type":"commonjs"}')
for (const file of ['pixels', 'rooms']) {
  const source = fs.readFileSync(path.join(root, 'src', 'art', `${file}.ts`), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } })
  fs.writeFileSync(path.join(runtime, `${file}.js`), compiled.outputText)
}
const require = createRequire(import.meta.url)
const { renderRoom, animateRoom, EMPTY_ROOM } = require(path.join(runtime, 'rooms.js'))

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const name = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4)
  size.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([size, name, data, crc])
}
function png(pixels, scale = 3) {
  const width = pixels.width * scale, height = pixels.height * scale
  const rgba = new Uint8Array(pixels.data.buffer)
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const src = (Math.floor(y / scale) * pixels.width + Math.floor(x / scale)) * 4
    const dst = y * (width * 4 + 1) + 1 + x * 4
    for (let k = 0; k < 4; k++) raw[dst + k] = rgba[src + k]
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const state = { ...EMPTY_ROOM, submitted: 8, working: 2, hasCat: true, books: 23, authors: 3, departments: 2 }
const timing = []
for (const room of ['desk', 'office', 'shelf', 'authors', 'study', 'stats']) {
  const base = renderRoom(room, state, false)
  const start = performance.now()
  let frame
  for (let i = 0; i < 20; i++) frame = animateRoom(base, room, state, i)
  timing.push({ room, averageFrameMs: +((performance.now() - start) / 20).toFixed(2) })
  fs.writeFileSync(path.join(output, `${room}.png`), png(frame))
}
const empty = renderRoom('desk', EMPTY_ROOM, false)
fs.writeFileSync(path.join(output, 'desk-empty.png'), png(animateRoom(empty, 'desk', EMPTY_ROOM, 0)))
fs.writeFileSync(path.join(output, 'timing.json'), JSON.stringify(timing, null, 2))
console.log(JSON.stringify({ output, timing }, null, 2))
