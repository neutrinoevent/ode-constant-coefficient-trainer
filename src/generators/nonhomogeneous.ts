/** Generated problems for §4.4 and §4.5: trial forms, the multiplication rule, annihilators. */

import { annihilatorOf } from '../lib/annihilator'
import { quasiTex, term, type QTerm } from '../lib/quasipoly'
import { charPoly, generalSolutionTex, odeTex, order, type RootSet } from '../lib/roots'
import type { RNG } from '../lib/rng'
import {
  forcingGroups,
  multiplicationShift,
  shiftExplanation,
  termsTrialTex,
  termsTrialText,
  trialTerms,
  trialTex,
} from '../lib/undetermined'
import { makeForcing } from './forcing'
import { higherOrder, secondOrder } from './rootgen'
import type { GeneratorDef, Problem } from './types'

function shuffleWithAnswer(rng: RNG, correct: string, wrong: string[]) {
  const options = rng.shuffle([correct, ...wrong])
  return { options, correctIndex: options.indexOf(correct) }
}

/** Same, for options that are expressions rather than prose. */
function mathChoice(rng: RNG, correct: string, wrong: string[]) {
  const order = rng.shuffle([correct, ...wrong])
  return { options: order.map((t) => `$${t}$`), correctIndex: order.indexOf(correct) }
}

/** Roots plus a forcing function, resonant most of the time. */
function setup(rng: RNG, resonantBias = 0.6) {
  const roots = rng.bool(0.75) ? secondOrder(rng) : higherOrder(rng)
  const { q } = makeForcing(rng, roots, undefined, rng.bool(resonantBias))
  return { roots, g: q }
}

/** Trial forms built on a deliberately wrong reading of the rule. */
function wrongTrials(g: QTerm[], roots: RootSet, correct: QTerm[], rng: RNG): string[] {
  const groups = forcingGroups(g)
  const shifted = groups.map((grp) => multiplicationShift(grp, roots))

  const build = (shifts: number[]): QTerm[] => {
    const out: QTerm[] = []
    groups.forEach((grp, i) => {
      const s = Math.max(0, shifts[i])
      for (let j = 0; j <= grp.degree; j++) {
        if (grp.b === 0) out.push(term(1, s + j, grp.a, 0, 'cos'))
        else {
          out.push(term(1, s + j, grp.a, grp.b, 'cos'))
          out.push(term(1, s + j, grp.a, grp.b, 'sin'))
        }
      }
    })
    return out
  }

  const candidates: QTerm[][] = [
    build(shifted.map(() => 0)), // the rule ignored
    build(shifted.map((s) => s + 1)), // one x too many
    build(shifted.map((s) => Math.max(0, s - 1))), // one x too few
    build(shifted.map((s, i) => (i === 0 ? s + 1 : s))), // the rule over-applied to one group
    build(shifted.map((s) => s + 2)),
  ]

  // Cosine kept, sine partner dropped — the trig case done by half.
  const halfTrig = correct.filter((t) => t.b === 0 || t.trig === 'cos')
  if (halfTrig.length !== correct.length) candidates.push(halfTrig)

  // Lowest-degree term dropped, the "only the leading power" answer.
  if (correct.length > 1) candidates.push(correct.slice(0, -1))
  // One extra term of the next power up.
  candidates.push([
    ...correct,
    term(1, (correct.at(-1)?.k ?? 0) + 1, correct.at(-1)?.a ?? 0, correct.at(-1)?.b ?? 0, 'cos'),
  ])

  const correctTex = termsTrialTex(correct)
  const seen = new Set([correctTex])
  const out: string[] = []
  for (const cand of rng.shuffle(candidates)) {
    if (!cand.length) continue
    const tex = termsTrialTex(cand)
    if (seen.has(tex)) continue
    seen.add(tex)
    out.push(tex)
    if (out.length >= 3) break
  }
  return out
}

/** Type the trial form for y_p. */
export const trialEntry: GeneratorDef = {
  id: 'trial-form',
  name: 'Trial form for y_p',
  blurb: 'Write the assumed form. Coefficients stay undetermined.',
  section: '§4.4',
  topicId: 'trial',
  mode: 'entry',
  generate: (rng: RNG): Problem => {
    const { roots, g } = setup(rng)
    const target = trialTerms(g, roots)
    const coeffs = charPoly(roots)
    return {
      generatorId: 'trial-form',
      topicId: 'trial',
      question:
        'Write the trial form for $y_p$ that undetermined coefficients would use. Do not solve for the coefficients.',
      statementTex: odeTex(coeffs, quasiTex(g)),
      givenLabel: 'Complementary function',
      givenTex: `y_c = ${generalSolutionTex(roots)}`,
      answer: {
        kind: 'span',
        target,
        count: target.length,
        constantWord: 'undetermined coefficient',
        placeholder: 'A*x*e^(2x) + B*e^(2x)',
        exemplar: termsTrialText(target),
      },
      hint: 'Group $g(x)$ by its exponential rate and frequency, give each group a full polynomial, then apply the $x^{s}$ rule.',
      solution: `$y_p = ${trialTex(g, roots)}$`,
      note: shiftExplanation(g, roots),
    }
  },
}

