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
import { deriveAnnihilator, deriveTrial } from '../lib/derive'
import { choiceAnswer } from './choice'
import type { Distractor } from './distractors'
import { makeForcing } from './forcing'
import { higherOrder, secondOrder } from './rootgen'
import type { GeneratorDef, Problem } from './types'

/**
 * Roots plus a forcing function. `variant` lets a path step ask for a forcing
 * function that definitely does (or definitely does not) duplicate y_c, so the
 * multiplication rule can be introduced separately from the trial form itself.
 */
const RESONANCE = ['plain', 'resonant'] as const

function setup(rng: RNG, variant?: string, resonantBias = 0.6) {
  const roots = rng.bool(0.75) ? secondOrder(rng) : higherOrder(rng)
  const resonant =
    variant === 'resonant' ? true : variant === 'plain' ? false : rng.bool(resonantBias)
  let g = makeForcing(rng, roots, undefined, resonant).q
  if (variant) {
    // Confirm the choice actually landed; resample a few times if it did not.
    let guard = 0
    while (guard++ < 25) {
      const shifted = forcingGroups(g).some((grp) => multiplicationShift(grp, roots) > 0)
      if (shifted === (variant === 'resonant')) break
      g = makeForcing(rng, roots, undefined, resonant).q
    }
  }
  return { roots, g }
}

