/** Adaptive selection over the case library, and multiple-choice construction. */

import { ALL_CASES, type FlatCase } from '../data/cases'
import { statsFor, type ProgressState } from '../store/progress'

export function inScope(familyId: string, scope: string[] | null): boolean {
  return scope === null || scope.length === 0 || scope.includes(familyId)
}

export function scopedCases(scope: string[] | null): FlatCase[] {
  const pool = ALL_CASES.filter((c) => inScope(c.familyId, scope))
  return pool.length > 0 ? pool : ALL_CASES
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Weak items dominate, unseen ones trickle in, mastered ones still resurface. */
function weight(state: ProgressState, item: FlatCase): number {
  const s = statsFor(state, item.id)
  if (s.attempts === 0) return 0.55
  return 0.12 + 1.6 * (1 - s.ema) * (1 - s.ema)
}

export function pickCase(
  state: ProgressState,
  scope: string[] | null,
  excludeId: string | null,
): FlatCase {
  let pool = scopedCases(scope)
  if (pool.length > 1 && excludeId) pool = pool.filter((c) => c.id !== excludeId)
  let total = 0
  const weights = pool.map((c) => {
    const w = weight(state, c)
    total += w
    return w
  })
  let roll = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export interface Question {
  item: FlatCase
  /** Rendered options; exactly one is correct. */
  options: string[]
  correctIndex: number
}

const normalize = (s: string) => s.replace(/\s|\\,|\\;|\\!|\\left|\\right/g, '')

/**
 * Build a multiple-choice question. The item's own traps come first, then
 * answers from sibling cases in the same family, then anything else — so the
 * wrong options stay close enough to the right one to be worth reading.
 */
export function buildQuestion(item: FlatCase, optionCount = 4): Question {
  const chosen: string[] = []
  const seen = new Set<string>([normalize(item.answer)])

  const consider = (text: string) => {
    if (chosen.length >= optionCount - 1) return
    const key = normalize(text)
    if (seen.has(key)) return
    seen.add(key)
    chosen.push(text)
  }

  for (const trap of shuffle(item.traps ?? [])) consider(trap)
  const siblings = ALL_CASES.filter((c) => c.familyId === item.familyId && c.id !== item.id)
  for (const sib of shuffle(siblings)) consider(sib.answer)
  for (const other of shuffle(ALL_CASES)) consider(other.answer)

  const options = shuffle([item.answer, ...chosen])
  return { item, options, correctIndex: options.indexOf(item.answer) }
}
