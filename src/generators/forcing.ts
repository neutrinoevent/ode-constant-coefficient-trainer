/**
 * Random forcing functions inside the undetermined-coefficients family.
 *
 * `resonant` biases the choice of exponential rate and frequency towards the
 * roots already present, because a trial form with no duplication teaches
 * nothing about the rule that the section is really about.
 */

import { fNum } from '../lib/frac'
import { normalize, term, type Quasi } from '../lib/quasipoly'
import type { RootSet } from '../lib/roots'
import type { RNG } from '../lib/rng'

export type ForcingShape =
  | 'polynomial'
  | 'exponential'
  | 'trig'
  | 'poly-exp'
  | 'exp-trig'
  | 'poly-trig'
  | 'sum'

export const FORCING_SHAPES: ForcingShape[] = [
  'polynomial',
  'exponential',
  'trig',
  'poly-exp',
  'exp-trig',
  'poly-trig',
  'sum',
]

const COEFF = [1, 2, 3, 4, 5, -1, -2, -3] as const
const RATE = [-3, -2, -1, 1, 2, 3] as const
const FREQ = [1, 2, 3, 4] as const

/** Exponential rates and frequencies already present among the roots. */
function resonantRates(roots: RootSet): number[] {
  return roots.filter((r) => r.kind === 'real').map((r) => fNum(r.m))
}
function resonantPairs(roots: RootSet): [number, number][] {
  return roots
    .filter((r) => r.kind === 'complex')
    .map((r) => [fNum(r.a), fNum(r.b)] as [number, number])
}

function pickRate(rng: RNG, roots: RootSet, resonant: boolean): number {
  const hits = resonantRates(roots)
  if (resonant && hits.length) return rng.pick(hits)
  return rng.pick(RATE)
}

function pickPair(rng: RNG, roots: RootSet, resonant: boolean): [number, number] {
  const hits = resonantPairs(roots)
  if (resonant && hits.length) return rng.pick(hits)
  return [rng.pick([0, -2, -1, 1, 2] as const), rng.pick(FREQ)]
}

function polynomial(rng: RNG, degree: number, a = 0): Quasi {
  const out = [term(rng.pick(COEFF), degree, a)]
  for (let k = degree - 1; k >= 0; k--) {
    if (rng.bool(0.6)) out.push(term(rng.pick(COEFF), k, a))
  }
  return normalize(out)
}

export interface Forcing {
  q: Quasi
  shape: ForcingShape
}

export function makeForcing(rng: RNG, roots: RootSet, shape?: ForcingShape, resonant = false): Forcing {
  const s = shape ?? rng.pick(FORCING_SHAPES)
  switch (s) {
    case 'polynomial':
      // Duplication here is decided by whether m = 0 is a root, not by any choice made here.
      return { q: polynomial(rng, rng.int(0, 2)), shape: s }
    case 'exponential': {
      const a = pickRate(rng, roots, resonant)
      return { q: [term(rng.pick(COEFF), 0, a)], shape: s }
    }
    case 'trig': {
      // Pure trig: a pair 0 ± bi. Resonant only if such a pair is among the roots.
      const pure = resonantPairs(roots).filter(([a]) => a === 0)
      const b = resonant && pure.length ? rng.pick(pure)[1] : rng.pick(FREQ)
      return { q: [term(rng.pick(COEFF), 0, 0, b, rng.bool() ? 'cos' : 'sin')], shape: s }
    }
    case 'poly-exp': {
      const a = pickRate(rng, roots, resonant)
      return { q: polynomial(rng, rng.int(1, 2), a), shape: s }
    }
    case 'exp-trig': {
      const [a, b] = pickPair(rng, roots, resonant)
      const rate = a === 0 ? pickRate(rng, roots, false) : a
      return { q: [term(rng.pick(COEFF), 0, rate, b, rng.bool() ? 'cos' : 'sin')], shape: s }
    }
    case 'poly-trig': {
      const [a, b] = pickPair(rng, roots, resonant)
      return {
        q: normalize([
          term(rng.pick(COEFF), 1, a, b, 'cos'),
          ...(rng.bool(0.5) ? [term(rng.pick(COEFF), 0, a, b, 'cos')] : []),
        ]),
        shape: s,
      }
    }
    case 'sum': {
      const a = pickRate(rng, roots, resonant)
      const [, b] = pickPair(rng, roots, resonant)
      return {
        q: normalize([
          term(rng.pick(COEFF), 0, a),
          term(rng.pick(COEFF), 0, 0, b, rng.bool() ? 'cos' : 'sin'),
        ]),
        shape: s,
      }
    }
  }
}
