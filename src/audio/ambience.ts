import { sceneMix } from './mix'
import type { Mix, Scene } from './mix'

/**
 * Room tone and weather, synthesised with Web Audio: no audio files.
 * Nothing is created until the browser allows it (first user gesture).
 */
interface Prefs { on: boolean; volume: number }
const KEY = 'idleditor.audio'

function load(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { on: raw.on !== false, volume: typeof raw.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : .5 }
  } catch { return { on: true, volume: .5 } }
}
let prefs = load()
let snapshot = prefs
const listeners = new Set<() => void>()
function save(next: Prefs) {
  prefs = snapshot = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
  listeners.forEach(fn => fn())
  apply()
}
export const subscribeAudio = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export const getAudioPrefs = () => snapshot
export const setAudioOn = (on: boolean) => save({ ...prefs, on })
export const setAudioVolume = (volume: number) => save({ ...prefs, volume })

// ──── graph ────
interface Graph {
  ctx: AudioContext; master: GainNode; outdoor: GainNode; wall: BiquadFilterNode
  layers: Record<'rain' | 'wind' | 'hush', GainNode>; noise: AudioBuffer
}
let graph: Graph | null = null
let scene: Scene | null = null
let mix: Mix = { rain: 0, wind: 0, hush: 0, crickets: 0, fire: 0, typing: 0, muffle: 5200 }
let timer = 0
let nextChirp = 0, nextClack = 0, nextDing = 0

function makeNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), data = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0 // pink-ish: white noise through a few one-pole lowpasses
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = .997 * b0 + white * .029; b1 = .985 * b1 + white * .032; b2 = .95 * b2 + white * .048
    data[i] = (b0 + b1 + b2 + white * .1) * 3.2
  }
  return buffer
}
function loop(g: Graph, dest: AudioNode, chain: (n: AudioNode) => AudioNode, gain = 0) {
  const src = g.ctx.createBufferSource(); src.buffer = g.noise; src.loop = true
  src.loopStart = Math.random() * 1.5
  const out = g.ctx.createGain(); out.gain.value = gain
  chain(src).connect(out); out.connect(dest); src.start()
  return out
}
function filter(ctx: AudioContext, type: BiquadFilterType, freq: number, q = .7) {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f
}

function build(): Graph | null {
  const Ctx = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined
  if (!Ctx) return null
  const ctx = new Ctx()
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
  const wall = filter(ctx, 'lowpass', 5200, .5); wall.connect(master)
  const outdoor = ctx.createGain(); outdoor.connect(wall)
  const g = { ctx, master, outdoor, wall, noise: makeNoise(ctx), layers: {} as Graph['layers'] }
  // Rain: hiss with a slow swell so it never sounds like a tape loop.
  g.layers.rain = loop(g, outdoor, n => { const hp = filter(ctx, 'highpass', 900); n.connect(hp); const lp = filter(ctx, 'lowpass', 7500); hp.connect(lp); return lp })
  // Wind: band-passed noise whose centre frequency drifts.
  const windBand = filter(ctx, 'bandpass', 380, .9)
  g.layers.wind = loop(g, outdoor, n => { n.connect(windBand); return windBand })
  const drift = ctx.createOscillator(); drift.frequency.value = .11
  const depth = ctx.createGain(); depth.gain.value = 220; drift.connect(depth); depth.connect(windBand.frequency); drift.start()
  // Snow and fog: a soft low hush.
  g.layers.hush = loop(g, outdoor, n => { const lp = filter(ctx, 'lowpass', 420); n.connect(lp); return lp })
  // Always-on room tone, so the room is never dead silent.
  loop(g, master, n => { const lp = filter(ctx, 'lowpass', 160); n.connect(lp); return lp }, .06)
  return g
}

