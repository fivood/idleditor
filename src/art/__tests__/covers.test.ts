import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COVER_H, COVER_W, renderCover } from '../covers'

const manifest: { title: string; genre: string }[] = JSON.parse(readFileSync('public/covers/manifest.json', 'utf8'))
const hash = (d: Uint32Array) => d.reduce((h, v) => Math.imul(h ^ v, 16777619) >>> 0, 2166136261)

describe('procedural covers', () => {
  it('is deterministic and 40x56', () => {
    const a = renderCover('量子茶渍', 'sci-fi'), b = renderCover('量子茶渍', 'sci-fi')
    expect(a.data.length).toBe(COVER_W * COVER_H)
    expect(hash(a.data)).toBe(hash(b.data))
  })
  it('renders every catalogue title, each visibly different', () => {
    const hashes = new Set(manifest.map(b => hash(renderCover(b.title, b.genre).data)))
    expect(hashes.size).toBe(manifest.length)
  })
})

import { coverSalesMult, recommendCoverStyle } from '../../core/coverStyle'
import { coverTraits } from '../covers'

describe('cover styles', () => {
  it('gives the three styles different pictures and honest traits', () => {
    const [safe, bold, weird] = (['safe', 'bold', 'weird'] as const).map(s => renderCover('量子茶渍', 'sci-fi', s))
    expect(new Set([hash(safe.data), hash(bold.data), hash(weird.data)]).size).toBe(3)
    expect(coverTraits('量子茶渍', 'sci-fi', 'bold').prop).toBeNull()
    expect(coverTraits('量子茶渍', 'sci-fi', 'weird').prop).not.toBeNull()
    expect(coverTraits('量子茶渍', 'sci-fi', 'bold').contrast).toBe('高')
  })
  it('hand-drawn covers ignore style', () => {
    expect(hash(renderCover('吸血鬼不存在', 'suspense', 'bold').data)).toBe(hash(renderCover('吸血鬼不存在', 'suspense', 'weird').data))
  })
  it('sales curves trade launch against long tail, and the advice follows quality', () => {
    expect(coverSalesMult('bold', 0)).toBeGreaterThan(coverSalesMult('weird', 0))
    expect(coverSalesMult('weird', 5000)).toBeGreaterThan(coverSalesMult('bold', 5000))
    expect(recommendCoverStyle({ quality: 30 }).style).toBe('bold')
    expect(recommendCoverStyle({ quality: 60 }).style).toBe('safe')
    expect(recommendCoverStyle({ quality: 90 }).style).toBe('weird')
  })
})
