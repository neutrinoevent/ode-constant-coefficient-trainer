/**
 * The path is data pointing at generators and library families that live
 * elsewhere. These tests keep the pointers honest: a renamed generator or a
 * dropped variant should fail here, not on the step that references it.
 */

import { describe, expect, it } from 'vitest'
import { PATH, nextStep } from './path'
import { FAMILY_BY_ID } from './cases'
import { GENERATOR_BY_ID } from '../generators'
import { makeRng } from '../lib/rng'

describe('the path', () => {
  it('has unique, ordered steps', () => {
    const ids = PATH.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(PATH.length).toBeGreaterThan(8)
  })

  it('names only generators and families that exist', () => {
    for (const step of PATH) {
      for (const item of step.practice) {
        if (item.kind === 'cases') {
          expect(FAMILY_BY_ID.has(item.familyId), `${step.id}: no family ${item.familyId}`).toBe(
            true,
          )
        } else {
          const gen = GENERATOR_BY_ID.get(item.generatorId)
          expect(gen, `${step.id}: no generator ${item.generatorId}`).toBeDefined()
          if (item.variant) {
            expect(
              gen?.variants?.includes(item.variant),
              `${step.id}: ${item.generatorId} does not offer variant "${item.variant}"`,
            ).toBe(true)
          }
        }
      }
      for (const familyId of step.scope) {
        expect(FAMILY_BY_ID.has(familyId), `${step.id}: no family ${familyId}`).toBe(true)
      }
    }
  })

  it('sets a pass mark that is reachable and not free', () => {
    for (const step of PATH) {
      expect(step.run.pass, step.id).toBeGreaterThan(step.run.length / 2)
      expect(step.run.pass, step.id).toBeLessThanOrEqual(step.run.length)
      expect(step.practice.length, `${step.id}: nothing to practise`).toBeGreaterThan(0)
    }
  })

  it('teaches before it drills, wherever it teaches', () => {
    for (const step of PATH) {
      expect(step.goal.length, step.id).toBeGreaterThan(10)
      if (!step.teach) continue
      expect(step.teach.body.length, step.id).toBeGreaterThan(0)
      for (const para of step.teach.body) expect(para.length, step.id).toBeGreaterThan(60)
      const example = step.teach.example?.()
      if (example) {
        expect(example.length, `${step.id}: thin worked example`).toBeGreaterThanOrEqual(5)
        expect(example.at(-1)?.tex, step.id).toBeTruthy()
      }
    }
  })

  it('actually narrows a generator when a step asks it to', () => {
    // The three case steps must each produce only their own case.
    const cases: [string, RegExp][] = [
      ['distinct', /^(?!.*(?:\\cos|\\sin)).*$/],
      ['complex', /\\cos/],
    ]
    for (const [variant, shape] of cases) {
      const gen = GENERATOR_BY_ID.get('general-2-choice')!
      for (let seed = 1; seed <= 40; seed++) {
        const p = gen.generate(makeRng(seed), variant)
        if (p.answer.kind !== 'choice') throw new Error('expected a choice')
        const correct = p.answer.options[p.answer.correctIndex]
        expect(shape.test(correct), `${variant} seed ${seed}: got ${correct}`).toBe(true)
      }
    }
    // Repeated roots always bring a factor of x into the answer.
    const gen = GENERATOR_BY_ID.get('general-2-choice')!
    for (let seed = 1; seed <= 40; seed++) {
      const p = gen.generate(makeRng(seed), 'repeated')
      if (p.answer.kind !== 'choice') throw new Error('expected a choice')
      expect(p.answer.options[p.answer.correctIndex], `repeated seed ${seed}`).toContain('c_{2}x')
    }
  })

  it('advances only as steps are cleared', () => {
    expect(nextStep([])?.id).toBe(PATH[0].id)
    expect(nextStep([PATH[0].id])?.id).toBe(PATH[1].id)
    expect(nextStep(PATH.map((s) => s.id))).toBe(null)
    // A step cleared out of order does not skip the ones before it.
    expect(nextStep([PATH[3].id])?.id).toBe(PATH[0].id)
  })
})
