/**
 * Worked derivations, computed rather than written.
 *
 * Every intermediate a student needs to see is already recoverable from the
 * root set: substitute, factor out, factor, read the roots, name the case,
 * attach a basis function to each root, collect. Producing those steps from the
 * same object the problem was generated from means the worked example is always
 * about the numbers actually on screen, and can never drift from the answer
 * being graded.
 */

import { fNum } from './frac'
import {
  CASE_LABEL,
  CASE_ZILL,
  caseOf,
  charEqTex,
  charPoly,
  derivTex,
  factoredTex,
  generalSolutionTex,
  odeTex,
  order,
  rootsTex,
  type Root,
  type RootSet,
} from './roots'
import { quasiTex, termTex, type Quasi } from './quasipoly'
import { forcingGroups, multiplicationShift, trialTex } from './undetermined'
import { annihilatorOf } from './annihilator'
import {
  cauchyAuxiliaryTex,
  cauchySolutionTex,
  cauchyTex,
  type CauchyEuler,
} from './cauchy'

export interface DerivationStep {
  /** Short imperative label for the left column. */
  label: string
  /** Display math for this step, if it has any. */
  tex?: string
  /** Rich text: the reason this step is legal, or what to read off it. */
  text?: string
}

const numText = (v: number): string =>
  Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))

/** "e^{3x}", "xe^{-x}", "e^{-x}\cos 2x" — the basis functions a root contributes. */
function contributionTex(r: Root): string[] {
  const out: string[] = []
  if (r.kind === 'real') {
    const a = fNum(r.m)
    for (let k = 0; k < r.mult; k++) out.push(termTex({ c: 1, k, a, b: 0, trig: 'cos' }))
  } else {
    const a = fNum(r.a)
    const b = fNum(r.b)
    for (let k = 0; k < r.mult; k++) {
      out.push(termTex({ c: 1, k, a, b, trig: 'cos' }))
      out.push(termTex({ c: 1, k, a, b, trig: 'sin' }))
    }
  }
  return out
}

/** Why that root contributes those functions, in one sentence. */
function contributionReason(r: Root): string {
  if (r.kind === 'real') {
    const m = numText(fNum(r.m))
    if (r.mult === 1) return `$m = ${m}$ is a simple root, so it contributes one solution.`
    if (r.mult === 2)
      return `$m = ${m}$ is a double root. One exponential is only one solution, so reduction of order supplies the second by multiplying it by $x$.`
    return `$m = ${m}$ has multiplicity ${r.mult}, so it contributes ${r.mult} solutions: powers of $x$ up to $x^{${r.mult - 1}}$ times the exponential.`
  }
  const a = numText(fNum(r.a))
  const b = numText(fNum(r.b))
  const pair = `$m = ${fNum(r.a) === 0 ? '' : a} \\pm ${b}i$`
  if (r.mult === 1)
    return `${pair} is a conjugate pair. Euler's formula turns $e^{(\\alpha \\pm i\\beta)x}$ into real combinations: one $\\cos$ and one $\\sin$, both riding on $e^{${a}x}$.`
  return `${pair} has multiplicity ${r.mult}, so the cosine and sine both come with powers of $x$ up to $x^{${r.mult - 1}}$ — ${2 * r.mult} solutions in all.`
}

/**
 * Full derivation of the general solution of a homogeneous
 * constant-coefficient equation.
 */
