import { HEIGHT, INK as C, noise, Pixels, WIDTH } from './pixels'

export type RoomKind = 'desk' | 'office' | 'shelf' | 'authors' | 'study' | 'stats'
export interface RoomState { submitted: number; working: number; hasCat: boolean; books: number; authors: number; departments: number }
export const EMPTY_ROOM: RoomState = { submitted: 0, working: 0, hasCat: false, books: 0, authors: 0, departments: 0 }
export const DESK_OBJECTS = [
  { key: 'solicit', label: '征稿信箱', x: 90, y: 80, w: 40, h: 59 },
  { key: 'submissions', label: '待审稿件', x: 103, y: 165, w: 48, h: 38 },
  { key: 'pipeline', label: '编辑流水线', x: 205, y: 163, w: 62, h: 40 },
  { key: 'log', label: '出版日志', x: 282, y: 184, w: 49, h: 20 },
  { key: 'dream', label: '梦境创作', x: 347, y: 183, w: 24, h: 22 },
  { key: 'cat', label: '黑猫', x: 384, y: 151, w: 61, h: 25 },
] as const

const BOOKS = [C.red, C.teal, C.bookBlue, C.plum, C.grain, C.leaf, C.paperShade]

function bookRow(p: Pixels, x: number, y: number, width: number, seed: number, count = 100) {
  let cursor = x
  for (let i = 0; i < count && cursor < x + width - 5; i++) {
    const w = 3 + Math.floor(noise(i, 1, seed) * 5)
    const h = 13 + Math.floor(noise(i, 2, seed) * 13)
    const col = BOOKS[Math.floor(noise(i, 3, seed) * BOOKS.length)]
    p.rect(cursor, y - h, w, h, col)
    p.rect(cursor, y - h, 1, h, C.shadow)
    p.rect(cursor + 1, y - h + 3, w - 2, 1, C.copper)
    if (w > 4) p.rect(cursor + 2, y - 5, w - 3, 1, C.paperShade)
    if (w > 5) {
      p.rect(cursor + 2, y - h + 7, w - 4, 5, C.paperShade)
      p.rect(cursor + 3, y - h + 8, 1, 3, col)
    }
    cursor += w + 1
  }
}

function shelf(p: Pixels, x: number, y: number, w: number, h: number, seed: number, count = 100) {
  p.rect(x - 3, y - 3, w + 6, h + 7, C.black)
  p.rect(x, y, w, h, C.darkWood)
  p.rect(x + 3, y + 3, w - 6, h - 6, C.shadow)
  const rows = Math.floor(h / 34)
  for (let i = 0; i < rows; i++) {
    const bottom = y + (i + 1) * 34 - 3
    bookRow(p, x + 5, bottom, w - 10, seed + i * 7, Math.max(0, count - i * Math.floor(w / 7)))
    p.rect(x, bottom, w, 4, C.warmWood)
    p.rect(x, bottom, w, 1, C.copper)
    p.rect(x + 2, bottom + 4, w - 4, 2, C.black)
  }
  p.rect(x, y, 3, h, C.grain); p.rect(x + w - 3, y, 3, h, C.wood)
  p.rect(x - 3, y - 5, w + 6, 4, C.grain)
  p.rect(x - 3, y - 5, w + 6, 1, C.copper)
}

function plant(p: Pixels, x: number, y: number, length: number, seed: number) {
  for (let k = 0; k < length; k += 4) {
    const sway = Math.round(Math.sin(k / 12 + seed) * 3)
    p.line(x + sway, y + k, x + sway + 1, y + k + 4, C.green)
    const side = k % 8 ? 1 : -1
    p.polygon([[x + sway, y + k], [x + sway + side * 7, y + k - 2], [x + sway + side * 5, y + k + 3]], C.leaf)
    p.line(x + sway + side, y + k, x + sway + side * 4, y + k, C.leafLight)
  }
}

function rug(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x, y, w, h, C.redDark)
  for (let i = 1; i < 7; i += 2) p.frame(x + i, y + i, w - i * 2, h - i * 2, i === 3 ? C.copper : C.rose)
  for (let yy = y + 10; yy < y + h - 8; yy += 9) for (let xx = x + 14; xx < x + w - 12; xx += 16) {
    p.polygon([[xx, yy - 3], [xx + 4, yy], [xx, yy + 3], [xx - 4, yy]], C.warmWood)
    p.dot(xx, yy, C.honey)
  }
}

