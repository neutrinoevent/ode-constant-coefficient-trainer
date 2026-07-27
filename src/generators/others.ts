/** Generated problems for §4.7 (Cauchy-Euler) and §5.1 (damped motion). */

import {
  cauchyAuxiliaryTex,
  cauchyFromRoots,
  cauchySolutionTex,
  cauchySolutionText,
  cauchyTex,
  type CauchyEuler,
} from '../lib/cauchy'
import { fNum, frac } from '../lib/frac'
import {
  CASE_LABEL,
  CASE_ZILL,
  caseOf,
  complex,
  real,
  rootsTex,
  type CaseId,
  type RootSet,
} from '../lib/roots'
import type { RNG } from '../lib/rng'
import type { GeneratorDef, Problem } from './types'

function shuffleWithAnswer(rng: RNG, correct: string, wrong: string[]) {
  const options = rng.shuffle([correct, ...wrong])
  return { options, correctIndex: options.indexOf(correct) }
}

const SMALL = [-3, -2, -1, 1, 2, 3] as const

function cauchySetup(rng: RNG): CauchyEuler {
  const kind = rng.pick(['distinct', 'repeated', 'complex'] as const)
  let roots: RootSet
  if (kind === 'distinct') {
    const [a, b] = rng.sample([-3, -2, -1, 0, 1, 2, 3] as const, 2)
    roots = [real(frac(a)), real(frac(b))]
  } else if (kind === 'repeated') {
    roots = [real(frac(rng.pick(SMALL)), 2)]
  } else {
    roots = [complex(frac(rng.pick([0, 1, 2, -1] as const)), frac(rng.pick([1, 2, 3] as const)))]
  }
  return cauchyFromRoots(roots, rng.bool(0.2) ? 2 : 1)
}

/** Solutions of a Cauchy-Euler equation, as sampled functions on x > 0. */
function cauchyBasis(roots: RootSet): ((x: number) => number)[] {
  const out: ((x: number) => number)[] = []
  for (const r of roots) {
    if (r.kind === 'real') {
      const m = fNum(r.m)
      for (let k = 0; k < r.mult; k++) {
        out.push((x) => Math.pow(x, m) * Math.pow(Math.log(x), k))
      }
    } else {
      const a = fNum(r.a)
      const b = fNum(r.b)
      for (let k = 0; k < r.mult; k++) {
        out.push((x) => Math.pow(x, a) * Math.pow(Math.log(x), k) * Math.cos(b * Math.log(x)))
        out.push((x) => Math.pow(x, a) * Math.pow(Math.log(x), k) * Math.sin(b * Math.log(x)))
      }
    }
  }
  return out
}

/** Which of the three Cauchy-Euler cases? */
export const cauchyCase: GeneratorDef = {
  id: 'cauchy-case',
  name: 'Cauchy-Euler case',
  blurb: 'The auxiliary equation is not what it looks like — expand $m(m-1)$ first.',
  section: '§4.7',
  topicId: 'cauchy',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const eq = cauchySetup(rng)
    const id = caseOf(eq.roots)
    const label = (k: CaseId) => `${CASE_ZILL[k] ?? ''} — ${CASE_LABEL[k].toLowerCase()}`.trim()
    const correct = label(id)
    const wrong = (['real-distinct', 'real-repeated', 'complex-distinct'] as CaseId[])
      .filter((k) => k !== id)
      .map(label)
    return {
      generatorId: 'cauchy-case',
      topicId: 'cauchy',
      question: 'Which case do the roots of the auxiliary equation fall into?',
      statementTex: cauchyTex(eq),
      answer: { kind: 'choice', ...shuffleWithAnswer(rng, correct, wrong) },
      hint: `Substituting $y = x^{m}$ gives $${cauchyAuxiliaryTex(eq)}$.`,
      solution: `$${cauchyAuxiliaryTex(eq)}$, that is $${eq.auxiliary[0]}m^2 ${eq.auxiliary[1] < 0 ? '-' : '+'} ${Math.abs(eq.auxiliary[1])}m ${eq.auxiliary[2] < 0 ? '-' : '+'} ${Math.abs(eq.auxiliary[2])} = 0$, so $${rootsTex(eq.roots)}$.`,
    }
  },
}

