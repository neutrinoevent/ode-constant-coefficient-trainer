/**
 * Annihilator operators (§4.5).
 *
 * The two building blocks in Zill are (D - a)^{n} for x^{n-1}e^{ax} and
 * (D^2 - 2aD + (a^2 + b^2))^{n} for x^{n-1}e^{ax}cos bx and its sine partner.
 * The annihilator of a sum is the product of the annihilators of its groups,
 * and the minimal one takes each factor to exactly the power the group's
 * degree demands.
 */

import { applyOperator, isZero, type Quasi } from './quasipoly'
import { polyMul, polyPow, polyTrim, type Poly } from './operator'
import { forcingGroups, type ForcingGroup } from './undetermined'

export interface AnnihilatorFactor {
  /** The base operator before the exponent. */
  base: Poly
  power: number
  tex: string
  text: string
}

const EPS = 1e-9

function numTex(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))
}

/** Minimal annihilator of one (a, b, degree) group. */
export function factorFor(group: ForcingGroup): AnnihilatorFactor {
  const power = group.degree + 1
  if (group.b < EPS) {
    const base: Poly = [1, -group.a]
    const inner =
      Math.abs(group.a) < EPS ? 'D' : group.a > 0 ? `D - ${numTex(group.a)}` : `D + ${numTex(-group.a)}`
    const bare = Math.abs(group.a) < EPS ? 'D' : `(${inner})`
    const bareText = Math.abs(group.a) < EPS ? 'D' : `(${inner.replace(/\s/g, '')})`
    return {
      base,
      power,
      tex: power > 1 ? `${bare}^{${power}}` : bare,
      text: power > 1 ? `${bareText}^${power}` : bareText,
    }
  }
  const a = group.a
  const c = a * a + group.b * group.b
  const base: Poly = [1, -2 * a, c]
  const mid = Math.abs(a) < EPS ? '' : a > 0 ? ` - ${numTex(2 * a)}D` : ` + ${numTex(-2 * a)}D`
  const inner = `D^{2}${mid} + ${numTex(c)}`
  const innerText = `D^2${Math.abs(a) < EPS ? '' : a > 0 ? `-${numTex(2 * a)}D` : `+${numTex(-2 * a)}D`}+${numTex(c)}`
  return {
    base,
    power,
    tex: power > 1 ? `\\left(${inner}\\right)^{${power}}` : `\\left(${inner}\\right)`,
    text: power > 1 ? `(${innerText})^${power}` : `(${innerText})`,
  }
}

export interface Annihilator {
  factors: AnnihilatorFactor[]
  /** Expanded operator, descending coefficients. */
  poly: Poly
  tex: string
  text: string
  order: number
}

/** Minimal annihilator of a forcing function. */
export function annihilatorOf(g: Quasi): Annihilator {
  const factors = forcingGroups(g).map(factorFor)
  const poly = factors.reduce<Poly>((acc, f) => polyMul(acc, polyPow(f.base, f.power)), [1])
  return {
    factors,
    poly: polyTrim(poly),
    tex: factors.map((f) => f.tex).join('') || '1',
    text: factors.map((f) => f.text).join('') || '1',
    order: polyTrim(poly).length - 1,
  }
}

export type AnnihilatorVerdict =
  | { ok: true; minimal: true }
  | { ok: true; minimal: false; message: string }
  | { ok: false; message: string }

/**
 * Grade a typed operator by applying it to g exactly. Any operator that kills g
 * is mathematically an annihilator; only the one of least order is *the*
 * annihilator, so a non-minimal answer is accepted with a note rather than
 * marked wrong.
 */
export function gradeAnnihilator(poly: Poly, g: Quasi, minimalOrder: number): AnnihilatorVerdict {
  const trimmed = polyTrim(poly)
  if (trimmed.length === 1) {
    return { ok: false, message: 'That is a constant, not a differential operator.' }
  }
  if (!isZero(applyOperator(trimmed, g))) {
    return { ok: false, message: 'Applying that operator to g(x) does not give zero.' }
  }
  const order = trimmed.length - 1
  if (order === minimalOrder) return { ok: true, minimal: true }
  return {
    ok: true,
    minimal: false,
    message: `That annihilates g(x), but it has order ${order}; the minimal annihilator has order ${minimalOrder}.`,
  }
}