function shell(p: Pixels) {
  p.rect(0, 0, WIDTH, HEIGHT, C.darkWood)
  p.rect(8, 13, 464, 193, C.wood)
  p.rect(12, 17, 456, 181, C.darkWood)
  p.texture(12, 17, 456, 181, C.wood, .025, 6)
  // Quiet wallpaper pattern, cut into two-tone pixel diamonds.
  for (let y = 28; y < 195; y += 12) for (let x = 16; x < 470; x += 10) {
    p.dot(x, y, C.wood); p.dot(x - 1, y + 1, C.wood); p.dot(x + 1, y + 1, C.wood); p.dot(x, y + 2, C.wood)
  }
  p.rect(0, 0, WIDTH, 12, C.black)
  p.rect(0, 13, WIDTH, 2, C.grain)
  for (let x = -100; x < 550; x += 90) {
    p.polygon([[x, 0], [x + 10, 0], [x + 84, 44], [x + 80, 48]], C.warmWood)
    p.line(x + 10, 0, x + 84, 44, C.copper)
  }
  p.rect(0, 201, WIDTH, 69, C.wood)
  for (let y = 205; y < HEIGHT; y += 9) {
    p.rect(0, y, WIDTH, 1, C.black)
    p.rect(0, y + 1, WIDTH, 1, C.warmWood)
    for (let x = (y % 4) * 20; x < WIDTH; x += 65) p.rect(x, y + 1, 1, 8, C.darkWood)
  }
  p.rect(0, 198, WIDTH, 4, C.black)
  p.rect(0, 198, WIDTH, 1, C.grain)
  for (let x = 12; x < WIDTH; x += 31) {
    p.rect(x, 170, 2, 27, C.wood)
    p.frame(x + 4, 175, 21, 18, C.wood)
  }
}

function cityWindow(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x - 7, y - 7, w + 14, h + 18, C.black)
  p.rect(x - 5, y - 5, w + 10, h + 12, C.grain)
  p.rect(x - 2, y - 2, w + 4, h + 4, C.copper)
  p.rect(x, y, w, h, C.sky)
  p.rect(x, y + Math.floor(h * .35), w, Math.ceil(h * .65), C.blue)
  for (let xx = 0; xx < w; xx++) {
    const cloudY = y + 25 + Math.round(Math.sin(xx / 23) * 5 + Math.sin(xx / 7) * 2)
    for (let yy = cloudY; yy < cloudY + 9; yy++) if (noise(xx, yy, 8) < .35) p.dot(x + xx, yy, C.blue)
  }
  for (let i = 0; i < 80; i++) {
    const xx = x + Math.floor(noise(i, 1) * w), yy = y + Math.floor(noise(i, 2) * h * .6)
    if (i % 7 === 0) p.dot(xx, yy, C.blueLight)
  }
  p.ellipse(x + w - 29, y + 21, 8, 8, C.blueLight)
  p.ellipse(x + w - 29, y + 20, 6, 6, C.moon)
  p.ellipse(x + w - 32, y + 17, 3, 2, C.steel)
  // Three skyline depths, mansard roofs and sparse inhabited windows.
  for (let layer = 0; layer < 3; layer++) {
    const step = layer ? 29 : 16
    for (let xx = x; xx < x + w; xx += step) {
      const top = y + Math.floor(h * (.45 + layer * .16)) - Math.floor(noise(xx, layer) * 17)
      const ww = Math.min(step - 1, x + w - xx)
      p.rect(xx, top + 5, ww, y + h - top - 5, layer === 0 ? C.haze : layer === 1 ? C.stone : C.roof)
      p.polygon([[xx, top + 6], [xx + 5, top], [xx + ww - 4, top], [xx + ww, top + 6]], layer === 2 ? C.black : C.roof)
      p.rect(xx + 7, top - 3, 3, 5, C.roof)
      for (let wy = top + 10; wy < y + h - 3; wy += 9) for (let wx = xx + 4; wx < xx + ww - 3; wx += 7) {
        const lit = noise(wx, wy, layer) > .69
        p.rect(wx, wy, 2, 3, lit ? C.honey : layer === 2 ? C.stone : C.blueLight)
        if (lit) p.dot(wx, wy + 1, C.cream)
      }
      p.line(xx, top + 6, xx + ww - 1, top + 6, C.blueLight)
      if (layer > 0) {
        for (let yy = top + 8; yy < y + h; yy += 4) p.rect(xx + ww - 2, yy, 1, 2, C.stoneLight)
        for (let k = 0; k < 3; k++) p.line(xx + 3 + k * 5, top + 5, xx + 5 + k * 5, top + 2, C.stone)
      }
    }
  }
  // Publisher's neighbourhood clock tower, designed on this pixel grid.
  const tx = x + Math.floor(w * .62), ty = y + Math.floor(h * .26)
  p.rect(tx - 6, ty + 15, 13, h - (ty - y) - 15, C.roof)
  p.rect(tx - 4, ty + 14, 3, h - (ty - y) - 14, C.stone)
  p.polygon([[tx - 9, ty + 17], [tx, ty], [tx + 9, ty + 17]], C.black)
  p.line(tx, ty - 6, tx, ty, C.roof)
  p.ellipse(tx, ty + 24, 4, 4, C.honey)
  p.ellipse(tx, ty + 24, 3, 3, C.warmWood)
  p.line(tx, ty + 21, tx, ty + 24, C.cream); p.line(tx, ty + 24, tx + 2, ty + 25, C.cream)
  for (const xx of [x, x + Math.floor(w / 3), x + Math.floor(w * 2 / 3), x + w - 2]) {
    p.rect(xx, y, 3, h, C.warmWood); p.rect(xx, y, 1, h, C.honey)
  }
  p.rect(x, y + Math.floor(h / 2), w, 4, C.darkWood)
  p.rect(x, y + Math.floor(h / 2), w, 1, C.honey)
  p.rect(x - 7, y + h + 3, w + 14, 5, C.warmWood)
  p.rect(x - 7, y + h + 3, w + 14, 1, C.honey)
  p.line(x - 4, y - 4, x + w + 3, y - 4, C.paperShade)
}

