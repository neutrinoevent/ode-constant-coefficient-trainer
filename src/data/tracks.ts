/** Curated scopes, so practice can be aimed at what is actually next. */
export interface Track {
  id: string
  name: string
  blurb: string
  families: string[]
}

export const TRACKS: Track[] = [
  {
    id: 'core',
    name: 'The three cases',
    blurb: 'Second-order roots and nothing else. Start here.',
    families: ['roots2'],
  },
  {
    id: 'homogeneous',
    name: 'Homogeneous',
    blurb: 'Every order, plus the structure results the method rests on.',
    families: ['structure', 'roots2', 'rootsn', 'reduction'],
  },
  {
    id: 'nonhomogeneous',
    name: 'Nonhomogeneous',
    blurb: 'Trial forms, annihilators, variation of parameters.',
    families: ['trial', 'annih', 'varpar'],
  },
  {
    id: 'chapter4',
    name: 'Zill chapter 4',
    blurb: 'Everything §4.1 through §4.7.',
    families: ['structure', 'reduction', 'roots2', 'rootsn', 'trial', 'annih', 'varpar', 'cauchy'],
  },
  {
    id: 'applications',
    name: 'Applications',
    blurb: 'The same three cases read as damped motion.',
    families: ['damping'],
  },
]

export const TRACK_BY_ID = new Map(TRACKS.map((t) => [t.id, t]))
