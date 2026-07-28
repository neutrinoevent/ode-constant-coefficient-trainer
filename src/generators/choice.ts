/**
 * Assembling a multiple-choice answer.
 *
 * A wrong option may carry `why` — the mistake it encodes, phrased in terms of
 * the numbers on screen. The UI shows it when that option is picked, so a wrong
 * answer costs a mark and buys an explanation.
 */

import type { RNG } from '../lib/rng'
import type { Distractor } from './distractors'

export type WrongOption = string | Distractor

interface ChoiceAnswer {
  kind: 'choice'
  options: string[]
  correctIndex: number
  explanations: (string | null)[]
}

const textOf = (o: WrongOption): string => (typeof o === 'string' ? o : o.tex)
const whyOf = (o: WrongOption): string | null => (typeof o === 'string' ? null : o.why)

/**
 * Shuffle the correct answer in among the wrong ones, keeping each option's
 * explanation beside it. `math` wraps every option so it renders as an
 * expression rather than prose.
 */
export function choiceAnswer(
  rng: RNG,
  correct: string,
  wrong: WrongOption[],
  { math = false } = {},
): ChoiceAnswer {
  const entries = rng.shuffle([
    { text: correct, why: null as string | null },
    ...wrong.map((w) => ({ text: textOf(w), why: whyOf(w) })),
  ])
  const wrap = (t: string) => (math ? `$${t}$` : t)
  return {
    kind: 'choice',
    options: entries.map((e) => wrap(e.text)),
    correctIndex: entries.findIndex((e) => e.text === correct),
    explanations: entries.map((e) => e.why),
  }
}