function curtain(p: Pixels, x: number, y: number, w: number, h: number) {
  for (let i = 0; i < w; i++) {
    const length = h - Math.round(Math.sin(i / w * Math.PI) * h * .38)
    p.rect(x + i, y, 1, length, [C.redDark, C.red, C.rose, C.red][Math.floor(i / 4) % 4])
  }
  p.line(x + 2, y + h - 12, x + w - 2, y + h - 20, C.gold)
}

function candle(p: Pixels, x: number, y: number) {
  p.ellipse(x, y + 14, 8, 2, C.black)
  p.rect(x - 6, y + 11, 12, 2, C.copper)
  p.rect(x - 2, y, 5, 11, C.paperShade); p.rect(x - 2, y, 2, 10, C.cream)
  p.rect(x, y - 5, 2, 4, C.honey); p.dot(x, y - 6, C.gold); p.dot(x, y - 2, C.cream)
}

function desk(p: Pixels, x: number, y: number, w: number) {
  p.rect(x + 6, y + 5, w - 12, 43, C.black)
  for (const xx of [x + 7, x + w - 65]) {
    p.rect(xx, y + 8, 58, 37, C.darkWood)
    p.frame(xx + 3, y + 11, 51, 13, C.grain)
    p.frame(xx + 3, y + 27, 51, 14, C.warmWood)
    p.rect(xx + 25, y + 16, 8, 3, C.black); p.rect(xx + 26, y + 16, 6, 1, C.honey)
    p.rect(xx + 25, y + 32, 8, 3, C.black); p.rect(xx + 26, y + 32, 6, 1, C.copper)
  }
  p.polygon([[x + 13, y - 13], [x + w - 13, y - 13], [x + w, y + 4], [x, y + 4]], C.warmWood)
  for (let yy = y - 10; yy < y + 4; yy += 3) p.line(x + 13, yy, x + w - 13, yy, yy % 2 ? C.grain : C.wood)
  for (let k = 0; k < 55; k++) {
    const xx = x + 14 + Math.floor(noise(k, 9) * (w - 34)), yy = y - 10 + Math.floor(noise(k, 10) * 12)
    p.rect(xx, yy, 2 + Math.floor(noise(k, 11) * 7), 1, k % 3 ? C.warmWood : C.copper)
  }
  p.rect(x, y + 4, w, 5, C.darkWood); p.rect(x, y + 3, w, 2, C.copper)
  for (const xx of [x + 4, x + w - 9]) { p.rect(xx, y + 9, 5, 45, C.warmWood); p.rect(xx, y + 9, 1, 43, C.copper) }
}

function journal(p: Pixels, x: number, y: number) {
  p.polygon([[x + 6, y], [x + 24, y + 2], [x + 41, y], [x + 48, y + 15], [x + 24, y + 18], [x, y + 15]], C.redDark)
  p.polygon([[x + 6, y], [x + 23, y + 2], [x + 23, y + 15], [x + 3, y + 12]], C.paper)
  p.polygon([[x + 25, y + 2], [x + 41, y], [x + 45, y + 12], [x + 25, y + 15]], C.cream)
  for (let i = 0; i < 4; i++) { p.line(x + 9, y + 3 + i * 2, x + 20, y + 4 + i * 2, C.paperShade); p.line(x + 28, y + 4 + i * 2, x + 39, y + 3 + i * 2, C.paperShade) }
  p.line(x + 24, y + 2, x + 24, y + 17, C.rose)
}