export function deriveHomogeneous(roots: RootSet): DerivationStep[] {
  const coeffs = charPoly(roots)
  const n = coeffs.length - 1
  const caseId = caseOf(roots)
  const zill = CASE_ZILL[caseId]

  // a_n m^n e^{mx} + ... + a_0 e^{mx}, before the common factor comes out.
  const substituted = coeffs
    .map((c, i) => {
      if (c === 0) return null
      const p = n - i
      const mag = Math.abs(c)
      const shown = mag === 1 && p > 0 ? '' : String(mag)
      const power = p === 0 ? '' : p === 1 ? 'm' : `m^{${p}}`
      return { sign: c < 0 ? '-' : '+', body: `${shown}${power}e^{mx}` }
    })
    .filter((t): t is { sign: string; body: string } => t !== null)
    .map((t, i) => (i === 0 ? `${t.sign === '-' ? '-' : ''}${t.body}` : ` ${t.sign} ${t.body}`))
    .join('')

  const derivatives = Array.from({ length: Math.min(n, 3) + 1 }, (_, k) =>
    k === 0
      ? 'y = e^{mx}'
      : `${derivTex(k)} = ${k === 1 ? 'm' : `m^{${k}}`}e^{mx}`,
  ).join(',\\quad ')

  const steps: DerivationStep[] = [
    {
      label: 'The equation',
      tex: odeTex(coeffs),
    },
    {
      label: 'Try an exponential',
      tex: derivatives,
      text: 'Every derivative of $e^{mx}$ is a constant times $e^{mx}$ again, which is the whole reason this guess works for constant coefficients.',
    },
    {
      label: 'Substitute',
      tex: `${substituted} = 0`,
    },
    {
      label: 'Factor it out',
      tex: charEqTex(coeffs),
      text: '$e^{mx}$ is never zero, so it can be divided away. What is left is the auxiliary equation.',
    },
    {
      label: 'Factor',
      tex: `${factoredTex(roots)} = 0`,
    },
    {
      label: 'Read the roots',
      tex: rootsTex(roots),
      text: `${zill ? `${zill} — ` : ''}${CASE_LABEL[caseId].toLowerCase()}.`,
    },
  ]

  for (const r of roots) {
    steps.push({
      label: roots.length > 1 ? 'From this root' : 'Build the basis',
      tex: contributionTex(r).join(',\\quad '),
      text: contributionReason(r),
    })
  }

  steps.push({
    label: 'General solution',
    tex: `y = ${generalSolutionTex(roots)}`,
    text: `Order ${order(roots)}, so ${order(roots)} arbitrary constants — one per solution in the fundamental set.`,
  })

  return steps
}

/** Derivation of an undetermined-coefficients trial form. */
export function deriveTrial(g: Quasi, roots: RootSet): DerivationStep[] {
  const coeffs = charPoly(roots)
  const groups = forcingGroups(g)

  const steps: DerivationStep[] = [
    { label: 'The equation', tex: odeTex(coeffs, quasiTex(g)) },
    {
      label: 'Complementary function',
      tex: `y_c = ${generalSolutionTex(roots)}`,
      text: `From $${charEqTex(coeffs)}$, giving $${rootsTex(roots)}$. This has to come first: the multiplication rule needs these roots.`,
    },
  ]

  groups.forEach((group, i) => {
    const s = multiplicationShift(group, roots)
    const which =
      group.b === 0
        ? `$m = ${numText(group.a)}$`
        : `$m = ${group.a === 0 ? '' : numText(group.a)} \\pm ${numText(group.b)}i$`
    const shape =
      group.b === 0
        ? `a polynomial of degree ${group.degree} times $e^{${numText(group.a)}x}$`
        : `polynomials of degree ${group.degree} on both $\\cos$ and $\\sin$`
    steps.push({
      label: groups.length > 1 ? `Group ${i + 1} of g(x)` : 'Shape of g(x)',
      tex: quasiTex(g.filter((t) => t.a === group.a && t.b === group.b)),
      text: `Built on ${which}, so the trial form for this piece is ${shape}. Every power below the top one goes in too, because differentiating produces them.`,
    })
    steps.push({
      label: 'Check against y_c',
      text:
        s === 0
          ? `${which} is not a root of the auxiliary equation, so nothing in this group duplicates $y_c$ and no $x$-multiplier is needed.`
          : `${which} is a root of multiplicity ${s}, so this group duplicates part of $y_c$. Multiply the whole group by $x^{${s}}$ — the smallest power that clears it, applied to the group and not just the offending term.`,
    })
  })

  steps.push({
    label: 'Trial form',
    tex: `y_p = ${trialTex(g, roots)}`,
    text: 'The coefficients stay undetermined until this is substituted back and like terms are matched.',
  })

  return steps
}

