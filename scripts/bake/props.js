// 3D props for the editor's room. Units are arbitrary; each bake fits the model to its sprite width.
import * as THREE from 'three'
import { toon, toonFromMap } from './engine.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const C = {
  brass: '#c89040', wax: '#efe6d0', porcelain: '#eee6d6', gold: '#d9a94a', tea: '#5a2c14',
  ink: '#161c28', glass: '#1a2233', feather: '#efe8dc', shaft: '#b8a88a', paper: '#f1e4c6', paper2: '#dccaa6', seal: '#9a2430',
  woodDark: '#3a241c', wood: '#5a3828', woodLight: '#7a5038', cloth: '#7a1c22', trim: '#c8923e',
  terracotta: '#b0583a', terracottaDark: '#7a3624', soil: '#2a1c16', leaf: '#4f7a4a', leafLight: '#6f9a5a',
  face: '#efe2c4', black: '#15121a', cover: '#4a1a22',
  books: ['#7a2230', '#2f5a58', '#344e78', '#5a4068', '#8a5a2a', '#4a6a3a', '#a8946e', '#6a2a3a', '#2a3e5a', '#3a3a44'],
}

// ── small builders ──
const mesh = (p, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); p.add(m); return m }
const box = (p, w, h, d, mat, x, y, z) => mesh(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z)
const cyl = (p, r, h, mat, x, y, z, seg = 20) => mesh(p, new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z)
const ball = (p, r, mat, x, y, z) => mesh(p, new THREE.SphereGeometry(r, 16, 10), mat, x, y, z)
const lathe = (p, profile, mat, x = 0, y = 0, z = 0) => mesh(p, new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 32), mat, x, y, z)
const tube = (p, points, r, mat) => mesh(p, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a => V(...a))), 40, r, 8), mat)
const ring = (p, r, t, mat, x, y, z) => { const m = mesh(p, new THREE.TorusGeometry(r, t, 8, 40), mat, x, y, z); m.rotation.x = Math.PI / 2; return m }
function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 } }
function texture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter
  return t
}
const ruled = (rows, extra) => texture(128, 160, (g, w, h) => {
  g.fillStyle = C.paper; g.fillRect(0, 0, w, h); g.fillStyle = '#9c8c70'
  for (let i = 0; i < rows; i++) g.fillRect(16, 22 + i * 16, 96 - (i * 29) % 44, 5)
  extra?.(g, w, h)
})

export function candelabra() {
  const g = new THREE.Group(), brass = toon(C.brass), wax = toon(C.wax), wick = toon(C.black)
  lathe(g, [[0, 0], [5, 0], [5.2, .35], [4.4, .8], [2.4, 1.3], [1.1, 2.2], [.9, 3]], brass)
  cyl(g, .5, 12.6, brass, 0, 9.2, 0)
  for (const y of [4, 7, 10]) ball(g, .95, brass, 0, y, 0)
  for (const s of [-1, 1]) tube(g, [[0, 10.8, 0], [s * 2.2, 10.4, 0], [s * 3.9, 11.6, 0], [s * 4.1, 13.6, 0]], .32, brass)
  const anchors = {}
  for (const [x, top, name] of [[-4.1, 14, 'left'], [0, 15.4, 'centre'], [4.1, 14, 'right']]) {
    lathe(g, [[0, 0], [1.4, 0], [1.5, .3], [.7, .45]], brass, x, top - .45, 0)
    const h = x ? 3.6 : 4.4
    cyl(g, .62, h, wax, x, top + h / 2, 0)
    ball(g, .26, wax, x + .5, top + h - .9, .35)
    cyl(g, .07, .5, wick, x, top + h + .25, 0, 6)
    anchors[name] = V(x, top + h + .55, 0)
  }
  return { root: g, anchors }
}

export function wallSconce() {
  const g = new THREE.Group(), wood = toon(C.wood), dark = toon(C.woodDark), brass = toon(C.brass), wax = toon(C.wax)
  box(g, 7, .45, 2.2, wood, 0, 0, 0)
  for (const x of [-2.4, 2.4]) { const b = box(g, .45, 1.6, 1.2, dark, x, -.9, -.4); b.rotation.x = .15 }
  lathe(g, [[0, 0], [1.3, 0], [1.4, .25], [.7, .4], [.5, .9], [.8, 1.1]], brass, 0, .22, 0)
  cyl(g, .6, 3.4, wax, 0, 3, 0)
  ball(g, .24, wax, .5, 3.9, .35)
  cyl(g, .07, .5, toon(C.black), 0, 4.95, 0, 6)
  return { root: g, anchors: { flame: V(0, 5.3, 0) } }
}