function lamp(p: Pixels, x: number, y: number) {
  p.ellipse(x + 8, y + 37, 12, 3, C.black); p.ellipse(x + 8, y + 35, 10, 2, C.copper)
  p.rect(x + 7, y + 2, 3, 32, C.copper); p.rect(x + 7, y + 4, 1, 27, C.gold)
  p.line(x + 8, y + 3, x - 2, y - 6, C.honey)
  p.polygon([[x - 18, y - 9], [x + 3, y - 9], [x + 9, y + 3], [x - 24, y + 3]], C.greenDark)
  p.polygon([[x - 17, y - 8], [x + 1, y - 8], [x + 6, y], [x - 21, y]], C.green)
  p.line(x - 17, y - 7, x, y - 7, C.leafLight)
  p.rect(x - 22, y + 3, 29, 2, C.honey); p.rect(x - 15, y + 4, 16, 1, C.cream)
}

function teacup(p: Pixels, x: number, y: number) {
  p.ellipse(x + 8, y + 14, 12, 2, C.paperShade)
  p.ellipse(x + 8, y + 13, 10, 2, C.cream)
  p.frame(x + 14, y + 3, 6, 6, C.paper)
  p.rect(x + 1, y + 2, 14, 8, C.paper); p.rect(x + 3, y + 10, 10, 2, C.paperShade)
  p.rect(x + 2, y + 2, 12, 2, C.redDark); p.rect(x + 3, y, 10, 2, C.cream)
  p.rect(x + 5, y + 6, 3, 3, C.rose)
}

function inbox(p: Pixels, count: number) {
  p.rect(102, 194, 49, 9, C.darkWood); p.rect(103, 192, 47, 2, C.copper)
  const pages = Math.min(10, Math.max(0, count))
  for (let i = 0; i < pages; i++) {
    const x = 107 + (i % 3), y = 192 - i * 2
    p.rect(x, y, 37, 2, i % 2 ? C.paper : C.paperShade)
    p.rect(x + 1, y, 35, 1, C.cream)
  }
  p.rect(104, 197, 46, 5, C.warmWood)
  p.rect(122, 198, 12, 2, C.gold); p.rect(125, 198, 6, 1, C.black)
}

function typewriter(p: Pixels, x: number, y: number, working: boolean, tick = 0) {
  p.ellipse(x + 29, y + 36, 33, 4, C.black)
  p.rect(x + 13, y + 1, 34, 19, C.paperShade)
  p.rect(x + 14, y, 32, 16, C.paper)
  for (let i = 0; i < 4; i++) p.rect(x + 18, y + 4 + i * 3, 18 - i * 3, 1, C.paperShade)
  const shift = working ? Math.floor(tick / 6) % 4 : 0
  p.rect(x + 3 + shift, y + 15, 54, 4, C.black)
  p.rect(x + 4 + shift, y + 15, 51, 1, C.steel)
  p.rect(x, y + 15, 3, 6, C.slate); p.rect(x + 58, y + 15, 3, 6, C.metal)
  p.polygon([[x + 7, y + 19], [x + 52, y + 19], [x + 60, y + 34], [x, y + 34]], C.slate)
  p.polygon([[x + 8, y + 20], [x + 51, y + 20], [x + 55, y + 31], [x + 4, y + 31]], C.black)
  for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) {
    p.rect(x + 8 + k * 5 - row, y + 23 + row * 3, 3, 2, working && (tick + row) % 9 === k ? C.copper : C.paper)
  }
  p.rect(x + 17, y + 33, 28, 2, C.metal); p.rect(x, y + 35, 60, 3, C.shadow)
  p.rect(x + 26, y + 20, 9, 1, C.copper)
  p.line(x + 9, y + 19, x + 19, y + 22, C.metal)
  p.line(x + 42, y + 22, x + 51, y + 19, C.metal)
  p.rect(x + 27, y + 17, 8, 2, C.red)
}

function cat(p: Pixels, tick: number) {
  const breath = Math.floor(tick / 18) % 2
  p.ellipse(411, 169, 26, 4, C.redDark)
  p.ellipse(413, 161 - breath, 18, 8, C.black)
  p.ellipse(414, 158 - breath, 14, 5, C.shadow)
  p.ellipse(431, 163, 8, 7, C.black)
  p.polygon([[424, 162], [425, 153], [430, 158]], C.black)
  p.polygon([[432, 158], [438, 153], [438, 164]], C.black)
  p.line(425, 163, 428, 164, C.paperShade); p.line(433, 164, 436, 163, C.paperShade)
  p.rect(430, 167, 2, 1, C.rose)
  p.line(393, 165, 389, 161 + breath, C.shadow)
  p.line(389, 161 + breath, 390, 158 + breath, C.shadow)
}

