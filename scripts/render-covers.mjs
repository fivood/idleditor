// Contact sheet of procedural covers: node scripts/render-covers.mjs [perGenre=8]
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
for (const file of ['pixels', 'handCovers', 'covers']) {
  const source = fs.readFileSync(path.join(root, 'src', 'art', `${file}.ts`), 'utf8')
  fs.writeFileSync(path.join(runtime, `${file}.js`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText)
}
const { renderCover } = createRequire(import.meta.url)(path.join(runtime, 'covers.js'))
const { Pixels } = createRequire(import.meta.url)(path.join(runtime, 'pixels.js'))

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'covers', 'manifest.json'), 'utf8'))
const per = Number(process.argv[2] ?? 8), styles = process.argv[5] === 'styles', cols = styles ? 9 : 8, pad = 2
const byGenre = {}
for (const b of manifest) (byGenre[b.genre] ??= []).push(b)
const picks = Object.values(byGenre).flatMap(list => list.slice(0, per)).flatMap(b => styles ? ['safe', 'bold', 'weird'].map(style => ({ ...b, style })) : [b])
const rows = Math.ceil(picks.length / cols), W = cols * (40 + pad) + pad, H = rows * (56 + pad) + pad
const sheet = new Pixels(W, H)
sheet.rect(0, 0, W, H, '#3c3c3c')
picks.forEach((b, i) => {
  const cover = renderCover(b.title, b.genre, b.style)
  const ox = pad + (i % cols) * (40 + pad), oy = pad + Math.floor(i / cols) * (56 + pad)
  for (let y = 0; y < 56; y++) for (let x = 0; x < 40; x++) sheet.data[(oy + y) * W + ox + x] = cover.data[y * 40 + x]
})
fs.writeFileSync(path.join(output, 'covers.png'), png(sheet, 3))
fs.writeFileSync(path.join(output, 'covers.txt'), picks.map((b, i) => `${i}: ${b.genre} ${b.title}`).join('\n'))
console.log(picks.length, 'covers ->', path.join(output, 'covers.png'))
// Fidelity check hook: `node scripts/render-covers.mjs 8 <title> <out.png>` writes one cover at 1x.
if (process.argv[3] && process.argv[3] !== '-') {
  const b = manifest.find(x => x.title === process.argv[3])
  fs.writeFileSync(process.argv[4], png(renderCover(b.title, b.genre), 1))
}