/** Pick the trial form from four. */
export const trialChoice: GeneratorDef = {
  id: 'trial-choice',
  name: 'Pick the trial form',
  blurb: 'The wrong options are the rule applied wrongly.',
  section: '§4.4',
  topicId: 'trial',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const { roots, g } = setup(rng)
    const target = trialTerms(g, roots)
    const correct = termsTrialTex(target)
    return {
      generatorId: 'trial-choice',
      topicId: 'trial',
      question: 'Which is the correct trial form for $y_p$?',
      statementTex: odeTex(charPoly(roots), quasiTex(g)),
      givenLabel: 'Complementary function',
      givenTex: `y_c = ${generalSolutionTex(roots)}`,
      answer: {
        kind: 'choice',
        ...mathChoice(rng, correct, wrongTrials(g, roots, target, rng)),
      },
      hint: 'Check each group of $g(x)$ against $y_c$ before writing anything down.',
      solution: `$y_p = ${trialTex(g, roots)}$`,
      note: shiftExplanation(g, roots),
    }
  },
}

/** How many powers of x does the multiplication rule call for? */
export const shiftChoice: GeneratorDef = {
  id: 'shift-s',
  name: 'The x^s multiplier',
  blurb: 'The multiplication rule, isolated from everything else.',
  section: '§4.4',
  topicId: 'trial',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    // A single-group forcing function keeps the answer a single number.
    const roots = rng.bool(0.7) ? secondOrder(rng) : higherOrder(rng)
    let g = makeForcing(rng, roots, undefined, rng.bool(0.65)).q
    let groups = forcingGroups(g)
    let guard = 0
    while (groups.length !== 1 && guard++ < 20) {
      g = makeForcing(rng, roots, undefined, rng.bool(0.65)).q
      groups = forcingGroups(g)
    }
    const s = multiplicationShift(groups[0], roots)
    const correct = s === 0 ? 'No multiplier — $s = 0$' : `$x^{${s}}$`
    const pool = ['No multiplier — $s = 0$', '$x^{1}$', '$x^{2}$', '$x^{3}$'].filter(
      (o) => o !== correct,
    )
    return {
      generatorId: 'shift-s',
      topicId: 'trial',
      question: 'By what power of $x$ must the trial form be multiplied?',
      statementTex: odeTex(charPoly(roots), quasiTex(g)),
      givenLabel: 'Complementary function',
      givenTex: `y_c = ${generalSolutionTex(roots)}`,
      answer: { kind: 'choice', ...shuffleWithAnswer(rng, correct, pool.slice(0, 3)) },
      hint: '$s$ is the multiplicity, as a root of the auxiliary equation, of the rate the forcing term is built on.',
      solution: shiftExplanation(g, roots),
      note: `$y_p = ${trialTex(g, roots)}$`,
    }
  },
}

/** Type the minimal annihilator. */
export const annihilatorEntry: GeneratorDef = {
  id: 'annihilator',
  name: 'Minimal annihilator',
  blurb: 'Operator notation: type factors like (D-2)^2 or (D^2+9).',
  section: '§4.5',
  topicId: 'annih',
  mode: 'entry',
  generate: (rng: RNG): Problem => {
    const { q } = makeForcing(rng, [], undefined, false)
    const ann = annihilatorOf(q)
    return {
      generatorId: 'annihilator',
      topicId: 'annih',
      question: 'Give the differential operator of lowest order that annihilates this function.',
      statementTex: quasiTex(q),
      answer: {
        kind: 'operator',
        g: q,
        minimalOrder: ann.order,
        placeholder: '(D-2)^2',
        exemplar: ann.text,
      },
      hint: '$D^{n}$ kills $x^{n-1}$; $(D-\\alpha)^{n}$ kills $x^{n-1}e^{\\alpha x}$; $(D^2-2\\alpha D+\\alpha^2+\\beta^2)^{n}$ kills $x^{n-1}e^{\\alpha x}\\cos\\beta x$.',
      solution: `$${ann.tex}$`,
      note: `Order ${ann.order}. Typed form: \`${ann.text}\``,
    }
  },
}