function deskRoom(p: Pixels, state: RoomState, includeLiveObjects: boolean) {
  shell(p)
  cityWindow(p, 147, 29, 199, 123)
  shelf(p, 10, 40, 58, 168, 11)
  p.rect(88, 78, 44, 64, C.black); p.rect(91, 81, 38, 58, C.grain)
  p.texture(94, 84, 32, 51, C.warmWood, .18, 6)
  for (let i = 0; i < 3; i++) {
    const xx = 96 + i % 2 * 3, yy = 87 + i * 16
    p.rect(xx, yy, 23, 13, C.paperShade); p.polygon([[xx, yy], [xx + 12, yy + 8], [xx + 23, yy]], C.paper)
    p.rect(xx + 11, yy + 7, 3, 3, C.red)
  }
  plant(p, 77, 20, 103, 2); plant(p, 358, 17, 96, 5)
  curtain(p, 445, 13, 32, 170)
  p.rect(386, 169, 67, 12, C.warmWood); p.rect(390, 175, 5, 34, C.black); p.rect(444, 175, 5, 34, C.black)
  p.rect(385, 169, 69, 5, C.red); p.frame(386, 168, 67, 7, C.rose)
  p.rect(417, 135, 31, 33, C.redDark); p.frame(419, 137, 27, 28, C.rose)
  p.polygon([[430, 142], [439, 151], [430, 161], [422, 151]], C.warmWood)
  p.rect(380, 123, 50, 4, C.grain); bookRow(p, 399, 123, 29, 8, 3); candle(p, 388, 109)
  rug(p, 81, 230, 340, 39)
  desk(p, 83, 199, 304)
  // Discrete amber pools on wood; all pixels remain in the fixed palette.
  p.glow(321, 195, 41, 8, C.honey, .34)
  p.rect(168, 184, 10, 15, C.black); p.rect(169, 184, 8, 2, C.gold)
  p.line(174, 184, 177, 164, C.copper); p.line(174, 184, 169, 169, C.paperShade)
  p.rect(184, 191, 7, 8, C.greenDark); p.rect(185, 188, 5, 4, C.gold)
  journal(p, 282, 184); teacup(p, 349, 186); lamp(p, 328, 158)
  candle(p, 79, 131)
  if (includeLiveObjects) {
    inbox(p, state.submitted)
    typewriter(p, 205, 165, state.working > 0)
    if (state.hasCat) cat(p, 0)
  }
  portrait(p, 378, 40, 34, 46, 2)
  // An editor's seal, closed reference volumes and brass corner pieces.
  p.rect(151, 193, 13, 5, C.redDark); p.rect(151, 192, 13, 1, C.gold)
  p.rect(267, 196, 11, 3, C.darkWood); p.rect(270, 190, 5, 6, C.copper)
  for (const xx of [89, 374]) p.rect(xx, 204, 6, 2, C.honey)
}

const lighting = new Map<RoomKind, Uint8Array>()
function lightMask(room: RoomKind) {
  const cached = lighting.get(room)
  if (cached) return cached
  const mask = new Uint8Array(WIDTH * HEIGHT)
  const source = room === 'desk' ? [318, 188] : room === 'study' ? [240, 127] : room === 'shelf' ? [260, 181] : [240, 186]
  const windowRect = room === 'desk' ? [147, 29, 199, 123] : room === 'shelf' ? [25, 43, 64, 65] : room === 'study' ? [27, 39, 116, 88] : room === 'office' ? [178, 28, 127, 50] : null
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const pool = Math.max(0, 1 - Math.hypot((x - source[0]) / 135, (y - source[1]) / 110))
    const edge = Math.max(0, (Math.abs(x - 240) - 125) / 180) + Math.max(0, (y - 226) / 140)
    let value = Math.max(0, Math.min(4, 1.65 + pool * 2.3 - edge))
    if (windowRect && x >= windowRect[0] && x < windowRect[0] + windowRect[2] && y >= windowRect[1] && y < windowRect[1] + windowRect[3]) value = 2
    const level = Math.floor(value)
    const threshold = [0, .5, .75, .25][(y & 1) * 2 + (x & 1)]
    const fraction = value - level
    // Restrict dithering to the narrow transition between discrete light bands.
    mask[y * WIDTH + x] = Math.min(4, level + (fraction < .43 ? 0 : fraction > .57 ? 1 : (fraction - .43) / .14 > threshold ? 1 : 0))
  }
  lighting.set(room, mask)
  return mask
}