/** Trial forms built on a deliberately wrong reading of the rule, each named. */
function wrongTrials(g: QTerm[], roots: RootSet, correct: QTerm[], rng: RNG): Distractor[] {
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

  const anyShift = shifted.some((s) => s > 0)
  const maxShift = Math.max(0, ...shifted)

  const candidates: { terms: QTerm[]; why: string }[] = [
    {
      terms: build(shifted.map(() => 0)),
      why: anyShift
        ? `The multiplication rule was skipped. A term built on a root of the auxiliary equation already solves the homogeneous equation, so substituting this back gives zero and no coefficients can be found. Multiply that group by $x^{${maxShift}}$.`
        : 'The powers of $x$ here do not match the degree of $g(x)$.',
    },
    {
      terms: build(shifted.map((s) => s + 1)),
      why: 'One power of $x$ too many. $s$ is exactly the multiplicity of the root — no more. An oversized trial form still works algebraically, but the extra coefficients all come out zero.',
    },
    {
      terms: build(shifted.map((s) => Math.max(0, s - 1))),
      why: 'One power of $x$ too few, so part of this still duplicates $y_c$.',
    },
    {
      terms: build(shifted.map((s, i) => (i === 0 ? s + 1 : s))),
      why: 'The $x$-multiplier was applied unevenly. Each group of $g(x)$ gets the multiplicity of its own root, decided separately.',
    },
    {
      terms: build(shifted.map((s) => s + 2)),
      why: `Two powers of $x$ too many. $s$ is the multiplicity of the root and nothing else — here ${anyShift ? `$s = ${maxShift}$` : '$s = 0$'}.`,
    },
    {
      terms: [
        ...correct,
        term(
          1,
          (correct.at(-1)?.k ?? 0) + 1,
          correct.at(-1)?.a ?? 0,
          correct.at(-1)?.b ?? 0,
          'cos',
        ),
      ],
      why: 'One term too many at the top end. The degree of the trial polynomial matches the degree in $g(x)$; going higher only adds coefficients that solve to zero.',
    },
  ]

  // Cosine kept, sine partner dropped — the trig case done by half.
  const halfTrig = correct.filter((t) => t.b === 0 || t.trig === 'cos')
  if (halfTrig.length !== correct.length) {
    candidates.push({
      terms: halfTrig,
      why: 'The sine partner is missing. Differentiating a cosine produces a sine, so both have to be in the trial form even when only one appears in $g(x)$.',
    })
  }

  // Lowest-degree term dropped, the "only the leading power" answer.
  if (correct.length > 1) {
    candidates.push({
      terms: correct.slice(0, -1),
      why: 'A term is missing. The trial form needs every power of $x$ from the top degree down to zero, because differentiating the leading term produces all of them.',
    })
  }

  const correctTex = termsTrialTex(correct)
  const seen = new Set([correctTex])
  const out: Distractor[] = []
  for (const cand of rng.shuffle(candidates)) {
    if (!cand.terms.length) continue
    const tex = termsTrialTex(cand.terms)
    if (seen.has(tex)) continue
    seen.add(tex)
    out.push({ tex, why: cand.why })
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
  variants: RESONANCE,
  generate: (rng: RNG, variant?: string): Problem => {
    const { roots, g } = setup(rng, variant)
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
      derivation: () => deriveTrial(g, roots),
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
  variants: RESONANCE,
  generate: (rng: RNG, variant?: string): Problem => {
    const { roots, g } = setup(rng, variant)
    const target = trialTerms(g, roots)
    const correct = termsTrialTex(target)
    return {
      generatorId: 'trial-choice',
      topicId: 'trial',
      question: 'Which is the correct trial form for $y_p$?',
      statementTex: odeTex(charPoly(roots), quasiTex(g)),
      givenLabel: 'Complementary function',
      givenTex: `y_c = ${generalSolutionTex(roots)}`,
      answer: choiceAnswer(rng, correct, wrongTrials(g, roots, target, rng), { math: true }),
      hint: 'Check each group of $g(x)$ against $y_c$ before writing anything down.',
      solution: `$y_p = ${trialTex(g, roots)}$`,
      note: shiftExplanation(g, roots),
      derivation: () => deriveTrial(g, roots),
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
  variants: RESONANCE,
  generate: (rng: RNG, variant?: string): Problem => {
    // A single-group forcing function keeps the answer a single number.
    const resonant = variant === 'resonant' ? true : variant === 'plain' ? false : rng.bool(0.65)
    const roots = rng.bool(0.7) ? secondOrder(rng) : higherOrder(rng)
    let g = makeForcing(rng, roots, undefined, resonant).q
    let groups = forcingGroups(g)
    let guard = 0
    while (guard++ < 25) {
      const ok =
        groups.length === 1 &&
        (!variant || multiplicationShift(groups[0], roots) > 0 === (variant === 'resonant'))
      if (ok) break
      g = makeForcing(rng, roots, undefined, resonant).q
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
      answer: choiceAnswer(rng, correct, pool.slice(0, 3)),
      hint: '$s$ is the multiplicity, as a root of the auxiliary equation, of the rate the forcing term is built on.',
      solution: shiftExplanation(g, roots),
      note: `$y_p = ${trialTex(g, roots)}$`,
      derivation: () => deriveTrial(g, roots),
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
      derivation: () => deriveAnnihilator(q),
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

    const byGroup = (map: (grp: (typeof groups)[number]) => number[], why: string): Distractor => ({
      tex: groups
        .map((grp) => {
          const [k, a, b] = map(grp)
          return annihilatorOf([term(1, k, a, b, 'cos')]).tex
        })
        .join(''),
      why,
    })

    const variants: Distractor[] = [
      byGroup(
        (grp) => [Math.max(0, grp.degree - 1), grp.a, grp.b],
        'The exponent is one too low, so one power of $x$ survives. A group whose highest power is $x^{k}$ needs its factor raised to $k+1$.',
      ),
      byGroup(
        (grp) => [grp.degree + 1, grp.a, grp.b],
        'That does annihilate $g(x)$, but not with the least order. Every extra power inflates the auxiliary equation and adds coefficients that come out zero.',
      ),
      byGroup(
        (grp) => [grp.degree, -grp.a, grp.b],
        'The sign of the exponential rate is flipped. $e^{\\alpha x}$ is killed by $(D - \\alpha)$, matching the root $m = \\alpha$ — the same sign convention as the auxiliary equation.',
      ),
      byGroup(
        (grp) => [grp.degree, grp.b === 0 ? grp.a + 1 : grp.a, grp.b === 0 ? 0 : grp.b + 1],
        'The rate or frequency does not match $g(x)$. Read $\\alpha$ and $\\beta$ straight off the exponential and the trig argument.',
      ),
      {
        tex: ann.order > 1 ? `D^{${ann.order}}` : 'D',
        why: 'A pure power of $D$ only annihilates polynomials. An exponential or a trig factor survives any number of plain derivatives.',
      },
    ]
    if (groups.length > 1) {
      variants.push({
        tex: groups.map((grp) => annihilatorOf([term(1, grp.degree, grp.a, grp.b, 'cos')]).tex).join(' + '),
        why: 'The factors are added rather than multiplied. Applying $L_1L_2$ kills both pieces; applying $L_1 + L_2$ kills neither.',
      })
    }

    const seen = new Set([ann.tex])
    const wrong: Distractor[] = []
    for (const v of rng.shuffle(variants)) {
      if (seen.has(v.tex)) continue
      seen.add(v.tex)
      wrong.push(v)
      if (wrong.length >= 3) break
    }

    return {
      generatorId: 'annihilator-choice',
      topicId: 'annih',
      question: 'Which operator annihilates this function, with the lowest possible order?',
      statementTex: quasiTex(q),
      answer: choiceAnswer(rng, ann.tex, wrong, { math: true }),
      hint: 'One factor per group of $g$, with exponent one more than the highest power of $x$ in that group.',
      solution: `$${ann.tex}$, of order ${ann.order}.`,
      derivation: () => deriveAnnihilator(q),
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
    const { roots, g } = setup(rng, undefined, 0.7)
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
      answer: choiceAnswer(rng, correct, wrongTrials(g, roots, target, rng), { math: true }),
      hint: 'The solutions already accounted for by $y_c$ are discarded; what remains is the trial form.',
      solution: `$y_c = ${generalSolutionTex(roots)}$ accounts for ${order(roots)} of the solutions; the remaining ones are $${correct}$.`,
      derivation: () => deriveTrial(g, roots),
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
