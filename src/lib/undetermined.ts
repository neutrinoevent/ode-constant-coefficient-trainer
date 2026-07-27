/**
 * Undetermined coefficients (§4.4) — the trial form for y_p, and the
 * multiplication rule that most misses come from.
 *
 * A forcing function in the applicable class splits into groups sharing an
 * (a, b) pair, meaning a common factor e^{ax}cos bx / e^{ax}sin bx. Each group
 * gets a full polynomial of its own maximum degree in *both* the cos and sin
 * slots, then the whole group is multiplied by x^s where s is the multiplicity
 * of a ± bi as a root of the auxiliary equation. s = 0 is the ordinary case;
 * s > 0 is Zill's Case II multiplication rule.
 */

import { normalize, term, termTex, termText, type Quasi, type QTerm } from './quasipoly'
import { rootMultiplicityAt, type RootSet } from './roots'

export interface ForcingGroup {
  /** Exponential rate shared by the group. */
  a: number
  /** Angular frequency; 0 means no trig factor. */
  b: number
  /** Highest power of x appearing in the group. */
  degree: number
}

const EPS = 1e-9
const gkey = (a: number, b: number) => `${a.toFixed(9)}|${b.toFixed(9)}`

/** Split a forcing function into its (a, b) groups with their polynomial degrees. */
export function forcingGroups(g: Quasi): ForcingGroup[] {
  const acc = new Map<string, ForcingGroup>()
  for (const t of normalize(g)) {
    const k = gkey(t.a, t.b)
    const prev = acc.get(k)
    if (prev) prev.degree = Math.max(prev.degree, t.k)
    else acc.set(k, { a: t.a, b: t.b, degree: t.k })
  }
  return [...acc.values()].sort((x, y) => x.a - y.a || x.b - y.b)
}

/** The x^s multiplier for one group: 0 when the group's rate is not a root. */
export function multiplicationShift(group: ForcingGroup, roots: RootSet): number {
  return rootMultiplicityAt(roots, group.a, group.b)
}

/**
 * The exact set of basis functions a correct trial y_p must span. Comparing a
 * student's typed form against this set is what the Solve checker does.
 */
export function trialTerms(g: Quasi, roots: RootSet): QTerm[] {
  const out: QTerm[] = []
  for (const group of forcingGroups(g)) {
    const s = multiplicationShift(group, roots)
    for (let j = 0; j <= group.degree; j++) {
      if (group.b < EPS) {
        out.push(term(1, s + j, group.a, 0, 'cos'))
      } else {
        out.push(term(1, s + j, group.a, group.b, 'cos'))
        out.push(term(1, s + j, group.a, group.b, 'sin'))
      }
    }
  }
  return out
}

const LETTERS = 'ABCDEFGHIJKLMNPQRSTUVW'.split('')

function polyTex(letters: string[], degree: number, variable: string): string {
  // Descending: A x^d + B x^{d-1} + ... + (last)
  const parts: string[] = []
  for (let p = degree; p >= 0; p--) {
    const L = letters.shift() ?? '?'
    const body = p === 0 ? '' : p === 1 ? variable : `${variable}^{${p}}`
    parts.push(`${L}${body}`)
  }
  return parts.join(' + ')
}

function numTex(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))
}

function expTex(a: number, variable: string): string {
  if (Math.abs(a) < EPS) return ''
  const rate = a === 1 ? variable : a === -1 ? `-${variable}` : `${numTex(a)}${variable}`
  return `e^{${rate}}`
}