function portrait(p: Pixels, x: number, y: number, w: number, h: number, seed: number, occupied = true) {
  p.rect(x - 3, y - 3, w + 6, h + 6, C.black)
  p.rect(x - 2, y - 2, w + 4, h + 4, C.copper)
  p.rect(x, y, w, h, C.redDark)
  p.frame(x + 2, y + 2, w - 4, h - 4, C.grain)
  if (occupied) {
    const cx = x + Math.floor(w / 2)
    p.ellipse(cx, y + h - 9, Math.floor(w / 3), 12, BOOKS[seed % BOOKS.length])
    p.ellipse(cx, y + 15, 8, 10, C.paperShade)
    p.ellipse(cx, y + 10, 9, 5, C.shadow)
    p.rect(cx - 5, y + 16, 2, 1, C.black); p.rect(cx + 3, y + 16, 2, 1, C.black)
    p.polygon([[cx - 6, y + 25], [cx, y + 31], [cx + 6, y + 25]], C.paper)
  }
}

function fireplace(p: Pixels, x: number, y: number) {
  p.rect(x - 7, y - 6, 98, 5, C.copper)
  p.rect(x - 3, y, 90, 85, C.warmWood)
  p.rect(x + 11, y + 20, 62, 60, C.black)
  p.polygon([[x + 11, y + 23], [x + 23, y + 11], [x + 62, y + 11], [x + 73, y + 23]], C.black)
  for (let yy = y; yy < y + 85; yy += 9) {
    p.line(x - 2, yy, x + 9, yy, C.grain); p.line(x + 74, yy, x + 85, yy, C.grain)
  }
  p.rect(x - 10, y + 81, 104, 6, C.darkWood); p.rect(x - 10, y + 81, 104, 1, C.copper)
}

