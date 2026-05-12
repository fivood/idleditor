import { pick, rangeInt } from '../../utils/random'
import {
  pickAdjective,
  pickIntro,
  pickPunchline,
  pickVerb,
} from './lexicons/phrases'

export interface ToastContext {
  title?: string
  authorName?: string
  genre?: string
  quality?: string
  [key: string]: string | undefined
}

// Template: a string with {slotName} placeholders
type SlotResolver = (ctx: ToastContext) => string

const SLOTS: Record<string, SlotResolver> = {
  '{editorName}': () => 'You',
  '{title}': (ctx) => ctx.title ?? 'Untitled Manuscript',
  '{authorName}': (ctx) => ctx.authorName ?? 'Anonymous',
  '{genre}': (ctx) => ctx.genre ?? 'miscellaneous',
  '{quality}': (ctx) => ctx.quality ?? 'adequate',
  '{intro}': () => pickIntro(),
  '{verb_read}': () => pickVerb('reading'),
  '{verb_write}': () => pickVerb('writing'),
  '{verb_edit}': () => pickVerb('editing'),
  '{verb_sell}': () => pickVerb('selling'),
  '{adj_pos}': () => pickAdjective('positive'),
  '{adj_neg}': () => pickAdjective('negative'),
  '{adj_neut}': () => pickAdjective('neutral'),
  '{punch_review}': () => pickPunchline('review'),
  '{punch_publish}': () => pickPunchline('publish'),
  '{punch_author}': () => pickPunchline('author'),
  '{time_minutes}': () => String(rangeInt(5, 45)),
  '{time_hours}': () => String(rangeInt(1, 8)),
  '{time_days}': () => String(rangeInt(2, 14)),
}

function resolve(template: string, ctx: ToastContext): string {
  let result = template
  for (const [slot, resolver] of Object.entries(SLOTS)) {
    while (result.includes(slot)) {
      result = result.replace(slot, resolver(ctx))
    }
  }
  return result
}

// ──── Scene templates ────
const SCENES: Record<string, string[]> = {
  reviewComplete: [
    '{intro} the editor read "the {title}" in its entirety. {punch_review}',
    '"The {title}": read in {time_minutes} minutes, understood in none. {punch_review}',
    'The last chapter of "the {title}" left {editorName} staring at the wall. {punch_review}',
  ],
  bookPublished: [
    '"the {title}" has been published. {intro} it is now the public\'s problem.',
    '{intro} the presses roll. "the {title}" is loosed upon an unsuspecting world.',
    'A new book enters the catalogue. "the {title}" by {authorName}. The shelf shifts slightly to accommodate it.',
  ],
  bestseller: [
    '"the {title}" is climbing the charts. Rival editors were seen {verb_read} their own slush piles with renewed desperation.',
    '{intro} the fax machine is overwhelmed. Bookshops want more copies of "the {title}". The machine has never been so popular.',
    '"the {title}" has sold 100,000 copies. {authorName} is now insufferable at parties. The press\'s prestige swells accordingly.',
  ],
  authorCooldown: [
    '{authorName} is taking a break. {punch_author}',
    '{intro} {authorName} announced a sabbatical to {verb_write} their next masterpiece. ETA: {time_days} business days. Give or take a month.',
  ],
  authorReturn: [
    '{authorName} has returned from their break, looking suspiciously well-rested and bearing a new manuscript.',
    '{intro} {authorName} is back at the desk. The new manuscript is {adj_pos}. Suspicious.',
  ],
  manuscriptRejected: [
    '{intro} the decision was made. "the {title}" will find its home elsewhere. Or not. Either way, not here.',
    '"the {title}" — rejected. {punch_review} The author will survive. Probably.',
  ],
  idle: [
    'The slush pile sits quietly, as slush piles do. {editorName} contemplates tea.',
    '{intro} nothing of note occurred. The press breathes. Somewhere, an author panics.',
  ],
}

export function generateToast(scene: string, ctx: ToastContext = {}): string {
  const templates = SCENES[scene]
  if (!templates) {
    return 'Something happened. The details are unclear, as is tradition.'
  }
  const template = pick(templates)
  return resolve(template, ctx)
}
