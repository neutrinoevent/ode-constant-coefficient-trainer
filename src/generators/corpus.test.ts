/**
 * Corpus self-test.
 *
 * Every generator is run over hundreds of seeds and each problem is checked
 * against its own stated answer by the same code that grades a student:
 * the exemplar answer must pass the grader, the stated fundamental set must be
 * annihilated exactly by the stated operator, and multiple-choice options must
 * be distinct with the correct one present. A generator that drifts out of
 * agreement with its answer fails here rather than in front of a student.
 */

import { describe, expect, it } from 'vitest'
import { GENERATORS } from './index'
import { makeRng } from '../lib/rng'
import { checkSpan } from '../lib/answer'
import { gradeAnnihilator } from '../lib/annihilator'
import { parseOperator } from '../lib/operator'
import { applyOperator, isZero, type QTerm } from '../lib/quasipoly'
import { orthonormalize } from '../lib/linalg'

const SEEDS = 200

function isTermTarget(target: QTerm[] | ((x: number) => number)[]): target is QTerm[] {
  return target.length === 0 || typeof target[0] !== 'function'
}

describe.each(GENERATORS.map((g) => [g.id, g] as const))('%s', (_id, gen) => {
  it('produces well-formed problems', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const p = gen.generate(makeRng(seed))
      expect(p.generatorId, `seed ${seed}`).toBe(gen.id)
      expect(p.statementTex.length, `seed ${seed}`).toBeGreaterThan(0)
      expect(p.question.length, `seed ${seed}`).toBeGreaterThan(0)
      expect(p.hint.length, `seed ${seed}`).toBeGreaterThan(0)
      expect(p.solution.length, `seed ${seed}`).toBeGreaterThan(0)
    }
  })

  if (gen.mode === 'choice') {
    it('offers distinct options with exactly one correct', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = gen.generate(makeRng(seed))
        if (p.answer.kind !== 'choice') throw new Error('expected a choice answer')
        const { options, correctIndex } = p.answer
        expect(options.length, `seed ${seed}`).toBeGreaterThanOrEqual(3)
        expect(new Set(options).size, `seed ${seed}: duplicate options`).toBe(options.length)
        expect(correctIndex, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        expect(correctIndex, `seed ${seed}`).toBeLessThan(options.length)
      }
    })
  }

  if (gen.mode === 'entry') {
    it('accepts its own exemplar answer', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = gen.generate(makeRng(seed))
        if (p.answer.kind === 'span') {
          const verdict = checkSpan(p.answer.exemplar, p.answer.target, {
            expected: p.answer.count,
            domain: p.answer.domain,
          })
          expect(
            verdict.ok,
            `seed ${seed}: "${p.answer.exemplar}" rejected — ${verdict.ok ? '' : verdict.message}`,
          ).toBe(true)
        } else if (p.answer.kind === 'operator') {
          const parsed = parseOperator(p.answer.exemplar)
          expect(parsed.ok, `seed ${seed}: "${p.answer.exemplar}" did not parse`).toBe(true)
          if (!parsed.ok) continue
          const verdict = gradeAnnihilator(parsed.poly, p.answer.g, p.answer.minimalOrder)
          expect(verdict.ok, `seed ${seed}: exemplar annihilator rejected`).toBe(true)
          expect(verdict.ok && verdict.minimal, `seed ${seed}: exemplar is not minimal`).toBe(true)
        }
      }
    })

    it('states a fundamental set that is independent on the sample window', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = gen.generate(makeRng(seed))
        if (p.answer.kind !== 'span') continue
        const [lo, hi] = p.answer.domain ?? [-1.1, 1.3]
        const xs = Array.from({ length: 37 }, (_, i) => lo + ((i + 0.5) / 37) * (hi - lo))
        const vectors = p.answer.target.map((t) =>
          typeof t === 'function'
            ? xs.map(t)
            : xs.map(
                (x) =>
                  Math.pow(x, t.k) *
                  Math.exp(t.a * x) *
                  (t.b === 0 ? 1 : t.trig === 'cos' ? Math.cos(t.b * x) : Math.sin(t.b * x)),
              ),
        )
        expect(
          orthonormalize(vectors).length,
          `seed ${seed}: stated basis is numerically dependent`,
        ).toBe(p.answer.target.length)
      }
    })
  }

  it('states an operator that annihilates its own fundamental set', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const p = gen.generate(makeRng(seed))
      if (!p.operator || p.answer.kind !== 'span') continue
      if (!isTermTarget(p.answer.target)) continue
      for (const t of p.answer.target) {
        expect(
          isZero(applyOperator(p.operator, [t])),
          `seed ${seed}: operator does not annihilate a stated solution`,
        ).toBe(true)
      }
      expect(p.answer.target.length, `seed ${seed}`).toBe(p.operator.length - 1)
    }
  })
})