/** Deep reading hall: stone vault, distant stacks, side window and shared table. */
function libraryRoom(p: Pixels, state: RoomState) {
  p.rect(0, 0, WIDTH, HEIGHT, C.shadow)
  p.polygon([[0, 0], [110, 24], [110, 168], [0, 235]], C.darkWood)
  p.rect(110, 24, 334, 145, C.wood)
  p.polygon([[444, 24], [480, 0], [480, 238], [444, 169]], C.darkWood)
  p.texture(110, 26, 330, 138, C.darkWood, .1, 81)
  // The vaulted ceiling replaces the editor's low attic beams.
  for (const inset of [0, 7, 15]) {
    p.line(0, 32 + inset, 110, 24 + inset, C.grain)
    p.line(110, 24 + inset, 178, 8 + inset, C.grain)
    p.line(178, 8 + inset, 366, 8 + inset, C.grain)
    p.line(366, 8 + inset, 444, 24 + inset, C.grain)
    p.line(444, 24 + inset, 480, 34 + inset, C.grain)
  }
  p.polygon([[110, 168], [444, 168], [480, 235], [480, 270], [0, 270], [0, 235]], C.warmWood)
  for (let x = -240; x < 820; x += 66) {
    p.line(245 + (x - 245) * .18, 168, x, 270, C.darkWood)
  }
  for (const y of [174, 184, 198, 218, 246, 269]) {
    p.line(0, y, WIDTH, y, C.darkWood)
    p.line(0, y + 1, WIDTH, y + 1, C.grain)
  }
  // Narrow aisle leads past the table into the far archive.
  p.polygon([[211, 163], [267, 163], [204, 270], [106, 270]], C.redDark)
  p.line(214, 168, 113, 270, C.copper); p.line(264, 168, 198, 270, C.copper)
  for (let y = 176; y < 270; y += 16) {
    const x = 239 - Math.round((y - 163) * .8)
    p.polygon([[x, y - 3], [x + 5, y], [x, y + 3], [x - 5, y]], C.grain)
  }
  // Arched passage with smaller stacks behind it establishes depth.
  p.ellipse(241, 64, 37, 36, C.grain)
  p.rect(204, 64, 74, 101, C.grain)
  p.ellipse(241, 65, 30, 29, C.black)
  p.rect(211, 65, 60, 100, C.black)
  shelf(p, 220, 72, 42, 78, 92)
  p.polygon([[214, 151], [269, 151], [269, 165], [211, 165]], C.darkWood)
  for (const x of [204, 274]) {
    p.rect(x, 69, 4, 96, C.copper)
    for (let y = 75; y < 163; y += 13) p.rect(x, y, 4, 1, C.darkWood)
  }
  shelf(p, 116, 43, 76, 118, 24)
  shelf(p, 291, 40, 148, 123, 64)
  // Low, lateral moonlight; no central picture window.
  cityWindow(p, 25, 43, 64, 65)
  p.rect(28, 120, 56, 4, C.copper)
  plant(p, 102, 36, 72, 8)
  // Brass rolling ladder against the far stacks.
  p.line(112, 49, 195, 49, C.metal)
  for (const x of [147, 161]) {
    p.line(x, 71, x - 22, 168, C.copper)
    p.line(x + 1, 71, x - 21, 168, C.honey)
    p.ellipse(x - 21, 169, 2, 2, C.black)
  }
  for (let y = 82; y < 164; y += 11) {
    const x = 147 - Math.round((y - 71) * 22 / 97)
    p.line(x, y, x + 14, y, C.honey)
    p.line(x, y + 1, x + 14, y + 1, C.warmWood)
  }
  // Foreground stacks overlap the back wall and frame the aisle.
  p.polygon([[107, 123], [124, 114], [124, 228], [107, 250]], C.black)
  shelf(p, 9, 128, 99, 123, 41)
  p.polygon([[382, 107], [405, 91], [405, 261], [382, 227]], C.black)
  shelf(p, 404, 93, 72, 170, 74)
  // Chairs sit on both long sides of a shared reading table.
  for (const [x, y] of [[210, 170], [184, 204], [307, 172], [330, 210]]) {
    p.rect(x, y, 19, 24, C.darkWood)
    p.frame(x + 2, y + 2, 15, 16, C.grain)
    p.rect(x - 1, y + 23, 22, 5, C.red)
    p.rect(x + 1, y + 28, 3, 15, C.black)
    p.rect(x + 16, y + 28, 3, 15, C.black)
  }
  p.polygon([[219, 170], [301, 170], [353, 241], [185, 241]], C.black)
  for (const x of [193, 337]) {
    p.rect(x, 238, 7, 30, C.darkWood)
    p.rect(x, 242, 2, 25, C.copper)
  }
  p.polygon([[219, 170], [301, 170], [353, 237], [185, 237]], C.grain)
  p.line(186, 237, 352, 237, C.honey)
  for (let i = 1; i < 5; i++) p.line(219 + i * 16, 171, 185 + i * 33, 236, C.warmWood)
  for (let i = 0; i < 38; i++) {
    const y = 177 + Math.floor(noise(i, 2, 80) * 55)
    const left = 219 - (y - 170) * .5, w = 82 + (y - 170) * 1.2
    p.rect(left + 4 + Math.floor(noise(i, 1, 80) * (w - 15)), y, 5, 1, C.copper)
  }
  journal(p, 231, 188); journal(p, 266, 217)
  teacup(p, 214, 217)
  // New releases occupy a separate display stand, empty until publication.
  p.rect(314, 154, 61, 29, C.darkWood)
  p.frame(317, 158, 55, 21, C.grain)
  p.rect(310, 150, 69, 5, C.copper)
  bookRow(p, 314, 150, 61, 77, Math.min(state.books, 12))
  p.rect(334, 163, 21, 7, C.paperShade)
  p.line(338, 166, 350, 166, C.warmWood)
  // Hanging amber reading light keeps the table free of office equipment.
  p.line(260, 20, 260, 137, C.black)
  p.line(261, 20, 261, 137, C.copper)
  p.polygon([[253, 137], [267, 137], [279, 148], [241, 148]], C.greenDark)
  p.line(248, 143, 272, 143, C.green)
  p.rect(241, 148, 38, 2, C.honey)
  p.rect(249, 150, 22, 2, C.cream)
}

