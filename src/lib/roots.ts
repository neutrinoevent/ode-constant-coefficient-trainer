/**
 * Roots of the auxiliary equation, and everything derived from them.
 *
 * Zill's three cases for a second-order equation (9e §4.3) generalize to
 * arbitrary order as a multiset of roots with multiplicities: each real root of
 * multiplicity k contributes x^j e^{mx} for j < k, and each conjugate pair
 * a ± bi of multiplicity k contributes x^j e^{ax}cos bx and x^j e^{ax}sin bx.
 * A `RootSet` is the single source of truth here — the characteristic
 * polynomial, the ODE, the general solution, and the SRS case tag are all
 * computed from it rather than stored alongside it.
 */

import { clearDenominators, fAdd, fEq, fMul, fNeg, fNum, frac, fracTex, ONE, ZERO, type Frac } from './frac'
import { term, type QTerm } from './quasipoly'

export interface RealRoot {
  kind: 'real'
  m: Frac
  mult: number
}

export interface ComplexRoot {
  kind: 'complex'
  /** Real part. */
  a: Frac
  /** Imaginary part, strictly positive; the root stands for the pair a ± bi. */
  b: Frac
  /** Multiplicity of the pair, so it accounts for 2 * mult roots. */
  mult: number
}

export type Root = RealRoot | ComplexRoot
export type RootSet = Root[]

export const real = (m: Frac, mult = 1): RealRoot => ({ kind: 'real', m, mult })
export const complex = (a: Frac, b: Frac, mult = 1): ComplexRoot => ({ kind: 'complex', a, b, mult })

/** Order of the ODE: total root count with multiplicity. */
export function order(roots: RootSet): number {
  return roots.reduce((n, r) => n + (r.kind === 'real' ? r.mult : 2 * r.mult), 0)
}

// ---------------------------------------------------------------------------
// Case taxonomy
// ---------------------------------------------------------------------------

/** The case labels a student is asked to produce. */
export type CaseId =
  | 'real-distinct'
  | 'real-repeated'
  | 'complex-distinct'
  | 'complex-repeated'
  | 'mixed'

export const CASE_LABEL: Record<CaseId, string> = {
  'real-distinct': 'Distinct real roots',
  'real-repeated': 'Repeated real root',
  'complex-distinct': 'Conjugate complex roots',
  'complex-repeated': 'Repeated complex pair',
  mixed: 'Mixed cases',
}

/** Zill's case numbering for the second-order equation. */
export const CASE_ZILL: Partial<Record<CaseId, string>> = {
  'real-distinct': 'Case I',
  'real-repeated': 'Case II',
  'complex-distinct': 'Case III',
}

export function caseOf(roots: RootSet): CaseId {
  const hasReal = roots.some((r) => r.kind === 'real')
  const hasComplex = roots.some((r) => r.kind === 'complex')
  const repeatedReal = roots.some((r) => r.kind === 'real' && r.mult > 1)
  const repeatedComplex = roots.some((r) => r.kind === 'complex' && r.mult > 1)
  if (hasReal && hasComplex) return 'mixed'
  if (hasComplex) return repeatedComplex ? 'complex-repeated' : 'complex-distinct'
  return repeatedReal ? 'real-repeated' : 'real-distinct'
}

/** Discriminant classification for a m^2 + b m + c, straight from §4.3. */
export function classifyQuadratic(a: number, b: number, c: number): {
  disc: number
  caseId: 'real-distinct' | 'real-repeated' | 'complex-distinct'
} {
  const disc = b * b - 4 * a * c
  if (disc > 0) return { disc, caseId: 'real-distinct' }
  if (disc === 0) return { disc, caseId: 'real-repeated' }
  return { disc, caseId: 'complex-distinct' }
}

// ---------------------------------------------------------------------------
// Characteristic polynomial
// ---------------------------------------------------------------------------

/** Multiply two polynomials given in descending order as fractions. */
function polyMul(p: Frac[], q: Frac[]): Frac[] {
  const acc: Frac[] = Array.from({ length: p.length + q.length - 1 }, () => ZERO)
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      acc[i + j] = fAdd(acc[i + j], fMul(p[i], q[j]))
    }
  }
  return acc
}

/**
 * Characteristic polynomial as coprime integers in descending order, with a
 * positive leading coefficient. Every generated ODE gets its coefficients this
 * way, so the printed equation and its roots can never disagree.
 */
