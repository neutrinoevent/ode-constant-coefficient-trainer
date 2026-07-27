import { randomRng, type RNG } from '../lib/rng'
import { HOMOGENEOUS_GENERATORS } from './homogeneous'
import { NONHOMOGENEOUS_GENERATORS } from './nonhomogeneous'
import { OTHER_GENERATORS } from './others'
import type { GeneratorDef, Mode, Problem } from './types'

export type { GeneratorDef, Mode, Problem, AnswerSpec } from './types'

export const GENERATORS: GeneratorDef[] = [
  ...HOMOGENEOUS_GENERATORS,
  ...NONHOMOGENEOUS_GENERATORS,
  ...OTHER_GENERATORS,
]

export const GENERATOR_BY_ID = new Map(GENERATORS.map((g) => [g.id, g]))

export const generatorsFor = (mode: Mode): GeneratorDef[] => GENERATORS.filter((g) => g.mode === mode)

/** Generators whose topic is in scope; an empty or null scope means everything. */
export function scopedGenerators(mode: Mode, scope: string[] | null): GeneratorDef[] {
  const pool = generatorsFor(mode)
  if (!scope || scope.length === 0) return pool
  const narrowed = pool.filter((g) => scope.includes(g.topicId))
  return narrowed.length ? narrowed : pool
}

/**
 * Weighted pick across a pool, oversampling weak topics. Mirrors the drill
 * weighting used for the case library so the two feel like one trainer.
 */
export function pickGenerator(
  pool: GeneratorDef[],
  mastery: Map<string, number>,
  rng: RNG = randomRng(),
  excludeId?: string,
): GeneratorDef {
  const usable = pool.length > 1 && excludeId ? pool.filter((g) => g.id !== excludeId) : pool
  const weights = usable.map((g) => {
    const seen = mastery.has(g.id)
    if (!seen) return 0.55
    const ema = mastery.get(g.id) ?? 0
    return 0.12 + 1.6 * (1 - ema) * (1 - ema)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng.next() * total
  for (let i = 0; i < usable.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return usable[i]
  }
  return usable[usable.length - 1]
}

export function nextProblem(
  mode: Mode,
  scope: string[] | null,
  mastery: Map<string, number>,
  excludeId?: string,
): Problem {
  const rng = randomRng()
  const gen = pickGenerator(scopedGenerators(mode, scope), mastery, rng, excludeId)
  return gen.generate(rng)
}