function otherRoom(p: Pixels, room: Exclude<RoomKind, 'desk'>, state: RoomState) {
  if (room === 'shelf') {
    libraryRoom(p, state)
    return
  }
  shell(p)
  rug(p, 99, 220, 282, 49)
  if (room === 'office') {
    cityWindow(p, 178, 28, 127, 50)
    for (let i = 0; i < 4; i++) {
      const x = 27 + i * 104
      p.rect(x + 20, 85, 31, 26, i < state.departments ? C.red : C.shadow)
      desk(p, x - 3, 133, 83)
      typewriter(p, x + 8, 102, i < state.departments)
      p.rect(x + 18, 156, 41, 10, C.darkWood); p.rect(x + 32, 159, 13, 2, C.honey)
    }
    p.rect(385, 188, 74, 41, C.darkWood); p.frame(390, 193, 64, 31, C.grain)
    p.rect(380, 184, 84, 4, C.copper); teacup(p, 409, 169)
    p.ellipse(446, 172, 9, 10, C.copper); p.rect(442, 156, 8, 8, C.grain)
    p.rect(178, 216, 113, 25, C.darkWood); p.frame(180, 218, 109, 21, C.copper)
    journal(p, 211, 219)
  } else if (room === 'authors') {
    for (let i = 0; i < 4; i++) portrait(p, 53 + i * 108, 55, 53, 64, i, i < state.authors)
    p.rect(18, 137, 444, 4, C.grain)
    for (const x of [53, 381]) { p.rect(x, 160, 45, 49, C.redDark); p.frame(x + 2, 162, 41, 44, C.rose); p.rect(x - 4, 190, 53, 15, C.red) }
    p.rect(223, 195, 34, 43, C.darkWood)
    p.ellipse(240, 197, 72, 20, C.black); p.ellipse(240, 191, 72, 20, C.copper); p.ellipse(240, 189, 70, 19, C.warmWood)
    journal(p, 208, 181); teacup(p, 277, 182); candle(p, 247, 163)
  } else if (room === 'study') {
    cityWindow(p, 27, 39, 116, 88)
    fireplace(p, 197, 57)
    portrait(p, 218, 23, 43, 25, 3)
    shelf(p, 366, 126, 96, 110, 55)
    p.rect(76, 148, 67, 62, C.redDark); p.frame(79, 151, 61, 51, C.rose)
    p.rect(66, 184, 86, 40, C.red); p.rect(72, 180, 74, 21, C.rose)
    p.rect(66, 185, 8, 32, C.redDark); p.rect(145, 185, 8, 32, C.redDark)
    p.rect(76, 223, 7, 14, C.black); p.rect(137, 223, 7, 14, C.black)
    journal(p, 91, 195)
    desk(p, 250, 214, 83); teacup(p, 281, 199); lamp(p, 158, 149)
    plant(p, 344, 32, 117, 8)
  } else {
    for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
      const x = 24 + col * 45, y = 27 + row * 32
      p.rect(x, y, 43, 30, C.darkWood); p.frame(x + 2, y + 2, 39, 25, C.grain)
      p.rect(x + 14, y + 9, 16, 6, C.copper); p.rect(x + 16, y + 10, 12, 3, C.paper)
      p.rect(x + 17, y + 21, 9, 2, C.black)
    }
    shelf(p, 279, 29, 121, 164, 44)
    p.rect(425, 131, 28, 38, C.darkWood); p.rect(421, 129, 36, 4, C.copper)
    p.rect(436, 109, 7, 19, C.copper); p.ellipse(439, 105, 10, 9, C.gold)
    p.rect(432, 123, 15, 3, C.honey)
    desk(p, 148, 222, 187); journal(p, 217, 208); candle(p, 313, 197)
  }
}

export function renderRoom(room: RoomKind, state: RoomState = EMPTY_ROOM, includeLiveObjects = true) {
  const p = new Pixels()
  if (room === 'desk') deskRoom(p, state, includeLiveObjects)
  else otherRoom(p, room, state)
  return p
}

export function animateRoom(base: Pixels, room: RoomKind, state: RoomState, tick: number) {
  const p = new Pixels(WIDTH, HEIGHT, base.data)
  if (room === 'desk') {
    for (let i = 0; i < 38; i++) {
      const x = 150 + (((i * 43 - Math.floor(tick / 4)) % 192 + 192) % 192)
      const y = 31 + ((i * 31 + tick * (2 + i % 2)) % 118)
      if (!((x >= 213 && x <= 216) || (x >= 279 && x <= 282) || (y >= 88 && y <= 94))) p.rect(x, y, 1, 2, C.blueLight)
    }
    inbox(p, state.submitted)
    typewriter(p, 205, 165, state.working > 0, tick)
    if (state.hasCat) cat(p, tick)
    for (let i = 0; i < 3; i++) {
      const age = (tick + i * 9) % 30
      if (age < 21) p.rect(354 + i * 3 + Math.floor(age / 10), 184 - Math.floor(age / 3), 1, 2, C.paperShade)
    }
  } else if (room === 'study') {
    for (let i = 0; i < 12; i++) {
      const x = 214 + i * 4, h = 6 + Math.floor(noise(i, Math.floor(tick / 3), 7) * 15)
      p.rect(x, 132 - h, 3, h, i % 2 ? C.copper : C.honey)
      p.rect(x + 1, 128 - Math.floor(h / 2), 1, Math.floor(h / 2), C.cream)
    }
    p.rect(211, 133, 61, 3, C.black)
  }
  p.shade(lightMask(room))
  return p
}
