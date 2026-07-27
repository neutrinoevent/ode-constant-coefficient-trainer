/**
 * Cauchy-Euler equations (§4.7).
 *
 * ax^2 y'' + bxy' + cy = 0 is here because it is the same three cases wearing a
 * different coat: substituting y = x^m gives the auxiliary equation
 * am(m - 1) + bm + c = 0, and the substitution x = e^t turns the whole equation
 * into a constant-coefficient one. Distinct real roots give x^{m_1}, x^{m_2};
 * a repeated root brings in ln x where the constant-coefficient version brings
 * in x; a complex pair gives x^{a}cos(b ln x). Drilling the two side by side is
 * what makes the pattern stick.
 */

import { fAdd, fEq, fMul, fNum, frac, fracTex, fracText, ZERO, type Frac } from './frac'
import { complex, real, type RootSet } from './roots'

export interface CauchyEuler {
  /** Coefficients of ax^2 y'' + bxy' + cy = 0. */
  a: number
  b: number
  c: number
  /** Auxiliary equation am^2 + (b - a)m + c = 0, descending. */
  auxiliary: [number, number, number]
  roots: RootSet
}

/** Build the equation whose auxiliary roots are the given ones (order two only). */
export function cauchyFromRoots(roots: RootSet, a = 1): CauchyEuler {
  // am^2 + (b - a)m + c = 0 must match a(m - r1)(m - r2), so b = a(1 - r1 - r2), c = a r1 r2.
  let sum: Frac
  let prod: Frac
  if (roots.length === 1 && roots[0].kind === 'real') {
    const r = roots[0].m
    sum = fMul(frac(2), r)
    prod = fMul(r, r)
  } else if (roots.length === 1 && roots[0].kind === 'complex') {
    const { a: re, b: im } = roots[0]
    sum = fMul(frac(2), re)
    prod = fAdd(fMul(re, re), fMul(im, im))
  } else {
    const reals = roots.filter((r) => r.kind === 'real')
    if (reals.length !== 2) throw new Error('cauchyFromRoots handles order-two root sets only')
    sum = fAdd(reals[0].m, reals[1].m)
    prod = fMul(reals[0].m, reals[1].m)
  }
  const b = a * (1 - fNum(sum))
  const c = a * fNum(prod)
  return { a, b, c, auxiliary: [a, b - a, c], roots }
}

/** Auxiliary roots of ax^2 y'' + bxy' + cy = 0, when they come out rational. */
export function cauchyRoots(a: number, b: number, c: number): RootSet | null {
  const B = b - a
  const disc = B * B - 4 * a * c
  if (disc === 0) return [real(frac(-B, 2 * a), 2)]
  if (disc > 0) {
    const s = Math.sqrt(disc)
    if (!Number.isInteger(s)) return null
    return [real(frac(-B + s, 2 * a)), real(frac(-B - s, 2 * a))]
  }
  const s = Math.sqrt(-disc)
  if (!Number.isInteger(s)) return null
  return [complex(frac(-B, 2 * a), frac(s, 2 * a))]
}

function coeff(v: number, first: boolean, body: string): string {
  const mag = Math.abs(v)
  const shown = mag === 1 ? '' : String(mag)
  const sign = v < 0 ? '-' : first ? '' : '+'
  return `${first ? sign : ` ${sign} `}${shown}${body}`
}

export function cauchyTex(eq: CauchyEuler, rhs = '0'): string {
  const parts: [number, string][] = [
    [eq.a, "x^{2}y''"],
    [eq.b, "xy'"],
    [eq.c, 'y'],
  ]
  let out = ''
  let first = true
  for (const [v, body] of parts) {
    if (v === 0) continue
    out += coeff(v, first, body)
    first = false
  }
  return `${first ? '0' : out} = ${rhs}`
}

/** am(m-1) + bm + c = 0, the form the substitution y = x^m produces. */
export function cauchyAuxiliaryTex(eq: CauchyEuler): string {
  const parts: string[] = []
  if (eq.a !== 0) parts.push(`${eq.a === 1 ? '' : eq.a}m(m - 1)`)
  if (eq.b !== 0) parts.push(`${eq.b < 0 ? '-' : '+'} ${Math.abs(eq.b) === 1 ? '' : Math.abs(eq.b)}m`)
  if (eq.c !== 0) parts.push(`${eq.c < 0 ? '-' : '+'} ${Math.abs(eq.c)}`)
  return `${parts.join(' ')} = 0`
}

/** General solution on x > 0. */
export function cauchySolutionTex(roots: RootSet): string {
  const pieces: string[] = []
  let idx = 1
  for (const r of roots) {
    if (r.kind === 'real') {
      for (let k = 0; k < r.mult; k++) {
        const log = k === 0 ? '' : k === 1 ? '\\ln x' : `(\\ln x)^{${k}}`
        pieces.push(`c_{${idx++}}x^{${fracTex(r.m)}}${log}`)
      }
    } else {
      const power = fEq(r.a, ZERO) ? '' : `x^{${fracTex(r.a)}}`
      const arg = fEq(r.b, frac(1)) ? '\\ln x' : `${fracTex(r.b)}\\ln x`
      pieces.push(`${power}\\left(c_{${idx++}}\\cos(${arg}) + c_{${idx++}}\\sin(${arg})\\right)`)
    }
  }
  return pieces.join(' + ')
}

/** Plain-text general solution, in the syntax the Solve input accepts. */
export function cauchySolutionText(roots: RootSet): string {
  const pieces: string[] = []
  let idx = 1
  const pow = (m: Frac) => {
    const v = fNum(m)
    return v === 1 ? 'x' : v === 0 ? '1' : `x^(${fracText(m)})`
  }
  for (const r of roots) {
    if (r.kind === 'real') {
      for (let k = 0; k < r.mult; k++) {
        const log = k === 0 ? '' : k === 1 ? '*ln(x)' : `*ln(x)^${k}`
        pieces.push(`c${idx++}*${pow(r.m)}${log}`)
      }
    } else {
      const base = fNum(r.a) === 0 ? '' : `${pow(r.a)}*`
      const arg = fNum(r.b) === 1 ? 'ln(x)' : `${fracText(r.b)}*ln(x)`
      pieces.push(`${base}(c${idx++}*cos(${arg}) + c${idx++}*sin(${arg}))`)
    }
  }
  return pieces.join(' + ')
}

/** The three cases, phrased as §4.7 phrases them. */
export const CAUCHY_CASE_NOTE: Record<string, string> = {
  'real-distinct': 'Distinct real roots m₁, m₂ give x^{m₁} and x^{m₂}.',
  'real-repeated': 'A repeated root m₁ gives x^{m₁} and x^{m₁} ln x — ln x plays the role x plays in the constant-coefficient case.',
  'complex-distinct': 'A pair a ± bi gives x^{a} cos(b ln x) and x^{a} sin(b ln x).',
}