/** Pick the annihilator. */
export const annihilatorChoice: GeneratorDef = {
  id: 'annihilator-choice',
  name: 'Pick the annihilator',
  blurb: 'Wrong exponents, wrong signs, wrong quadratic.',
  section: '§4.5',
  topicId: 'annih',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const { q } = makeForcing(rng, [], undefined, false)
    const ann = annihilatorOf(q)
    const groups = forcingGroups(q)

    const variants: string[] = []
    // Exponent one too low, one too high.
    for (const delta of [-1, 1]) {
      const tex = groups
        .map((grp) => {
          const f = annihilatorOf([term(1, Math.max(0, grp.degree + delta), grp.a, grp.b, 'cos')])
          return f.tex
        })
        .join('')
      variants.push(tex)
    }
    // Sign of alpha flipped in every factor.
    variants.push(
      groups.map((grp) => annihilatorOf([term(1, grp.degree, -grp.a, grp.b, 'cos')]).tex).join(''),
    )
    // Factors added instead of multiplied.
    if (groups.length > 1) {
      variants.push(groups.map((grp) => annihilatorOf([term(1, grp.degree, grp.a, grp.b, 'cos')]).tex).join(' + '))
    }
    // A pure power of D, which only works when g is a polynomial.
    variants.push(ann.order > 1 ? `D^{${ann.order}}` : 'D')
    variants.push(`D^{${ann.order + 1}}`)
    // Exponent two too high, and the rate off by one.
    variants.push(
      groups
        .map((grp) => annihilatorOf([term(1, grp.degree + 2, grp.a, grp.b, 'cos')]).tex)
        .join(''),
    )
    variants.push(
      groups
        .map((grp) =>
          annihilatorOf([
            term(1, grp.degree, grp.b === 0 ? grp.a + 1 : grp.a, grp.b === 0 ? 0 : grp.b + 1, 'cos'),
          ]).tex,
        )
        .join(''),
    )

    const seen = new Set([ann.tex])
    const wrong: string[] = []
    for (const v of rng.shuffle(variants)) {
      if (seen.has(v)) continue
      seen.add(v)
      wrong.push(v)
      if (wrong.length >= 3) break
    }

    return {
      generatorId: 'annihilator-choice',
      topicId: 'annih',
      question: 'Which operator annihilates this function, with the lowest possible order?',
      statementTex: quasiTex(q),
      answer: { kind: 'choice', ...mathChoice(rng, ann.tex, wrong) },
      hint: 'One factor per group of $g$, with exponent one more than the highest power of $x$ in that group.',
      solution: `$${ann.tex}$, of order ${ann.order}.`,
    }
  },
}

/** From an annihilated equation, read off which terms survive as the trial form. */
export const annihilatorRoute: GeneratorDef = {
  id: 'annihilator-route',
  name: 'Annihilator to trial form',
  blurb: 'Apply the operator, take the roots, discard what is already in y_c.',
  section: '§4.5',
  topicId: 'annih',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const { roots, g } = setup(rng, 0.7)
    const ann = annihilatorOf(g)
    const target = trialTerms(g, roots)
    const correct = termsTrialTex(target)
    return {
      generatorId: 'annihilator-route',
      topicId: 'annih',
      question:
        'Applying the annihilator gives a homogeneous equation of higher order. Which part of its general solution is the trial $y_p$?',
      statementTex: odeTex(charPoly(roots), quasiTex(g)),
      givenLabel: 'Annihilator of g(x)',
      givenTex: ann.tex,
      answer: {
        kind: 'choice',
        ...mathChoice(rng, correct, wrongTrials(g, roots, target, rng)),
      },
      hint: 'The solutions already accounted for by $y_c$ are discarded; what remains is the trial form.',
      solution: `$y_c = ${generalSolutionTex(roots)}$ accounts for ${order(roots)} of the solutions; the remaining ones are $${correct}$.`,
      note: 'The combined operator is the annihilator times the original one, so its roots are the union of the two root sets — with multiplicities added where they overlap. That overlap is exactly what §4.4 handles with $x^{s}$.',
    }
  },
}

export const NONHOMOGENEOUS_GENERATORS: GeneratorDef[] = [
  trialEntry,
  trialChoice,
  shiftChoice,
  annihilatorEntry,
  annihilatorChoice,
  annihilatorRoute,
]
