import { pick } from '../../../utils/random'

type Lexicon = Record<string, string[]>

const INTRO: Lexicon = {
  calm: [
    'After careful consideration,',
    'In a moment of clarity,',
    'Over a cup of Earl Grey,',
    'With the patience of a saint,',
    'In a move that surprised precisely no one,',
  ],
  dramatic: [
    'Against all odds,',
    'In a twist no one saw coming,',
    'As if by divine intervention,',
    'Much to the bewilderment of the staff,',
    'In what can only be described as a publishing miracle,',
  ],
  deadpan: [
    'Right. So.',
    'Well then.',
    'And now,',
    'Facts are facts.',
    'It happened thusly:',
  ],
}

const VERBS: Lexicon = {
  reading: ['perused', 'skimmed', 'devoured', 'slogged through', 'glanced at'],
  writing: ['drafted', 'hammered out', 'conjured', 'assembled', 'birthed'],
  editing: ['pruned', 'sculpted', 'wrestled with', 'massaged', 'survived'],
  selling: ['flew off the shelves', 'trickled out', 'found its audience', 'was discovered by exactly the right three people', 'sold respectably'],
}

const ADJECTIVES: Lexicon = {
  positive: ['reasonably competent', 'surprisingly readable', 'not entirely terrible', 'genuinely promising', 'rather good, actually'],
  negative: ['ambitious in scope', 'brave in its choices', 'unconventionally structured', 'a bold experiment', 'certainly a manuscript of all time'],
  neutral: ['exactly 70,000 words long', 'printed on paper', 'bound between covers', 'available for purchase', 'present in the room'],
}

const PUNCHLINES: Lexicon = {
  review: [
    '"At least the paper quality is decent."',
    '"I have now read this. That is the extent of my analysis."',
    '"The author makes several points. Some of them intentional."',
    '"It exists. That much can be confirmed."',
  ],
  publish: [
    '"To the printers! Cautiously."',
    '"Let the public decide. They usually get it wrong, which is oddly comforting."',
    '"Another volume for the shelf. Literally and metaphorically."',
  ],
  author: [
    '"They need time to \'find their voice\'. Or possibly a map."',
    '"A short sabbatical. By which they mean a long nap."',
    '"The muse has left the building. Security is checking the CCTV."',
  ],
}

export function pickIntro(): string {
  return pick(pick(Object.values(INTRO)))
}

export function pickVerb(category: string): string {
  return pick(VERBS[category] ?? VERBS.reading)
}

export function pickAdjective(category: string): string {
  return pick(ADJECTIVES[category] ?? ADJECTIVES.neutral)
}

export function pickPunchline(category: string): string {
  return pick(PUNCHLINES[category] ?? PUNCHLINES.review)
}

export function getLexicon(category: string): string[] {
  const all: Record<string, string[]> = { ...INTRO, ...VERBS, ...ADJECTIVES, ...PUNCHLINES }
  return all[category] ?? []
}
