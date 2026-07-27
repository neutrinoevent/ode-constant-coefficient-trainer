import { FAMILIES } from '../data/cases'
import { dueCount, statsFor, type ProgressState } from '../store/progress'
import { familyItemIds, familyScore } from './mastery'

export type CoachTarget = 'learn' | 'classify' | 'solve' | 'cards' | 'challenge'

export interface Suggestion {
  text: string
  go: CoachTarget
  goLabel: string
  scope?: string[] | null
}

/** One concrete next step: reviews first, then the weakest topic, then a stretch. */
export function suggest(progress: ProgressState): Suggestion {
  const due = dueCount(progress)
  if (due > 0) {
    return {
      text: `${due} card${due === 1 ? '' : 's'} due. Reviews first, while they are cheap.`,
      go: 'cards',
      goLabel: 'Review',
    }
  }

  if (progress.totalAttempts === 0) {
    return {
      text: 'Start with the three second-order cases: read them in Learn, then drill just that family.',
      go: 'learn',
      goLabel: 'Open Learn',
    }
  }

  let weakest: { id: string; name: string; score: number } | null = null
  let strongest: { id: string; name: string; score: number } | null = null
  for (const fam of FAMILIES) {
    const ids = familyItemIds(fam.id)
    const attempts = ids.reduce((n, id) => n + statsFor(progress, id).attempts, 0)
    const score = familyScore(progress, fam.id)
    if (attempts >= 5 && score < 0.55 && (!weakest || score < weakest.score)) {
      weakest = { id: fam.id, name: fam.name, score }
    }
    if (attempts >= 8 && score >= 0.8 && (!strongest || score > strongest.score)) {
      strongest = { id: fam.id, name: fam.name, score }
    }
  }

  if (weakest) {
    return {
      text: `${weakest.name} is the weak spot. A short focused set will move it.`,
      go: 'classify',
      goLabel: 'Drill it',
      scope: [weakest.id],
    }
  }
  if (strongest) {
    return {
      text: `${strongest.name} is solid on recognition. Write the answers out instead of picking them.`,
      go: 'solve',
      goLabel: 'Solve',
      scope: [strongest.id],
    }
  }
  return {
    text: 'Nothing urgent. Mixed practice across topics beats re-running what you already know.',
    go: 'classify',
    goLabel: 'Classify',
  }
}
