/** Generated problems for §4.3: reading the case, and writing the general solution. */

import { fNum } from '../lib/frac'
import {
  basisTerms,
  CASE_LABEL,
  CASE_ZILL,
  caseOf,
  charEqTex,
  charPoly,
  factoredTex,
  generalSolutionTex,
  generalSolutionText,
  odeTex,
  order,
  rootsTex,
  type RootSet,
} from '../lib/roots'
import { deriveHomogeneous } from '../lib/derive'
import type { RNG } from '../lib/rng'
import { higherOrder, secondOrder, SECOND_ORDER_KINDS, type SecondOrderKind } from './rootgen'
import { wrongSolutions, type Distractor } from './distractors'
import { choiceAnswer } from './choice'
import type { GeneratorDef, Problem } from './types'

/** A path step can pin a generator to one root case; free practice passes nothing. */
const asKind = (variant?: string): SecondOrderKind | undefined =>
  (SECOND_ORDER_KINDS as readonly string[]).includes(variant ?? '')
    ? (variant as SecondOrderKind)
    : undefined

function discriminantLine(coeffs: readonly number[]): string {
  if (coeffs.length !== 3) return ''
  const [a, b, c] = coeffs
  const disc = b * b - 4 * a * c
  const sign = disc > 0 ? '>' : disc === 0 ? '=' : '<'
  return `$b^2 - 4ac = ${b}^2 - 4(${a})(${c}) = ${disc} ${sign} 0$`
}

const caseNameFor = (roots: RootSet): string => {
  const id = caseOf(roots)
  const zill = CASE_ZILL[id]
  return zill ? `${zill} — ${CASE_LABEL[id].toLowerCase()}` : CASE_LABEL[id]
}

const caseLabel = (kind: SecondOrderKind): string => {
  const id =
    kind === 'distinct' ? 'real-distinct' : kind === 'repeated' ? 'real-repeated' : 'complex-distinct'
  return `${CASE_ZILL[id]} — ${CASE_LABEL[id].toLowerCase()}`
}