export function teacup() {
  const g = new THREE.Group(), por = toon(C.porcelain, { side: THREE.DoubleSide }), gold = toon(C.gold)
  lathe(g, [[0, 0], [4.6, 0], [5.1, .35], [4.8, .55], [1.8, .35], [0, .35]], por)
  ring(g, 4.95, .1, gold, 0, .47, 0)
  lathe(g, [[0, .35], [1.4, .35], [1.5, .6], [2.4, 1.3], [3.1, 2.6], [3.3, 3.5], [3.1, 3.5], [2.9, 2.7], [2.2, 1.5], [0, 1.4]], por)
  cyl(g, 3.02, .05, toon(C.tea), 0, 3.15, 0, 32)
  ring(g, 3.22, .11, gold, 0, 3.5, 0)
  ring(g, 2.86, .07, gold, 0, 1.95, 0)
  const handle = mesh(g, new THREE.TorusGeometry(.95, .26, 8, 20, Math.PI * 1.25), por, 3.45, 2.3, 0)
  handle.rotation.z = -Math.PI * .62
  const red = toon(C.seal), leaf = toon(C.leaf)
  for (const [dx, dy] of [[0, 0], [.35, .2], [-.3, .25], [.1, .45]]) ball(g, .26, red, dx, 2.45 + dy, 3.02)
  for (const s of [-1, 1]) ball(g, .2, leaf, s * .6, 2.2, 2.98)
  return { root: g, anchors: { steam: V(0, 3.6, 0) } }
}

export function inkAndQuill() {
  const g = new THREE.Group()
  lathe(g, [[0, 0], [1.7, 0], [1.9, .2], [1.9, 2.2], [1.3, 2.9], [.85, 3.1], [.85, 3.6], [1, 3.75], [0, 3.75]], toon(C.glass))
  ring(g, .92, .12, toon(C.brass), 0, 3.65, 0)
  box(g, .12, 1.6, .05, toon('#4a5a78'), -1.2, 1.3, 1.6).rotation.y = .5 // glint
  const q = new THREE.Group(); q.position.set(.1, 3.3, 0); q.rotation.set(0, .5, -.4); g.add(q)
  cyl(q, .08, 11, toon(C.shaft), 0, 5, 0, 8)
  const vane = new THREE.Shape(); vane.moveTo(0, 1.8); vane.quadraticCurveTo(1.3, 5.5, .1, 11); vane.lineTo(-.1, 11); vane.quadraticCurveTo(-.95, 6.5, -.05, 2.2)
  mesh(q, new THREE.ShapeGeometry(vane, 12), toon(C.feather, { side: THREE.DoubleSide }))
  return { root: g }
}

export function inTray() {
  const g = new THREE.Group(), wood = toon(C.wood), dark = toon(C.woodDark), brass = toon(C.brass)
  box(g, 10, .3, 6.6, dark, 0, .15, 0)
  for (const x of [-5, 5]) box(g, .3, 1.5, 6.6, wood, x, .75, 0)
  box(g, 10.3, 1.6, .3, wood, 0, .8, -3.2)
  box(g, 10.3, 1.0, .3, wood, 0, .5, 3.2)
  box(g, 2.2, .45, .06, brass, 0, .55, 3.37)
  const rand = seeded(7), sheets = []
  for (let i = 0; i < 10; i++) {
    const s = box(g, 8.6, .13, 6, toon(i % 2 ? C.paper2 : C.paper), (rand() - .5) * .5, .38 + i * .17, (rand() - .5) * .3)
    s.rotation.y = (rand() - .5) * .07; sheets.push(s)
  }
  const top = new THREE.Group(); g.add(top)
  const face = mesh(top, new THREE.PlaneGeometry(8.2, 5.6), toonFromMap(ruled(7)), 0, .07, 0); face.rotation.x = -Math.PI / 2
  cyl(top, .45, .1, toon(C.seal), 2.6, .12, 1.4, 16)
  const frames = Array.from({ length: 11 }, (_, n) => () => {
    sheets.forEach((s, i) => { s.visible = i < n })
    top.visible = n > 0
    if (n) top.position.set(sheets[n - 1].position.x, sheets[n - 1].position.y, sheets[n - 1].position.z)
  })
  return { root: g, frames }
}

