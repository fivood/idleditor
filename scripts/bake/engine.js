// Shared bake: one lighting rig, stepped (toon) shading, majority-vote downsampling, outline, run-length encoding.
import * as THREE from 'three'

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.toneMapping = THREE.NoToneMapping

// Four light steps: pixel shading, not gradients.
const ramp = new THREE.DataTexture(new Uint8Array([40, 40, 40, 255, 105, 105, 105, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 4, 1)
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true
const materials = new Map()
/** Cel material in an explicit pixel-palette colour. */
export function toon(color, extra = {}) {
  const key = color + JSON.stringify(extra)
  if (!materials.has(key)) materials.set(key, new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra }))
  return materials.get(key)
}
export const toonFromMap = (map, extra = {}) => new THREE.MeshToonMaterial({ map, gradientMap: ramp, ...extra })

/** The editor's-room rig: warm candle key from the upper right, a soft front fill, cool moonlight from behind-left. */
function rig(scene, o) {
  scene.add(new THREE.HemisphereLight('#4a3e5a', '#1a1014', o.ambient ?? .5))
  const key = new THREE.DirectionalLight('#ffd49a', o.key ?? 2.2); key.position.set(...(o.keyFrom ?? [5, 8, 6])); scene.add(key)
  const fill = new THREE.DirectionalLight('#b8b4d8', o.fill ?? .8); fill.position.set(0, 3, 10); scene.add(fill)
  const moon = new THREE.DirectionalLight('#8ea4dc', o.moon ?? 1.4); moon.position.set(-5, 5, -6); scene.add(moon)
}

function medianCut(colors, n) {
  let boxes = [colors]
  while (boxes.length < n) {
    boxes.sort((a, b) => b.length - a.length)
    const box = boxes.shift()
    if (box.length < 2) { boxes.push(box); break }
    const ranges = [0, 1, 2].map(k => Math.max(...box.map(c => c[k])) - Math.min(...box.map(c => c[k])))
    const k = ranges.indexOf(Math.max(...ranges))
    box.sort((a, b) => a[k] - b[k])
    boxes.push(box.slice(0, box.length >> 1), box.slice(box.length >> 1))
  }
  return boxes.map(b => [0, 1, 2].map(k => Math.round(b.reduce((s, c) => s + c[k], 0) / b.length)))
}

/**
 * Bake a model to sprite frames.
 * spec: { width, elevation, yaw?, ss?, colors?, frames?: (() => void)[], anchors?: {name: Vector3 (root space)}, light? }
 */
