import * as THREE from 'three'
import { bake, preview, toon, toonFromMap, toTypeScript } from './engine.js'
import * as P from './props.js'

/* global __KINOTYPE__ */

/** The kinotype typewriter, with each of its materials mapped to a pixel-palette colour. */
async function typewriter() {
  const { createTypewriter } = await import('@kinotype/typewriter.js')
  const { batchDetails } = await import('@kinotype/batchDetails.js')
  const machine = createTypewriter(); batchDetails(machine.root)
  const carriage = machine.root.getObjectByName('Carriage')
  const MAP = {
    '#171914': '#353849', '#0c0d0b': '#1e1f2a', '#817057': '#d09a48', '#aaa592': '#c4c8d2',
    '#393a33': '#3e3e46', '#242824': '#26262f', '#807e6d': '#e2ddcc', '#552f32': '#962c34',
  }
  const base = m => {
    const data = m.map?.image?.data
    if (!data) return m.color.clone()
    let r = 0, g = 0, b = 0, n = 0
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ }
    return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.LinearSRGBColorSpace) // agedMaterial stores linear bytes
  }
  machine.root.traverse(o => {
    if (!o.isMesh || o.material.isMeshBasicMaterial) return
    const c = base(o.material)
    let best = '#353849', d = Infinity
    for (const [from, to] of Object.entries(MAP)) { const f = new THREE.Color(from), e = (f.r - c.r) ** 2 + (f.g - c.g) ** 2 + (f.b - c.b) ** 2; if (e < d) { d = e; best = to } }
    o.material = toon(best, { side: o.material.side })
  })
  const lines = document.createElement('canvas'); lines.width = 256; lines.height = 180
  const g = lines.getContext('2d'); g.fillStyle = '#f1e4c6'; g.fillRect(0, 0, 256, 180); g.fillStyle = '#9c8c70'
  for (let i = 0; i < 7; i++) g.fillRect(34, 40 + i * 16, 150 - (i * 37) % 70, 4)
  const tex = new THREE.CanvasTexture(lines); tex.colorSpace = THREE.SRGBColorSpace
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), toonFromMap(tex, { side: THREE.DoubleSide }))
  sheet.scale.y = .35; sheet.position.set(0, 1.96 + 1.25 * .35 - .05, -1.72); sheet.rotation.x = -.2
  carriage.add(sheet)
  const poses = [[0], [-.27, 'KeyA'], [-.09, 'KeyM'], [.09, 'KeyP'], [.27, 'KeyQ']]
  const frames = poses.map(([x, key], i) => () => {
    const t = 100 + i * 10
    if (key) machine.strike(key, t)
    machine.update(key ? t + .075 : t, .001, false)
    carriage.position.x = x
  })
  return { root: machine.root, frames }
}

// name → sprite file src/art/baked/<name>.ts
export const SPRITES = [
  { name: 'typewriter', source: 'the kinotype typewriter', width: 120, elevation: 30, build: typewriter, needsKinotype: true },
  { name: 'candelabra', width: 48, elevation: 12, build: P.candelabra },
  { name: 'wall-sconce', width: 44, elevation: 8, build: P.wallSconce },
  { name: 'teacup', width: 46, elevation: 26, build: P.teacup },
  { name: 'ink-and-quill', width: 32, elevation: 22, build: P.inkAndQuill },
  { name: 'in-tray', width: 96, elevation: 34, build: P.inTray },
  { name: 'journal', width: 104, elevation: 38, build: P.journal },
  { name: 'wall-clock', width: 46, elevation: 4, build: P.wallClock },
  { name: 'letter-rack', width: 106, elevation: 6, build: P.letterRack },
  { name: 'potted-plant', width: 100, elevation: 10, build: P.pottedPlant },
  { name: 'bookcase-tall', width: 146, elevation: 6, build: () => P.bookcase(7, 2, 11) },
  { name: 'bookcase-low', width: 270, elevation: 6, build: () => P.bookcase(13.4, 1, 27) },
  { name: 'cloth-desk', width: 616, elevation: 22, build: P.clothDesk },
]

const status = document.querySelector('#status'), view = document.querySelector('#view')
const post = (path, body) => fetch(`/save?path=${encodeURIComponent(path)}`, { method: 'POST', body })

export async function bakeOne(spec) {
  if (spec.needsKinotype && !__KINOTYPE__) return `${spec.name}: skipped (kinotype not found)`
  const model = await spec.build()
  const sprite = bake(model.root, { ...spec, frames: model.frames, anchors: model.anchors })
  await post(`src/art/baked/${spec.name}.ts`, toTypeScript(spec.name, spec.source ?? 'scripts/bake/props.js', sprite))
  await post(`.dream-loop/bake/${spec.name}.png`, preview(view, sprite))
  return `${spec.name}: ${sprite.width}×${sprite.height}, ${sprite.frames.length} frame(s), ${sprite.palette.length - 2} colours`
}
window.bakeAll = async (names) => {
  const log = []
  for (const spec of SPRITES) if (!names || names.includes(spec.name)) { status.textContent = `baking ${spec.name}…`; log.push(await bakeOne(spec)) }
  status.textContent = 'done'
  return log
}

const select = document.querySelector('#one')
for (const s of SPRITES) select.append(new Option(s.name, s.name))
document.querySelector('#all').onclick = () => window.bakeAll()
document.querySelector('#bake-one').onclick = () => window.bakeAll([select.value])
status.textContent = 'ready'
