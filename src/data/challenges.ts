/** Challenge modes track progress like any other item, so they need stable ids. */
export interface ChallengeDef {
  id: string
  name: string
  topicId: string
  blurb: string
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'ch-plane',
    name: 'Root plane',
    topicId: 'rootsn',
    blurb:
      'Roots plotted in the complex plane, no equation. Real axis sets growth or decay, imaginary axis sets oscillation, distance from the axis sets multiplicity.',
  },
  {
    id: 'ch-match',
    name: 'Match',
    topicId: 'roots2',
    blurb: 'Pair each root configuration with the solution basis it produces.',
  },
]

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]))