/** Derivation of a minimal annihilator. */
export function deriveAnnihilator(g: Quasi): DerivationStep[] {
  const ann = annihilatorOf(g)
  const groups = forcingGroups(g)

  const steps: DerivationStep[] = [{ label: 'The function', tex: quasiTex(g) }]

  groups.forEach((group, i) => {
    const factor = ann.factors[i]
    const reason =
      group.b === 0 && group.a === 0
        ? `A polynomial of degree ${group.degree} dies after ${group.degree + 1} derivatives, so $D^{${group.degree + 1}}$ kills it.`
        : group.b === 0
          ? `$x^{${group.degree}}e^{${numText(group.a)}x}$ needs $(D - ${numText(group.a)})$ applied ${group.degree + 1} times.`
          : `$x^{${group.degree}}e^{${numText(group.a)}x}$ times $\\cos$ or $\\sin$ of $${numText(group.b)}x$ needs the quadratic factor for $${group.a === 0 ? '' : numText(group.a)} \\pm ${numText(group.b)}i$, raised to ${group.degree + 1}.`
    steps.push({
      label: groups.length > 1 ? `Group ${i + 1}` : 'Match the pattern',
      tex: factor.tex,
      text: reason,
    })
  })

  if (groups.length > 1) {
    steps.push({
      label: 'Multiply',
      tex: ann.tex,
      text: 'Constant-coefficient operators commute, so the product of the factors annihilates the sum, in any order.',
    })
  }

  steps.push({
    label: 'Check',
    tex: `${ann.tex}\\left[${quasiTex(g)}\\right] = 0`,
    text: 'Expanding the operator and applying it term by term returns zero exactly, which is what "annihilates" means.',
  })

  steps.push({
    label: 'Annihilator',
    tex: ann.tex,
    text: `Order ${ann.order}. Nothing smaller works: dropping any exponent leaves a term of $g(x)$ alive.`,
  })

  return steps
}

/** Derivation of a Cauchy-Euler general solution. */
export function deriveCauchy(eq: CauchyEuler): DerivationStep[] {
  const caseId = caseOf(eq.roots)
  const [a, b, c] = eq.auxiliary
  const expanded = `${a === 1 ? '' : a}m^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}m ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`

  const steps: DerivationStep[] = [
    { label: 'The equation', tex: cauchyTex(eq) },
    {
      label: 'Try a power',
      tex: 'y = x^{m},\\quad xy\' = mx^{m},\\quad x^{2}y\'\' = m(m-1)x^{m}',
      text: 'Each term carries the power of $x$ that matches its derivative order, so every term comes back as a constant times $x^{m}$.',
    },
    { label: 'Substitute', tex: cauchyAuxiliaryTex(eq) },
    {
      label: 'Expand',
      tex: expanded,
      text: 'Expanding $m(m-1)$ is where the linear coefficient becomes $b - a$ rather than $b$.',
    },
    {
      label: 'Read the roots',
      tex: rootsTex(eq.roots),
      text: `${CASE_LABEL[caseId]}.`,
    },
    {
      label: 'General solution',
      tex: `y = ${cauchySolutionTex(eq.roots)}`,
      text:
        caseId === 'real-repeated'
          ? 'The substitution $x = e^{t}$ turns this into a constant-coefficient equation in $t$, and $t = \\ln x$. That is why $\\ln x$ appears here in exactly the place $x$ appears in the constant-coefficient repeated-root case.'
          : 'Stated on $x > 0$, where the leading coefficient does not vanish.',
    },
  ]

  return steps
}