/** Type the general solution of a Cauchy-Euler equation. */
export const cauchyEntry: GeneratorDef = {
  id: 'cauchy-solve',
  name: 'Cauchy-Euler solution',
  blurb: 'Same three cases, with $\\ln x$ where $x$ used to be.',
  section: '§4.7',
  topicId: 'cauchy',
  mode: 'entry',
  generate: (rng: RNG): Problem => {
    const eq = cauchySetup(rng)
    return {
      generatorId: 'cauchy-solve',
      topicId: 'cauchy',
      question: 'Write the general solution on $x > 0$.',
      statementTex: cauchyTex(eq),
      answer: {
        kind: 'span',
        target: cauchyBasis(eq.roots),
        count: 2,
        domain: [1.15, 3.4],
        placeholder: 'c1*x^2 + c2*x^2*ln(x)',
        exemplar: cauchySolutionText(eq.roots),
      },
      hint: `Substitute $y = x^{m}$: $${cauchyAuxiliaryTex(eq)}$.`,
      solution: `$${rootsTex(eq.roots)}$, so $y = ${cauchySolutionTex(eq.roots)}$.`,
      note: 'Type `ln(x)` for the logarithm. The answer is checked on $x > 0$, where the equation is nonsingular.',
    }
  },
}

const DAMPING_LABELS = {
  over: 'Overdamped — decays without oscillating',
  critical: 'Critically damped — repeated root, no oscillation',
  under: 'Underdamped — oscillates inside a decaying envelope',
  none: 'Undamped — oscillates forever at constant amplitude',
}

/** Classify a spring-mass system from m, beta, k. */
export const dampingRegime: GeneratorDef = {
  id: 'damping',
  name: 'Damping regime',
  blurb: 'The same discriminant, read as motion.',
  section: '§5.1',
  topicId: 'damping',
  mode: 'choice',
  generate: (rng: RNG): Problem => {
    const kind = rng.pick(['over', 'critical', 'under', 'none'] as const)
    let m = rng.int(1, 4)
    let k = rng.int(1, 9)
    let beta: number
    if (kind === 'none') {
      beta = 0
    } else if (kind === 'critical') {
      // beta^2 = 4mk, so pick beta even and factor it.
      const half = rng.int(1, 6)
      beta = 2 * half
      m = rng.pick([1, half] as const)
      k = (half * half) / m
      if (!Number.isInteger(k)) {
        m = 1
        k = half * half
      }
    } else if (kind === 'over') {
      beta = Math.ceil(Math.sqrt(4 * m * k)) + rng.int(1, 4)
    } else {
      beta = Math.max(1, Math.floor(Math.sqrt(4 * m * k)) - rng.int(1, 3))
      if (beta * beta >= 4 * m * k) beta = 1
    }
    const disc = beta * beta - 4 * m * k
    const actual = beta === 0 ? 'none' : disc > 0 ? 'over' : disc === 0 ? 'critical' : 'under'
    const correct = DAMPING_LABELS[actual]
    const wrong = (Object.keys(DAMPING_LABELS) as (keyof typeof DAMPING_LABELS)[])
      .filter((key) => key !== actual)
      .map((key) => DAMPING_LABELS[key])

    const eq = `${m === 1 ? '' : m}\\frac{d^2x}{dt^2} ${beta === 0 ? '' : `+ ${beta === 1 ? '' : beta}\\frac{dx}{dt} `}+ ${k === 1 ? '' : k}x = 0`
    return {
      generatorId: 'damping',
      topicId: 'damping',
      question: 'Which regime is this system in?',
      statementTex: eq,
      answer: { kind: 'choice', ...shuffleWithAnswer(rng, correct, wrong) },
      hint: 'Look at $\\beta^2 - 4mk$.',
      solution: `$\\beta^2 - 4mk = ${beta}^2 - 4(${m})(${k}) = ${disc}$. ${correct}.`,
    }
  },
}

export const OTHER_GENERATORS: GeneratorDef[] = [cauchyCase, cauchyEntry, dampingRegime]
