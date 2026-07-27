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
import type { RNG } from '../lib/rng'
import { higherOrder, secondOrder, SECOND_ORDER_KINDS } from './rootgen'
import { wrongSolutions } from './distractors'
import type { GeneratorDef, Problem } from './types'

/** Options are rich text: prose as-is, expressions wrapped so they render as math. */
function shuffleWithAnswer(rng: RNG, correct: string, wrong: string[]) {
  const options = rng.shuffle([correct, ...wrong])
  return { options, correctIndex: options.indexOf(correct) }
}

function mathChoice(rng: RNG, correct: string, wrong: string[]) {
  const order = rng.shuffle([correct, ...wrong])
  return { options: order.map((t) => `$${t}$`), correctIndex: order.indexOf(correct) }
}

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

/** Which of the three cases does this second-order equation fall into? */
export const caseTwo: GeneratorDef = {
  id: 'case-2',
  name: 'Name the case',
  blurb: 'Second-order equation in, Case I / II / III out.',
  section: '§4.3',
  topicId: 'roots2',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const kind = rng.pick(SECOND_ORDER_KINDS)
    const roots = secondOrder(rng, kind)
    const coeffs = charPoly(roots)
    const correct = caseNameFor(roots)
    const wrong = SECOND_ORDER_KINDS.filter((k) => k !== kind).map((k) => {
      const id =
        k === 'distinct' ? 'real-distinct' : k === 'repeated' ? 'real-repeated' : 'complex-distinct'
      return `${CASE_ZILL[id]} — ${CASE_LABEL[id].toLowerCase()}`
    })
    return {
      generatorId: 'case-2',
      topicId: 'roots2',
      question: 'Which case does the auxiliary equation fall into?',
      statementTex: odeTex(coeffs),
      answer: { kind: 'choice', ...shuffleWithAnswer(rng, correct, wrong) },
      hint: 'Write the auxiliary equation and look at the sign of $b^2 - 4ac$.',
      solution: `$${charEqTex(coeffs)}$, so $${rootsTex(roots)}$.`,
      note: discriminantLine(coeffs),
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
  generate: (rng: RNG): Problem => {
    const roots = secondOrder(rng)
    const coeffs = charPoly(roots)
    const correct = generalSolutionTex(roots)
    const wrong = wrongSolutions(roots, rng, 3)
    return {
      generatorId: 'general-2-choice',
      topicId: 'roots2',
      question: 'Which is the general solution?',
      statementTex: odeTex(coeffs),
      answer: { kind: 'choice', ...mathChoice(rng, correct, wrong) },
      hint: `The auxiliary equation is $${charEqTex(coeffs)}$.`,
      solution: `$${rootsTex(roots)}$ — ${caseNameFor(roots).toLowerCase()} — so $y = ${correct}$.`,
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
  generate: (rng: RNG): Problem => {
    const roots = secondOrder(rng)
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
    const wrong = wrongSolutions(roots, rng, 3)
    return {
      generatorId: 'from-factored',
      topicId: 'rootsn',
      question: 'The auxiliary equation factors as shown. Which is the general solution?',
      statementTex: `${factoredTex(roots)} = 0`,
      answer: { kind: 'choice', ...mathChoice(rng, correct, wrong) },
      hint: 'A factor of multiplicity $k$ brings in powers of $x$ up to $x^{k-1}$.',
      solution: `$${rootsTex(roots)}$, so $y = ${correct}$.`,
      note: `Order ${order(roots)}, so ${order(roots)} constants.`,
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

    const candidates = [
      // Sign of the odd-order coefficients flipped: every root negated.
      coeffs.map((c, i) => ((coeffs.length - 1 - i) % 2 === 1 ? -c : c)),
      // Constant term sign lost.
      coeffs.map((c, i) => (i === coeffs.length - 1 ? -c : c)),
      // Coefficients read off in the wrong order.
      coeffs.slice().reverse(),
      // One coefficient off by one, in each slot.
      ...coeffs.flatMap((_, i) =>
        [1, -1].map((d) => coeffs.map((c, j) => (i === j ? c + d : c))),
      ),
    ]
    const seen = new Set<string>([correct])
    const wrong: string[] = []
    for (const cand of rng.shuffle(candidates)) {
      if (cand[0] === 0 || wrong.length >= 3) continue
      const tex = odeTex(cand)
      if (seen.has(tex)) continue
      seen.add(tex)
      wrong.push(tex)
    }

    return {
      generatorId: 'reverse-ode',
      topicId: 'rootsn',
      question: 'This is the general solution of which equation?',
      statementTex: `y = ${generalSolutionTex(roots)}`,
      answer: { kind: 'choice', ...mathChoice(rng, correct, wrong) },
      hint: 'Read the roots off the solution, build $\\prod(m - m_i) = 0$, then swap $m^{k}$ for $y^{(k)}$.',
      solution: `The solution shows $${rootsTex(roots)}$, giving $${charEqTex(coeffs)}$ and so $${correct}$.`,
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
      answer: { kind: 'choice', ...shuffleWithAnswer(rng, correct, rng.sample(pool, 3)) },
      hint: 'The real part of each root sets growth or decay; a nonzero imaginary part is what oscillates.',
      solution: `$${rootsTex(roots)}$ — largest real part $${maxRe}$${oscillates ? ', with a nonzero imaginary part' : ''}. ${correct}.`,
    }
  },
}

export const HOMOGENEOUS_GENERATORS: GeneratorDef[] = [
  caseTwo,
  generalTwoChoice,
  generalTwoEntry,
  generalHigherEntry,
  fromFactored,
  reverseOde,
  rootsToBasis,
  behaviour,
]