export function journal() {
  const g = new THREE.Group()
  box(g, 12.6, .25, 8.4, toon(C.cover), 0, .12, 0)
  const bat = (c) => { c.fillStyle = '#15121a'; c.beginPath(); c.moveTo(70, 118); c.lineTo(86, 110); c.lineTo(94, 118); c.lineTo(102, 110); c.lineTo(118, 118); c.lineTo(94, 126); c.fill() }
  for (const s of [-1, 1]) {
    box(g, 5.9, .55, 7.8, toon(C.paper2), s * 3.05, .5, 0)
    const geo = new THREE.PlaneGeometry(5.9, 7.8, 24, 1); geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const fromSpine = s > 0 ? pos.getX(i) + 2.95 : 2.95 - pos.getX(i)
      pos.setY(i, .8 + .45 * Math.exp(-fromSpine / 1.2) - .08 * fromSpine / 5.9)
    }
    geo.computeVertexNormals()
    mesh(g, geo, toonFromMap(ruled(8, s > 0 ? bat : undefined), { side: THREE.DoubleSide }), s * 3.05, 0, 0)
  }
  const red = toon(C.seal)
  box(g, .45, .05, 3.8, red, .25, 1.28, 2.1)
  box(g, .45, 1.6, .05, red, .25, .5, 4.02)
  return { root: g }
}

export function wallClock() {
  const g = new THREE.Group(), dark = toon(C.woodDark), wood = toon(C.wood), brass = toon(C.brass)
  const gothic = (s) => { const sh = new THREE.Shape(); sh.moveTo(-2.3 * s, 0); sh.lineTo(2.3 * s, 0); sh.lineTo(2.3 * s, 8); sh.lineTo(0, 8 + 2.4 * s); sh.lineTo(-2.3 * s, 8); sh.closePath(); return sh }
  mesh(g, new THREE.ExtrudeGeometry(gothic(1), { depth: 1.2, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2 }), dark, 0, 0, -.6)
  mesh(g, new THREE.ExtrudeGeometry(gothic(.86), { depth: .1, bevelEnabled: false }), wood, 0, .6, .62)
  tube(g, [[-2.3, .1, .72], [-2.3, 8, .72], [0, 10.35, .72], [2.3, 8, .72], [2.3, .1, .72]], .07, brass)
  const face = cyl(g, 1.55, .12, toon(C.face), 0, 7.2, .78, 32); face.rotation.x = Math.PI / 2
  const bezel = mesh(g, new THREE.TorusGeometry(1.6, .13, 8, 40), brass, 0, 7.2, .82); bezel.rotation.z = 0
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; box(g, .1, k % 3 ? .18 : .32, .03, toon(C.black), Math.sin(a) * 1.25, 7.2 + Math.cos(a) * 1.25, .86).rotation.z = -a }
  box(g, .1, 1.1, .04, toon(C.black), 0, 7.72, .9)
  const hand = box(g, .85, .1, .04, toon(C.black), .38, 7.05, .9); hand.rotation.z = -.35
  box(g, 2.7, 4.3, .1, toon('#120e14'), 0, 3.1, .62)
  const pendulum = new THREE.Group(); pendulum.position.set(0, 5.1, .72); g.add(pendulum)
  cyl(pendulum, .05, 3.3, brass, 0, -1.65, 0, 8)
  const disc = cyl(pendulum, .58, .09, brass, 0, -3.4, 0, 24); disc.rotation.x = Math.PI / 2
  ball(g, .32, brass, 0, 10.75, 0)
  box(g, 5.3, .4, 1.5, wood, 0, -.2, 0)
  const frames = [-.28, -.14, 0, .14, .28].map(a => () => { pendulum.rotation.z = a })
  return { root: g, frames }
}