export function bake(root, spec) {
  const W = spec.width, SS = spec.ss ?? 3, maxColors = spec.colors ?? 64
  const frames = spec.frames ?? [() => {}]
  const scene = new THREE.Scene(); scene.add(root); rig(scene, spec.light ?? {})
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 400)
  const e = (spec.elevation ?? 20) * Math.PI / 180, yaw = (spec.yaw ?? 0) * Math.PI / 180, d = 120
  const box = new THREE.Box3()
  for (const pose of frames) { pose(); root.updateMatrixWorld(true); box.expandByObject(root) }
  const centre = box.getCenter(new THREE.Vector3())
  camera.position.set(centre.x + Math.sin(yaw) * Math.cos(e) * d, centre.y + Math.sin(e) * d, centre.z + Math.cos(yaw) * Math.cos(e) * d)
  camera.lookAt(centre); camera.updateMatrixWorld()
  const inv = camera.matrixWorldInverse, pts = []
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z).applyMatrix4(inv))
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), pad = (Math.max(...xs) - Math.min(...xs)) * .02
  Object.assign(camera, { left: Math.min(...xs) - pad, right: Math.max(...xs) + pad, top: Math.max(...ys) + pad, bottom: Math.min(...ys) - pad })
  camera.updateProjectionMatrix()
  const H = Math.round(W * (camera.top - camera.bottom) / (camera.right - camera.left))
  renderer.setSize(W * SS, H * SS)
  const grab = document.createElement('canvas'); grab.width = W * SS; grab.height = H * SS
  const g = grab.getContext('2d', { willReadFrequently: true })
  const shots = frames.map(pose => {
    pose(); root.updateMatrixWorld(true)
    renderer.setClearColor(0x000000, 0); renderer.render(scene, camera)
    g.clearRect(0, 0, grab.width, grab.height); g.drawImage(renderer.domElement, 0, 0)
    const src = g.getImageData(0, 0, grab.width, grab.height).data, out = []
    // Majority vote per block keeps exact cel colours; no in-between shades.
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const count = new Map(); let solid = 0
      for (let j = 0; j < SS; j++) for (let k = 0; k < SS; k++) {
        const s = ((y * SS + j) * grab.width + x * SS + k) * 4
        if (src[s + 3] < 128) continue
        solid++
        const c = (src[s] << 16) | (src[s + 1] << 8) | src[s + 2]
        count.set(c, (count.get(c) ?? 0) + 1)
      }
      if (solid * 2 < SS * SS) { out.push(null); continue }
      let best = 0, n = -1
      for (const [c, m] of count) if (m > n) { n = m; best = c }
      out.push([best >> 16, (best >> 8) & 255, best & 255])
    }
    return out
  })
  const all = shots.flat().filter(Boolean)
  const uniques = [...new Map(all.map(c => [c.join(','), c])).values()]
  const palette = uniques.length <= maxColors ? uniques : medianCut(all, maxColors)
  const lookup = new Map()
  const nearest = c => {
    const k = c.join(',')
    if (!lookup.has(k)) {
      let best = 0, d2 = Infinity
      palette.forEach((p, i) => { const e2 = (p[0] - c[0]) ** 2 * .3 + (p[1] - c[1]) ** 2 * .59 + (p[2] - c[2]) ** 2 * .11; if (e2 < d2) { d2 = e2; best = i } })
      lookup.set(k, best + 2)
    }
    return lookup.get(k)
  }
  const indexed = shots.map(shot => {
    const idx = shot.map(c => c ? nearest(c) : 0)
    return idx.map((v, i) => {
      if (v) return v
      const x = i % W, y = (i / W) | 0
      return (x > 0 && idx[i - 1]) || (x < W - 1 && idx[i + 1]) || (y > 0 && idx[i - W]) || (y < H - 1 && idx[i + W]) ? 1 : 0
    })
  })
  const encoded = indexed.map(px => {
    const bytes = []
    for (let i = 0; i < px.length;) { let n = 1; while (i + n < px.length && px[i + n] === px[i] && n < 255) n++; bytes.push(px[i], n); i += n }
    let bin = ''; for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin)
  })
  const anchors = {}
  for (const [name, point] of Object.entries(spec.anchors ?? {})) {
    frames[0](); root.updateMatrixWorld(true)
    const v = root.localToWorld(point.clone()).project(camera)
    anchors[name] = [Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H)]
  }
  scene.remove(root)
  const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
  return { width: W, height: H, palette: ['', '#0b080c', ...palette.map(hex)], frames: encoded, indexed, anchors }
}

export function toTypeScript(name, source, s) {
  const id = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase())
  const anchors = Object.keys(s.anchors).length ? `\n  anchors: ${JSON.stringify(s.anchors)},` : ''
  return `// Baked by scripts/bake (npm run art:bake) from ${source}. Do not edit by hand.
import type { BakedSprite } from '../sprite'

export const ${id}: BakedSprite = {
  width: ${s.width}, height: ${s.height},
  palette: ${JSON.stringify(s.palette)},
  frames: [
${s.frames.map(f => `    '${f}',`).join('\n')}
  ],${anchors}
}
`
}

/** All frames side by side at 4×, over the desk cloth colour, for review. */
export function preview(canvas, s) {
  const Z = 4, gap = 6
  canvas.width = s.indexed.length * (s.width * Z + gap); canvas.height = s.height * Z
  const v = canvas.getContext('2d'); v.fillStyle = '#3a1e22'; v.fillRect(0, 0, canvas.width, canvas.height)
  s.indexed.forEach((px, f) => px.forEach((c, i) => {
    if (!c) return
    v.fillStyle = s.palette[c]; v.fillRect(f * (s.width * Z + gap) + (i % s.width) * Z, ((i / s.width) | 0) * Z, Z, Z)
  }))
  return canvas.toDataURL('image/png')
}
