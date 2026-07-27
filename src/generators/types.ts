import type { RNG } from '../lib/rng'
import type { Quasi, QTerm } from '../lib/quasipoly'

/** How the answer is given: pick one, or type it. */
export type Mode = 'choice' | 'entry'

export type AnswerSpec =
  | { kind: 'choice'; options: string[]; correctIndex: number }
  | {
      kind: 'span'
      /** Fundamental set the answer must span, as terms or as raw functions. */
      target: QTerm[] | ((x: number) => number)[]
      /** How many arbitrary constants the answer carries. */
      count: number
      domain?: [number, number]
      constantWord?: string
      placeholder: string
      /** One answer that must pass, in the syntax the input accepts. */
      exemplar: string
    }
  | {
      kind: 'operator'
      g: Quasi
      minimalOrder: number
      placeholder: string
      exemplar: string
    }

export interface Problem {
  generatorId: string
  /** Family id from the case library, so a generated miss feeds the same mastery score. */
  topicId: string
  /** Rich text: what to do. */
  question: string
  /** The equation or data, as display LaTeX. */
  statementTex: string
  /** Optional supporting line, e.g. the complementary function. */
  givenTex?: string
  givenLabel?: string
  answer: AnswerSpec
  /** Rich text shown on reveal. */
  solution: string
  hint: string
  /** One line of teaching shown after the answer lands. */
  note?: string
  /**
   * The homogeneous operator behind the problem, descending coefficients.
   * Present whenever there is one; the corpus test applies it to the stated
   * fundamental set and checks the result is exactly zero.
   */
  operator?: number[]
}

export interface GeneratorDef {
  id: string
  name: string
  blurb: string
  section: string
  topicId: string
  mode: Mode
  generate: (rng: RNG) => Problem
}