function burst(g: Graph, dest: AudioNode, opts: { at: number; dur: number; gain: number; type: BiquadFilterType; freq: number; q?: number; sweepTo?: number; attack?: number }) {
  const { ctx } = g
  const src = ctx.createBufferSource(); src.buffer = g.noise
  const f = filter(ctx, opts.type, opts.freq, opts.q ?? 1)
  if (opts.sweepTo) { f.frequency.setValueAtTime(opts.freq, opts.at); f.frequency.exponentialRampToValueAtTime(opts.sweepTo, opts.at + opts.dur) }
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, opts.at)
  env.gain.linearRampToValueAtTime(opts.gain, opts.at + (opts.attack ?? .002))
  env.gain.exponentialRampToValueAtTime(.0001, opts.at + opts.dur)
  src.connect(f); f.connect(env); env.connect(dest)
  src.start(opts.at, Math.random() * 2, opts.dur + .05)
}
function tone(g: Graph, dest: AudioNode, at: number, freq: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  const o = g.ctx.createOscillator(), env = g.ctx.createGain()
  o.type = type; o.frequency.value = freq
  env.gain.setValueAtTime(0, at); env.gain.linearRampToValueAtTime(gain, at + .003); env.gain.exponentialRampToValueAtTime(.0001, at + dur)
  o.connect(env); env.connect(dest); o.start(at); o.stop(at + dur + .02)
}

/** A short scheduler for the sparse sounds (crickets, embers, typing); layers above are continuous. */
function pulse() {
  const g = graph
  if (!g || g.ctx.state !== 'running') return
  const now = g.ctx.currentTime
  if (mix.crickets > .01 && now > nextChirp) {
    for (let i = 0; i < 3; i++) tone(g, g.outdoor, now + i * .07, 4300 + Math.random() * 120, .03, mix.crickets * .05)
    nextChirp = now + .8 + Math.random() * 1.6
  }
  if (mix.fire > .01 && Math.random() < .32) {
    burst(g, g.master, { at: now, dur: .01 + Math.random() * .03, gain: mix.fire * (.05 + Math.random() * .1), type: 'highpass', freq: 1400 + Math.random() * 2500 })
  }
  if (mix.typing > .01 && now > nextClack) {
    burst(g, g.master, { at: now, dur: .03, gain: mix.typing * .18, type: 'bandpass', freq: 2600 + Math.random() * 900, q: 2 })
    tone(g, g.master, now, 150, .05, mix.typing * .1)
    nextClack = now + .09 + Math.random() * .16
    if (now > nextDing && Math.random() < .03) { tone(g, g.master, now + .1, 2350, .5, mix.typing * .07, 'triangle'); nextDing = now + 6 }
  }
}

function apply() {
  const g = graph
  if (!g) return
  const now = g.ctx.currentTime, on = prefs.on && !document.hidden
  g.master.gain.setTargetAtTime(on ? prefs.volume * .8 : 0, now, .4)
  for (const k of ['rain', 'wind', 'hush'] as const) g.layers[k].gain.setTargetAtTime(mix[k] * .5, now, 1.5)
  g.wall.frequency.setTargetAtTime(mix.muffle, now, .8)
  if (on && g.ctx.state === 'suspended') void g.ctx.resume()
  if (!on && g.ctx.state === 'running') window.setTimeout(() => { if (!(prefs.on && !document.hidden)) void g.ctx.suspend() }, 800)
}

export function setScene(next: Scene) {
  scene = next
  mix = sceneMix(next)
  apply()
}

/** Thunder rolls in `delay` seconds after the flash; the rumble is what survives the wall. */
export function thunder(delay: number) {
  const g = graph
  if (!g || g.ctx.state !== 'running' || !prefs.on) return
  const at = g.ctx.currentTime + delay
  burst(g, g.outdoor, { at, dur: .35, gain: .32, type: 'lowpass', freq: 1800, sweepTo: 200 })
  burst(g, g.outdoor, { at: at + .05, dur: 3.4, gain: .5, type: 'lowpass', freq: 380, sweepTo: 45, attack: .25 })
  tone(g, g.outdoor, at + .1, 46, 2.8, .2)
}

// ──── unlock on first gesture ────
let armed = false
export function armAudio() {
  if (armed || typeof window === 'undefined') return
  armed = true
  const unlock = () => {
    window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock)
    graph ??= build()
    if (graph) {
      timer = window.setInterval(pulse, 60)
      document.addEventListener('visibilitychange', apply)
      if (scene) mix = sceneMix(scene)
      apply()
    }
  }
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock)
}

/** For tests and hot reload. */
export function disposeAudio() {
  window.clearInterval(timer)
  document.removeEventListener('visibilitychange', apply)
  void graph?.ctx.close()
  graph = null; armed = false; scene = null
}