/** The trial form written the way §4.4 writes it, with A, B, C, ... in reading order. */
export function trialTex(g: Quasi, roots: RootSet, variable = 'x'): string {
  const letters = [...LETTERS]
  const pieces: string[] = []
  for (const group of forcingGroups(g)) {
    const s = multiplicationShift(group, roots)
    const shift = s === 0 ? '' : s === 1 ? variable : `${variable}^{${s}}`
    const ex = expTex(group.a, variable)
    if (group.b < EPS) {
      const poly = polyTex(letters, group.degree, variable)
      const wrapped = group.degree > 0 || shift || ex ? `\\left(${poly}\\right)` : poly
      const body = group.degree === 0 && !shift && !ex ? poly : `${shift}${wrapped}${ex}`
      pieces.push(body)
    } else {
      const arg = group.b === 1 ? variable : `${numTex(group.b)}${variable}`
      const cosPoly = polyTex(letters, group.degree, variable)
      const sinPoly = polyTex(letters, group.degree, variable)
      const cosPart =
        group.degree > 0 ? `\\left(${cosPoly}\\right)\\cos ${arg}` : `${cosPoly}\\cos ${arg}`
      const sinPart =
        group.degree > 0 ? `\\left(${sinPoly}\\right)\\sin ${arg}` : `${sinPoly}\\sin ${arg}`
      const inner = `${cosPart} + ${sinPart}`
      pieces.push(`${shift}${ex}\\left(${inner}\\right)`)
    }
  }
  return pieces.join(' + ') || '0'
}

/** Plain-text trial form, matching what the Solve input accepts. */
export function trialText(g: Quasi, roots: RootSet, variable = 'x'): string {
  const letters = [...LETTERS]
  const pieces: string[] = []
  for (const group of forcingGroups(g)) {
    const s = multiplicationShift(group, roots)
    const shift = s === 0 ? '' : s === 1 ? `${variable}*` : `${variable}^${s}*`
    const ex = Math.abs(group.a) < EPS ? '' : `*e^(${group.a === 1 ? '' : group.a === -1 ? '-' : group.a}${variable})`
    const poly = (deg: number) => {
      const parts: string[] = []
      for (let p = deg; p >= 0; p--) {
        const L = letters.shift() ?? '?'
        parts.push(p === 0 ? L : p === 1 ? `${L}*${variable}` : `${L}*${variable}^${p}`)
      }
      return parts.join(' + ')
    }
    if (group.b < EPS) {
      pieces.push(`${shift}(${poly(group.degree)})${ex}`)
    } else {
      const arg = `${group.b === 1 ? '' : group.b}${variable}`
      pieces.push(
        `${shift}((${poly(group.degree)})*cos(${arg}) + (${poly(group.degree)})*sin(${arg}))${ex}`,
      )
    }
  }
  return pieces.join(' + ') || '0'
}

/**
 * A trial form written as a flat sum with one letter per basis function. Less
 * compact than the grouped textbook form, but it lines up term by term, which
 * is what a multiple-choice comparison needs.
 */
export function termsTrialTex(terms: QTerm[], variable = 'x'): string {
  return (
    terms
      .map((t, i) => `${LETTERS[i] ?? '?'}${termTex(t, variable) === '1' ? '' : termTex(t, variable)}`)
      .join(' + ') || '0'
  )
}

export function termsTrialText(terms: QTerm[], variable = 'x'): string {
  return (
    terms
      .map((t, i) => {
        const body = termText(t, variable)
        return body === '1' ? (LETTERS[i] ?? '?') : `${LETTERS[i] ?? '?'}*${body}`
      })
      .join(' + ') || '0'
  )
}

/** Human sentence naming the rule that applies, shown after an answer. */
export function shiftExplanation(g: Quasi, roots: RootSet): string {
  const shifted = forcingGroups(g)
    .map((group) => ({ group, s: multiplicationShift(group, roots) }))
    .filter((x) => x.s > 0)
  if (!shifted.length) {
    return 'No term of the forcing function solves the homogeneous equation, so no x-multiplier is needed.'
  }
  return shifted
    .map(({ group, s }) => {
      const root =
        group.b < EPS
          ? `m = ${numTex(group.a)}`
          : `m = ${group.a === 0 ? '' : numTex(group.a)} ± ${numTex(group.b)}i`
      return `${root} is a root of multiplicity ${s}, so that group is multiplied by x^${s}.`
    })
    .join(' ')
}