export function charPoly(roots: RootSet): number[] {
  let poly: Frac[] = [ONE]
  for (const r of roots) {
    const factor: Frac[] =
      r.kind === 'real'
        ? // (m - r)
          [ONE, fNeg(r.m)]
        : // (m - a)^2 + b^2 = m^2 - 2am + (a^2 + b^2)
          [ONE, fNeg(fMul(frac(2), r.a)), fAdd(fMul(r.a, r.a), fMul(r.b, r.b))]
    for (let i = 0; i < r.mult; i++) poly = polyMul(poly, factor)
  }
  return clearDenominators(poly)
}

// ---------------------------------------------------------------------------
// Solution basis
// ---------------------------------------------------------------------------

/** The canonical fundamental set, in the order Zill writes it. */
export function basisTerms(roots: RootSet): QTerm[] {
  const out: QTerm[] = []
  for (const r of roots) {
    if (r.kind === 'real') {
      for (let k = 0; k < r.mult; k++) out.push(term(1, k, fNum(r.m), 0, 'cos'))
    } else {
      for (let k = 0; k < r.mult; k++) {
        out.push(term(1, k, fNum(r.a), fNum(r.b), 'cos'))
        out.push(term(1, k, fNum(r.a), fNum(r.b), 'sin'))
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// LaTeX
// ---------------------------------------------------------------------------

/** y, y', y'', y''', then y^{(4)} and up. */
export function derivTex(n: number, y = 'y'): string {
  if (n === 0) return y
  if (n <= 3) return `${y}${"'".repeat(n)}`
  return `${y}^{(${n})}`
}

function coeffTex(v: number, first: boolean, body: string): string {
  const mag = Math.abs(v)
  const shown = mag === 1 ? '' : String(mag)
  const sign = v < 0 ? '-' : first ? '' : '+'
  const lead = first ? sign : ` ${sign} `
  return `${lead}${shown}${body}`
}

/** Descending integer coefficients -> "y'' - y' - 6y = 0" (or an inhomogeneous right side). */
export function odeTex(coeffs: readonly number[], rhs = '0', y = 'y'): string {
  const n = coeffs.length - 1
  let out = ''
  let first = true
  for (let i = 0; i <= n; i++) {
    const c = coeffs[i]
    if (c === 0) continue
    out += coeffTex(c, first, derivTex(n - i, y))
    first = false
  }
  if (first) out = '0'
  return `${out} = ${rhs}`
}

/** Descending integer coefficients -> "m^2 - m - 6 = 0". */
export function charEqTex(coeffs: readonly number[], v = 'm'): string {
  const n = coeffs.length - 1
  let out = ''
  let first = true
  for (let i = 0; i <= n; i++) {
    const c = coeffs[i]
    if (c === 0) continue
    const p = n - i
    const body = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`
    const mag = Math.abs(c)
    const shown = mag === 1 && p > 0 ? '' : String(mag)
    const sign = c < 0 ? '-' : first ? '' : '+'
    out += `${first ? sign : ` ${sign} `}${shown}${body}`
    first = false
  }
  if (first) out = '0'
  return `${out} = 0`
}

/** Factored characteristic polynomial, e.g. (m - 3)(m + 1)^{2}. */
export function factoredTex(roots: RootSet, v = 'm'): string {
  const parts: string[] = []
  for (const r of roots) {
    if (r.kind === 'real') {
      const inner = fEq(r.m, ZERO)
        ? v
        : r.m.n < 0
          ? `${v} + ${fracTex({ n: -r.m.n, d: r.m.d })}`
          : `${v} - ${fracTex(r.m)}`
      const wrapped = fEq(r.m, ZERO) ? v : `(${inner})`
      parts.push(r.mult > 1 ? `${wrapped}^{${r.mult}}` : wrapped)
    } else {
      const shifted = fEq(r.a, ZERO)
        ? `${v}^{2}`
        : r.a.n < 0
          ? `(${v} + ${fracTex({ n: -r.a.n, d: r.a.d })})^{2}`
          : `(${v} - ${fracTex(r.a)})^{2}`
      const bsq = fMul(r.b, r.b)
      const inner = `${shifted} + ${fracTex(bsq)}`
      parts.push(r.mult > 1 ? `\\left(${inner}\\right)^{${r.mult}}` : `\\left(${inner}\\right)`)
    }
  }
  return parts.join('')
}

/** "m_1 = 3,\ m_2 = -1" / "m = -1 \pm 2i", multiplicities noted. */
export function rootsTex(roots: RootSet, v = 'm'): string {
  const parts: string[] = []
  for (const r of roots) {
    if (r.kind === 'real') {
      const mult = r.mult > 1 ? `\\ (\\text{multiplicity } ${r.mult})` : ''
      parts.push(`${v} = ${fracTex(r.m)}${mult}`)
    } else {
      const re = fEq(r.a, ZERO) ? '' : fracTex(r.a)
      const im = fEq(r.b, ONE) ? '' : fracTex(r.b)
      const mult = r.mult > 1 ? `\\ (\\text{each twice})` : ''
      parts.push(`${v} = ${re} \\pm ${im}i${mult}`)
    }
  }
  return parts.join(',\\quad ')
}

/**
 * General solution with constants numbered in reading order, grouping each
 * conjugate pair as e^{ax}(c_i\cos bx + c_j\sin bx) the way §4.3 presents it.
 */
export function generalSolutionTex(roots: RootSet, variable = 'x'): string {
  const pieces: string[] = []
  let idx = 1
  for (const r of roots) {
    if (r.kind === 'real') {
      for (let k = 0; k < r.mult; k++) {
        pieces.push(`c_{${idx++}}${termBody(k, fNum(r.m), variable)}`)
      }
    } else {
      const a = fNum(r.a)
      const b = fNum(r.b)
      for (let k = 0; k < r.mult; k++) {
        const prefix = termBody(k, a, variable)
        const arg = b === 1 ? variable : `${trimNum(b)}${variable}`
        pieces.push(
          `${prefix}\\left(c_{${idx++}}\\cos ${arg} + c_{${idx++}}\\sin ${arg}\\right)`,
        )
      }
    }
  }
  return pieces.join(' + ')
}

function trimNum(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))
}

/** x^k e^{ax} with the empty cases collapsed. */
function termBody(k: number, a: number, variable: string): string {
  const xs = k === 0 ? '' : k === 1 ? variable : `${variable}^{${k}}`
  if (a === 0) return xs
  const rate = a === 1 ? variable : a === -1 ? `-${variable}` : `${trimNum(a)}${variable}`
  return `${xs}e^{${rate}}`
}

/** Plain-text general solution, the shape a student would type into Solve. */
export function generalSolutionText(roots: RootSet, variable = 'x'): string {
  const pieces: string[] = []
  let idx = 1
  for (const r of roots) {
    if (r.kind === 'real') {
      for (let k = 0; k < r.mult; k++) pieces.push(`c${idx++}*${bodyText(k, fNum(r.m), variable)}`)
    } else {
      const a = fNum(r.a)
      const b = fNum(r.b)
      for (let k = 0; k < r.mult; k++) {
        const pre = bodyText(k, a, variable)
        const arg = `${b === 1 ? '' : b}${variable}`
        pieces.push(`${pre}*(c${idx++}*cos(${arg}) + c${idx++}*sin(${arg}))`)
      }
    }
  }
  return pieces.join(' + ')
}

function bodyText(k: number, a: number, variable: string): string {
  const xs = k === 0 ? '' : k === 1 ? variable : `${variable}^${k}`
  const ex = a === 0 ? '' : `e^(${a === 1 ? '' : a === -1 ? '-' : trimNum(a)}${variable})`
  if (!xs && !ex) return '1'
  return [xs, ex].filter(Boolean).join('*')
}

// ---------------------------------------------------------------------------
// Second-order helpers
// ---------------------------------------------------------------------------

/** Exact roots of a m^2 + b m + c when they are rational or have rational parts. */
export function quadraticRoots(a: number, b: number, c: number): RootSet | null {
  const disc = b * b - 4 * a * c
  if (disc === 0) return [real(frac(-b, 2 * a), 2)]
  if (disc > 0) {
    const s = Math.sqrt(disc)
    if (!Number.isInteger(s)) return null
    const r1 = frac(-b + s, 2 * a)
    const r2 = frac(-b - s, 2 * a)
    return fEq(r1, r2) ? [real(r1, 2)] : [real(r1), real(r2)]
  }
  const s = Math.sqrt(-disc)
  if (!Number.isInteger(s)) return null
  return [complex(frac(-b, 2 * a), frac(s, 2 * a))]
}

/** Does the coefficient list describe the same polynomial up to a positive scale? */
export function samePolynomial(p: readonly number[], q: readonly number[]): boolean {
  const a = clearDenominators(p.map((v) => frac(v)))
  const b = clearDenominators(q.map((v) => frac(v)))
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/**
 * How many times a ± bi appears among the roots. This is the `s` in the
 * multiplication rule for undetermined coefficients: the trial form for a
 * forcing term built on a ± bi gets multiplied by x^s.
 */
export function rootMultiplicityAt(roots: RootSet, a: number, b: number): number {
  for (const r of roots) {
    if (b === 0 && r.kind === 'real' && Math.abs(fNum(r.m) - a) < 1e-9) return r.mult
    if (b !== 0 && r.kind === 'complex') {
      if (Math.abs(fNum(r.a) - a) < 1e-9 && Math.abs(fNum(r.b) - Math.abs(b)) < 1e-9) return r.mult
    }
  }
  return 0
}