export function letterRack() {
  const g = new THREE.Group(), dark = toon(C.woodDark), wood = toon(C.wood), brass = toon(C.brass)
  box(g, 10.4, 8.6, .4, dark, 0, 4.3, -.5)
  const roof = new THREE.Shape(); roof.moveTo(-5.6, 0); roof.lineTo(0, 1.7); roof.lineTo(5.6, 0); roof.closePath()
  mesh(g, new THREE.ExtrudeGeometry(roof, { depth: 1.6, bevelEnabled: false }), wood, 0, 8.6, -.7)
  for (const x of [-5.1, 5.1]) box(g, .35, 8.8, 1.6, wood, x, 4.3, .1)
  for (const y of [.15, 4.3, 8.45]) box(g, 10.5, .3, 1.6, wood, 0, y, .1)
  for (const x of [-1.73, 1.73]) box(g, .25, 8.2, 1.5, wood, x, 4.3, .1)
  const counts = [1, 2, 3, 2, 1, 3], rand = seeded(11)
  counts.forEach((n, cell) => {
    const cx = -3.45 + (cell % 3) * 3.45, cy = cell < 3 ? 4.6 : .45
    for (let k = 0; k < n; k++) {
      const env = new THREE.Group(); env.position.set(cx + (k - (n - 1) / 2) * .25, cy + .15 + k * .15, -.2 + k * .25); env.rotation.set(-.22, (rand() - .5) * .2, (rand() - .5) * .12); g.add(env)
      box(env, 2.6, 1.9, .05, toon(k % 2 ? C.paper2 : C.paper), 0, .95, 0)
      const flap = new THREE.Shape(); flap.moveTo(-1.3, 1.9); flap.lineTo(0, 1.0); flap.lineTo(1.3, 1.9); flap.closePath()
      mesh(env, new THREE.ShapeGeometry(flap), toon(C.paper2, { side: THREE.DoubleSide }), 0, 0, .03)
      if ((cell + k) % 2 === 0) { const s = cyl(env, .22, .06, toon(C.seal), 0, 1.05, .06, 12); s.rotation.x = Math.PI / 2 }
    }
  })
  box(g, 2.3, .5, .06, brass, 0, .5, .92)
  return { root: g }
}

function leaf(len, width, bend) {
  const rows = 12, pos = [], idx = []
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, y = t * len, z = bend * t * t * len, w = width * Math.sin(Math.PI * Math.min(1, t * 1.08)) * (1 - t * .25)
    pos.push(-w / 2, y, z, 0, y, z + width * .12, w / 2, y, z)
    if (i) { const a = (i - 1) * 3, b = i * 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2) }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals()
  return geo
}
export function pottedPlant() {
  const g = new THREE.Group()
  lathe(g, [[0, 0], [2.2, 0], [2.7, 3.3], [3.1, 3.4], [3.1, 4.0], [2.8, 4.1], [0, 4.1]], toon(C.terracotta))
  ring(g, 2.95, .12, toon(C.terracottaDark), 0, 3.35, 0)
  cyl(g, 2.75, .1, toon(C.soil), 0, 3.95, 0, 28)
  const rand = seeded(5), green = [toon(C.leaf, { side: THREE.DoubleSide }), toon(C.leafLight, { side: THREE.DoubleSide })]
  for (let i = 0; i < 11; i++) {
    const l = mesh(g, leaf(5 + rand() * 4, .9 + rand() * .4, .35 + rand() * .3), green[i % 2], (rand() - .5) * 1.2, 3.9, (rand() - .5) * 1.2)
    l.rotation.set(-(.55 + rand() * .6), i / 11 * Math.PI * 2 + rand() * .4, 0, 'YXZ')
  }
  return { root: g }
}