/** Which of the three cases does this second-order equation fall into? */
export const caseTwo: GeneratorDef = {
  id: 'case-2',
  name: 'Name the case',
  blurb: 'Second-order equation in, Case I / II / III out.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'choice',
  variants: SECOND_ORDER_KINDS,
  generate: (rng: RNG, variant?: string): Problem => {
    const kind = asKind(variant) ?? rng.pick(SECOND_ORDER_KINDS)
    const roots = secondOrder(rng, kind)
    const coeffs = charPoly(roots)
    const wrong = SECOND_ORDER_KINDS.filter((k) => k !== kind).map(caseLabel)
    return {
      generatorId: 'case-2',
      topicId: 'roots2',
      question: 'Which case does the auxiliary equation fall into?',
      statementTex: odeTex(coeffs),
      answer: choiceAnswer(rng, caseLabel(kind), wrong),
      hint: 'Write the auxiliary equation and look at the sign of $b^2 - 4ac$.',
      solution: `$${charEqTex(coeffs)}$, so $${rootsTex(roots)}$.`,
      note: discriminantLine(coeffs),
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Read the roots off the equation, with no solution asked for. */
export const rootsOnly: GeneratorDef = {
  id: 'roots-only',
  name: 'Find the roots',
  blurb: 'Just the algebra: factor the auxiliary equation and read $m$.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'choice',
  variants: SECOND_ORDER_KINDS,
  generate: (rng: RNG, variant?: string): Problem => {
    const kind = asKind(variant) ?? rng.pick(SECOND_ORDER_KINDS)
    const roots = secondOrder(rng, kind)
    const coeffs = charPoly(roots)
    const correct = rootsTex(roots)

    // Distractors here are root sets, not solutions, so build them directly.
    const wrong: Distractor[] = []
    const seen = new Set([correct])
    const consider = (d: Distractor) => {
      if (seen.has(d.tex) || wrong.length >= 3) return
      seen.add(d.tex)
      wrong.push(d)
    }
    for (const other of SECOND_ORDER_KINDS.filter((k) => k !== kind)) {
      const alt = secondOrder(rng, other)
      consider({
        tex: rootsTex(alt),
        why: `Those roots are ${caseLabel(other).toLowerCase()}. Check the discriminant: ${discriminantLine(coeffs).replace(/^\$|\$$/g, '')}.`,
      })
    }
    const [a, b, c] = coeffs.length === 3 ? coeffs : [1, 0, 0]
    consider({
      tex: rootsTex(secondOrder(rng, kind)),
      why: `Right shape, wrong numbers. Substitute back: each root must satisfy $${a}m^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}m ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0$.`,
    })

    return {
      generatorId: 'roots-only',
      topicId: 'roots2',
      question: 'What are the roots of the auxiliary equation?',
      statementTex: odeTex(coeffs),
      answer: choiceAnswer(rng, correct, wrong, { math: true }),
      hint: `The auxiliary equation is $${charEqTex(coeffs)}$. Factor it, or use the quadratic formula.`,
      solution: `$${charEqTex(coeffs)}$ factors as $${factoredTex(roots)} = 0$, so $${correct}$.`,
      note: discriminantLine(coeffs),
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Pick the general solution from four forms. */
export const generalTwoChoice: GeneratorDef = {
  id: 'general-2-choice',
  name: 'Pick the general solution',
  blurb: 'Four forms, three of them a specific mistake.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'choice',
  variants: SECOND_ORDER_KINDS,
  generate: (rng: RNG, variant?: string): Problem => {
    const roots = secondOrder(rng, asKind(variant))
    const coeffs = charPoly(roots)
    const correct = generalSolutionTex(roots)
    return {
      generatorId: 'general-2-choice',
      topicId: 'roots2',
      question: 'Which is the general solution?',
      statementTex: odeTex(coeffs),
      answer: choiceAnswer(rng, correct, wrongSolutions(roots, rng, 3), { math: true }),
      hint: `The auxiliary equation is $${charEqTex(coeffs)}$.`,
      solution: `$${rootsTex(roots)}$ — ${caseNameFor(roots).toLowerCase()} — so $y = ${correct}$.`,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Type the general solution of a second-order equation. */
export const generalTwoEntry: GeneratorDef = {
  id: 'general-2',
  name: 'General solution, order 2',
  blurb: 'Type it. Any valid fundamental set is accepted.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'entry',
  variants: SECOND_ORDER_KINDS,
  generate: (rng: RNG, variant?: string): Problem => {
    const roots = secondOrder(rng, asKind(variant))
    const coeffs = charPoly(roots)
    return {
      generatorId: 'general-2',
      topicId: 'roots2',
      question: 'Write the general solution.',
      statementTex: odeTex(coeffs),
      answer: {
        kind: 'span',
        target: basisTerms(roots),
        count: 2,
        placeholder: 'c1*e^(2x) + c2*x*e^(2x)',
        exemplar: generalSolutionText(roots),
      },
      hint: `Auxiliary equation: $${charEqTex(coeffs)}$.`,
      solution: `$${rootsTex(roots)}$, so $y = ${generalSolutionTex(roots)}$.`,
      operator: coeffs,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Type the general solution of a third- or fourth-order equation. */
export const generalHigherEntry: GeneratorDef = {
  id: 'general-n',
  name: 'General solution, order 3-4',
  blurb: 'Multiplicities and repeated complex pairs.',
  section: '§4.3',
  topicId: 'rootsn',
  mode: 'entry',
  generate: (rng: RNG): Problem => {
    const roots = higherOrder(rng)
    const coeffs = charPoly(roots)
    const n = order(roots)
    return {
      generatorId: 'general-n',
      topicId: 'rootsn',
      question: 'Write the general solution.',
      statementTex: odeTex(coeffs),
      answer: {
        kind: 'span',
        target: basisTerms(roots),
        count: n,
        placeholder: 'c1*e^(-x) + c2*x*e^(-x) + c3*cos(2x) + c4*sin(2x)',
        exemplar: generalSolutionText(roots),
      },
      hint: `Auxiliary equation: $${charEqTex(coeffs)}$. It factors as $${factoredTex(roots)}$.`,
      solution: `$${rootsTex(roots)}$, so $y = ${generalSolutionTex(roots)}$.`,
      note: `Order ${n}, so the answer carries ${n} arbitrary constants.`,
      operator: coeffs,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Given the factored auxiliary polynomial, pick the general solution. */
export const fromFactored: GeneratorDef = {
  id: 'from-factored',
  name: 'Factored form to solution',
  blurb: 'Skip the algebra; read the basis straight off the multiplicities.',
  section: '§4.3',
  topicId: 'rootsn',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const roots = higherOrder(rng)
    const correct = generalSolutionTex(roots)
    return {
      generatorId: 'from-factored',
      topicId: 'rootsn',
      question: 'The auxiliary equation factors as shown. Which is the general solution?',
      statementTex: `${factoredTex(roots)} = 0`,
      answer: choiceAnswer(rng, correct, wrongSolutions(roots, rng, 3), { math: true }),
      hint: 'A factor of multiplicity $k$ brings in powers of $x$ up to $x^{k-1}$.',
      solution: `$${rootsTex(roots)}$, so $y = ${correct}$.`,
      note: `Order ${order(roots)}, so ${order(roots)} constants.`,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Given the general solution, name the differential equation. */
export const reverseOde: GeneratorDef = {
  id: 'reverse-ode',
  name: 'Solution to equation',
  blurb: 'Run §4.3 backwards: read the roots off the solution and rebuild the ODE.',
  section: '§4.3',
  topicId: 'rootsn',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const roots = rng.bool(0.55) ? secondOrder(rng) : higherOrder(rng)
    const coeffs = charPoly(roots)
    const correct = odeTex(coeffs)

    const candidates: Distractor[] = [
      {
        tex: odeTex(coeffs.map((c, i) => ((coeffs.length - 1 - i) % 2 === 1 ? -c : c))),
        why: 'Flipping the signs of the odd-order coefficients negates every root. Check one: substitute a root of your equation back into its auxiliary equation.',
      },
      {
        tex: odeTex(coeffs.map((c, i) => (i === coeffs.length - 1 ? -c : c))),
        why: 'The constant term has the wrong sign. It is the product of the roots (up to sign from the degree), so it is worth checking last against the factored form.',
      },
      {
        tex: odeTex(coeffs.slice().reverse()),
        why: 'The coefficients are in the wrong order. The highest-order derivative takes the leading coefficient of the auxiliary polynomial, not the constant term.',
      },
      ...coeffs.flatMap((_, i) =>
        [1, -1].map((d) => ({
          tex: odeTex(coeffs.map((c, j) => (i === j ? c + d : c))),
          why: `One coefficient is off by one. Expanding $${factoredTex(roots)}$ gives $${charEqTex(coeffs)}$ — multiply it out term by term.`,
        })),
      ),
    ]

    const seen = new Set<string>([correct])
    const wrong: Distractor[] = []
    for (const cand of rng.shuffle(candidates)) {
      if (wrong.length >= 3 || seen.has(cand.tex) || cand.tex.startsWith('0 =')) continue
      seen.add(cand.tex)
      wrong.push(cand)
    }

    return {
      generatorId: 'reverse-ode',
      topicId: 'rootsn',
      question: 'This is the general solution of which equation?',
      statementTex: `y = ${generalSolutionTex(roots)}`,
      answer: choiceAnswer(rng, correct, wrong, { math: true }),
      hint: 'Read the roots off the solution, build $\\prod(m - m_i) = 0$, then swap $m^{k}$ for $y^{(k)}$.',
      solution: `The solution shows $${rootsTex(roots)}$, giving $${charEqTex(coeffs)}$ and so $${correct}$.`,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** How many arbitrary constants, and what basis, does a stated root list give? */
export const rootsToBasis: GeneratorDef = {
  id: 'roots-to-basis',
  name: 'Roots to basis',
  blurb: 'Just the roots, no equation — the core translation, isolated.',
  section: '§4.3',
  topicId: 'rootsn',
  mode: 'entry',
  generate: (rng: RNG): Problem => {
    const roots = rng.bool(0.5) ? secondOrder(rng) : higherOrder(rng)
    const n = order(roots)
    return {
      generatorId: 'roots-to-basis',
      topicId: 'rootsn',
      question: 'These are the roots of the auxiliary equation. Write the general solution.',
      statementTex: rootsTex(roots),
      answer: {
        kind: 'span',
        target: basisTerms(roots),
        count: n,
        placeholder: 'c1*e^(3x) + c2*x*e^(3x)',
        exemplar: generalSolutionText(roots),
      },
      hint: 'Each root of multiplicity $k$ contributes $k$ solutions, with powers of $x$ up to $x^{k-1}$.',
      solution: `$y = ${generalSolutionTex(roots)}$`,
      note: `Order ${n}, so ${n} constants.`,
      operator: charPoly(roots),
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

/** Read the long-run behaviour off the roots. */
export const behaviour: GeneratorDef = {
  id: 'behaviour',
  name: 'Long-run behaviour',
  blurb: 'What the roots say about the solution as $x \\to \\infty$.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const roots = secondOrder(rng)
    const coeffs = charPoly(roots)
    const parts = roots.map((r) => (r.kind === 'real' ? fNum(r.m) : fNum(r.a)))
    const maxRe = Math.max(...parts)
    const oscillates = roots.some((r) => r.kind === 'complex')

    const correct = oscillates
      ? maxRe < 0
        ? 'Oscillates with amplitude decaying to zero'
        : maxRe === 0
          ? 'Oscillates forever at constant amplitude'
          : 'Oscillates with amplitude growing without bound'
      : maxRe < 0
        ? 'Decays to zero without oscillating'
        : maxRe === 0
          ? 'Approaches a nonzero constant, or grows like a power of $x$'
          : 'Grows without bound, no oscillation'

    const pool = [
      'Oscillates with amplitude decaying to zero',
      'Oscillates forever at constant amplitude',
      'Oscillates with amplitude growing without bound',
      'Decays to zero without oscillating',
      'Approaches a nonzero constant, or grows like a power of $x$',
      'Grows without bound, no oscillation',
    ].filter((s) => s !== correct)

    return {
      generatorId: 'behaviour',
      topicId: 'roots2',
      question: 'How does a typical solution behave as $x \\to \\infty$?',
      statementTex: odeTex(coeffs),
      answer: choiceAnswer(rng, correct, rng.sample(pool, 3)),
      hint: 'The real part of each root sets growth or decay; a nonzero imaginary part is what oscillates.',
      solution: `$${rootsTex(roots)}$ — largest real part $${maxRe}$${oscillates ? ', with a nonzero imaginary part' : ''}. ${correct}.`,
      derivation: () => deriveHomogeneous(roots),
    }
  },
}

export const HOMOGENEOUS_GENERATORS: GeneratorDef[] = [
  caseTwo,
  rootsOnly,
  generalTwoChoice,
  generalTwoEntry,
  generalHigherEntry,
  fromFactored,
  reverseOde,
  rootsToBasis,
  behaviour,
]
