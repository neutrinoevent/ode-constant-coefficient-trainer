/**
 * Random root sets with tidy coefficients.
 *
 * Everything downstream is derived from the root set, so the only requirement
 * here is that the roots be small and mostly integral — that keeps the printed
 * ODE readable and keeps the exact-arithmetic path in `charPoly` on integers.
 */

import { frac } from '../lib/frac'
import { complex, real, type RootSet } from '../lib/roots'
import type { RNG } from '../lib/rng'

const SMALL = [-4, -3, -2, -1, 1, 2, 3, 4] as const
const WITH_ZERO = [-3, -2, -1, 0, 1, 2, 3] as const
const FREQ = [1, 2, 3, 4] as const

/** Two distinct real roots. */
export function distinctReal(rng: RNG): RootSet {
  const [a, b] = rng.sample(WITH_ZERO, 2)
  return [real(frac(a)), real(frac(b))]
}

/** One real root of multiplicity two. */
export function repeatedReal(rng: RNG): RootSet {
  return [real(frac(rng.pick(WITH_ZERO)), 2)]
}

/** A conjugate pair; the real part is zero often enough to keep that case fresh. */
export function conjugatePair(rng: RNG): RootSet {
  const a = rng.bool(0.3) ? 0 : rng.pick([-3, -2, -1, 1, 2, 3] as const)
  return [complex(frac(a), frac(rng.pick(FREQ)))]
}

/** A half-integer root pair, so the ODE has a leading coefficient of 2 or 4. */
export function halfInteger(rng: RNG): RootSet {
  const a = frac(rng.pick([-5, -3, -1, 1, 3, 5] as const), 2)
  const b = frac(rng.pick(WITH_ZERO))
  return [real(a), real(b)]
}

export const SECOND_ORDER_KINDS = ['distinct', 'repeated', 'complex'] as const
export type SecondOrderKind = (typeof SECOND_ORDER_KINDS)[number]

export function secondOrder(rng: RNG, kind?: SecondOrderKind): RootSet {
  const k = kind ?? rng.pick(SECOND_ORDER_KINDS)
  if (k === 'distinct') return rng.bool(0.15) ? halfInteger(rng) : distinctReal(rng)
  if (k === 'repeated') return repeatedReal(rng)
  return conjugatePair(rng)
}

export const HIGHER_ORDER_SHAPES = [
  'three-distinct',
  'double-plus-single',
  'triple',
  'real-plus-pair',
  'repeated-pair',
  'two-pairs',
  'double-plus-pair',
] as const
export type HigherOrderShape = (typeof HIGHER_ORDER_SHAPES)[number]

/** Third- and fourth-order root sets covering each multiplicity pattern. */
export function higherOrder(rng: RNG, shape?: HigherOrderShape): RootSet {
  const s = shape ?? rng.pick(HIGHER_ORDER_SHAPES)
  switch (s) {
    case 'three-distinct': {
      const [a, b, c] = rng.sample(WITH_ZERO, 3)
      return [real(frac(a)), real(frac(b)), real(frac(c))]
    }
    case 'double-plus-single': {
      const [a, b] = rng.sample(WITH_ZERO, 2)
      return [real(frac(a), 2), real(frac(b))]
    }
    case 'triple':
      return [real(frac(rng.pick(SMALL)), 3)]
    case 'real-plus-pair': {
      const a = rng.pick(WITH_ZERO)
      const re = rng.bool(0.4) ? 0 : rng.pick([-2, -1, 1, 2] as const)
      return [real(frac(a)), complex(frac(re), frac(rng.pick(FREQ)))]
    }
    case 'repeated-pair': {
      const re = rng.bool(0.5) ? 0 : rng.pick([-2, -1, 1, 2] as const)
      return [complex(frac(re), frac(rng.pick([1, 2, 3] as const)), 2)]
    }
    case 'two-pairs': {
      const [b1, b2] = rng.sample(FREQ, 2)
      return [complex(frac(0), frac(b1)), complex(frac(0), frac(b2))]
    }
    case 'double-plus-pair': {
      const a = rng.pick([-2, -1, 1, 2] as const)
      return [real(frac(a), 2), complex(frac(0), frac(rng.pick([1, 2, 3] as const)))]
    }
  }
}