/** Bookcase with rows of books, spine bands and the odd leaning or stacked volume. */
export function bookcase(width, shelves, seed) {
  const g = new THREE.Group(), dark = toon(C.woodDark), wood = toon(C.wood), light = toon(C.woodLight), gold = toon(C.gold), D = 2.6, shelfH = 4
  const H = shelves * shelfH + .3
  box(g, width, H, .15, toon('#241612'), 0, H / 2, -D / 2)
  for (const x of [-width / 2, width / 2]) box(g, .38, H + .2, D, wood, x, H / 2, 0)
  box(g, width + .7, .35, D + .45, light, 0, H + .3, .1); box(g, width + .4, .25, D + .25, wood, 0, H + .05, .05)
  box(g, width + .3, .55, D + .2, dark, 0, -.25, .05)
  const rand = seeded(seed), books = C.books
  for (let s = 0; s < shelves; s++) {
    const y0 = s * shelfH + .15
    box(g, width - .05, .22, D, wood, 0, y0, 0)
    let x = -width / 2 + .45
    while (x < width / 2 - .6) {
      const r = rand()
      if (r < .07 && x < width / 2 - 1.8) { // a lying stack
        for (let k = 0; k < 3; k++) box(g, 1.3 - k * .12, .32, D * .78, toon(books[(k + s * 3 + Math.floor(x)) % books.length]), x + .65, y0 + .27 + k * .33, 0)
        x += 1.5; continue
      }
      const w = .36 + rand() * .42, h = shelfH * (.6 + rand() * .3), col = toon(books[Math.floor(rand() * books.length)])
      const book = new THREE.Group(); book.position.set(x + w / 2, y0 + .11, 0); g.add(book)
      box(book, w, h, D * .8, col, 0, h / 2, 0)
      if (rand() < .55) { const inset = .3 + rand() * .35; for (const by of [h - inset, inset]) box(book, w + .02, .09, .03, gold, 0, by, D * .4 + .01) }
      if (rand() < .4) box(book, w * .6, .4, .03, toon(C.paper2), 0, h * .62, D * .4 + .01)
      if (r > .9) { book.rotation.z = -.22; x += .35 }
      x += w + .04
    }
  }
  return { root: g }
}

/** Desk under a red tablecloth: embroidered border, soft folds, gold band and a pointed hem. */
export function clothDesk() {
  const g = new THREE.Group(), W = 30, D = 4, drop = 2.9
  const top = texture(1024, 206, (c, w, h) => {
    c.fillStyle = C.cloth; c.fillRect(0, 0, w, h)
    c.strokeStyle = C.trim; c.lineWidth = 6; c.strokeRect(22, 22, w - 44, h - 44); c.lineWidth = 2; c.strokeRect(36, 36, w - 72, h - 72)
  })
  box(g, W, .25, D, [toon(C.cloth), toon(C.cloth), toonFromMap(top), toon(C.cloth), toon(C.cloth), toon(C.cloth)], 0, 0, 0)
  const skirt = texture(1024, 128, (c, w, h) => {
    c.fillStyle = C.cloth; c.fillRect(0, 0, w, h)
    c.fillStyle = C.trim; c.fillRect(0, 62, w, 5); c.fillRect(0, 92, w, 5)
    for (let x = 8; x < w; x += 24) { c.beginPath(); c.moveTo(x, 79); c.lineTo(x + 6, 72); c.lineTo(x + 12, 79); c.lineTo(x + 6, 86); c.fill() }
    c.clearRect(0, 106, w, h)
    for (let x = 0; x < w; x += 32) { c.fillStyle = '#56121a'; c.beginPath(); c.moveTo(x, 104); c.lineTo(x + 32, 104); c.lineTo(x + 16, 127); c.fill(); c.fillStyle = C.trim; c.fillRect(x + 15, 122, 2, 5) }
  })
  const drape = (width, rotY, x, z) => {
    const geo = new THREE.PlaneGeometry(width, drop, Math.round(width * 6), 6), pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), t = (drop / 2 - pos.getY(i)) / drop; pos.setZ(i, (.18 * Math.sin(px * 1.3) + .05 * Math.sin(px * 3.1 + 1)) * (.25 + t)) }
    geo.computeVertexNormals()
    const m = mesh(g, geo, toonFromMap(skirt, { side: THREE.DoubleSide, alphaTest: .5, transparent: false }), x, -drop / 2, z); m.rotation.y = rotY
  }
  drape(W, 0, 0, D / 2 + .02)
  drape(D, Math.PI / 2, W / 2 + .02, 0); drape(D, -Math.PI / 2, -W / 2 - .02, 0)
  return { root: g, anchors: { back: V(-W / 2, .13, -D / 2), front: V(-W / 2, .13, D / 2) } }
}
