import { ALL_CASES, type Family } from '../data/cases'
import { CHALLENGES } from '../data/challenges'
import { GENERATORS } from '../generators'
import { statsFor, type ProgressState } from '../store/progress'

/** Criterion tiers derived from the per-item moving average. */
export type Tier = 'new' | 'learning' | 'familiar' | 'proficient' | 'mastered'

export const TIER_LABEL: Record<Tier, string> = {
  new: 'New',
  learning: 'Learning',
  familiar: 'Familiar',
  proficient: 'Proficient',
  mastered: 'Mastered',
}

export function tierFor(s: { attempts: number; reps: number; ema: number }): Tier {
  if (s.attempts === 0 && s.reps === 0) return 'new'
  if (s.ema < 0.55) return 'learning'
  if (s.ema < 0.75) return 'familiar'
  if (s.ema < 0.9 || s.attempts < 5) return 'proficient'
  return 'mastered'
}

/** Every item reporting into a family: its cases, generators, and challenge modes. */
export function familyItemIds(familyId: string): string[] {
  return [
    ...ALL_CASES.filter((c) => c.familyId === familyId).map((c) => c.id),
    ...GENERATORS.filter((g) => g.topicId === familyId).map((g) => g.id),
    ...CHALLENGES.filter((c) => c.topicId === familyId).map((c) => c.id),
  ]
}

export function familyTier(progress: ProgressState, family: Family): Tier {
  const ids = familyItemIds(family.id)
  let attempts = 0
  let reps = 0
  let ema = 0
  for (const id of ids) {
    const s = statsFor(progress, id)
    attempts += s.attempts
    reps += s.reps
    ema += s.ema
  }
  return tierFor({ attempts, reps, ema: ids.length ? ema / ids.length : 0 })
}

export function familyScore(progress: ProgressState, familyId: string): number {
  const ids = familyItemIds(familyId)
  if (!ids.length) return 0
  return ids.reduce((sum, id) => sum + statsFor(progress, id).ema, 0) / ids.length
}

/**
 * Scaffolding that fades: two choices while an item is new, widening as mastery
 * grows. Applied when the option count is set to 'auto'.
 */
export function autoOptionCount(tier: Tier): 2 | 3 | 4 {
  if (tier === 'new') return 2
  if (tier === 'learning' || tier === 'familiar') return 3
  return 4
}
