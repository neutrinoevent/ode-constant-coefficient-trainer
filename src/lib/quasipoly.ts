/**
 * Quasipolynomials: finite sums of c · x^k e^{ax} cos(bx) and c · x^k e^{ax} sin(bx).
 *
 * This set is closed under differentiation, so applying a constant-coefficient
 * operator to one is exact arithmetic rather than numerical estimation. Every
 * object this app quizzes on lives here: solution bases, forcing functions,
 * undetermined-coefficient trial forms, and the residual after an annihilator
 * is applied. The corpus tests use that closure to verify each generated
 * problem against its own stated answer.
 */

export interface QTerm {
  /** Coefficient. */
  c: number
  /** Power of x; k >= 0. */
  k: number
  /** Exponential rate a in e^{ax}. */
  a: number
  /** Angular frequency b >= 0; b = 0 means no trig factor. */
  b: number
  trig: 'cos' | 'sin'
}

export type Quasi = QTerm[]

const EPS = 1e-9

export function term(c: number, k = 0, a = 0, b = 0, trig: 'cos' | 'sin' = 'cos'): QTerm {
  // sin(0x) is identically zero; cos(0x) is 1. Fold both into the b = 0, cos form.
  if (Math.abs(b) < EPS) return { c: trig === 'sin' ? 0 : c, k, a, b: 0, trig: 'cos' }
  // sin is odd, cos is even: a negative frequency is the same term with a sign.
  if (b < 0) return { c: trig === 'sin' ? -c : c, k, a, b: -b, trig }
  return { c, k, a, b, trig }
}

const key = (t: QTerm) => `${t.k}|${t.a.toFixed(9)}|${t.b.toFixed(9)}|${t.trig}`

/** Combine like terms and drop anything that cancelled. */
export function normalize(q: Quasi): Quasi {
  const acc = new Map<string, QTerm>()
  for (const raw of q) {
    const t = term(raw.c, raw.k, raw.a, raw.b, raw.trig)
    if (Math.abs(t.c) < EPS) continue
    const kk = key(t)
    const prev = acc.get(kk)
    if (prev) prev.c += t.c
    else acc.set(kk, { ...t })
  }
  return [...acc.values()]
    .filter((t) => Math.abs(t.c) > EPS)
    .sort((x, y) => x.a - y.a || x.b - y.b || x.k - y.k || x.trig.localeCompare(y.trig))
}

export const add = (...qs: Quasi[]): Quasi => normalize(qs.flat())

export const scale = (q: Quasi, s: number): Quasi => normalize(q.map((t) => ({ ...t, c: t.c * s })))

/** d/dx of a quasipolynomial, exact within the family. */
export function differentiate(q: Quasi): Quasi {
  const out: QTerm[] = []
  for (const t of q) {
    if (t.k > 0) out.push(term(t.c * t.k, t.k - 1, t.a, t.b, t.trig))
    if (Math.abs(t.a) > EPS) out.push(term(t.c * t.a, t.k, t.a, t.b, t.trig))
    if (t.b > EPS) {
      // (cos bx)' = -b sin bx, (sin bx)' = b cos bx
      const flipped = t.trig === 'cos' ? 'sin' : 'cos'
      const sign = t.trig === 'cos' ? -1 : 1
      out.push(term(sign * t.c * t.b, t.k, t.a, t.b, flipped))
    }
  }
  return normalize(out)
}

export function nthDerivative(q: Quasi, n: number): Quasi {
  let cur = normalize(q)
  for (let i = 0; i < n; i++) cur = differentiate(cur)
  return cur
}

/**
 * Apply L = a_n D^n + ... + a_1 D + a_0, with `coeffs` in descending order
 * [a_n, ..., a_0] — the same order as the characteristic polynomial.
 */
export function applyOperator(coeffs: readonly number[], q: Quasi): Quasi {
  const n = coeffs.length - 1
  const out: QTerm[] = []
  let deriv = normalize(q)
  for (let order = 0; order <= n; order++) {
    const a = coeffs[n - order]
    if (Math.abs(a) > EPS) out.push(...scale(deriv, a))
    if (order < n) deriv = differentiate(deriv)
  }
  return normalize(out)
}

export const isZero = (q: Quasi): boolean => normalize(q).length === 0

export function equal(p: Quasi, q: Quasi): boolean {
  return isZero(add(normalize(p), scale(normalize(q), -1)))
}

/** Numeric evaluation, used by the least-squares answer checker. */
export function evaluate(q: Quasi, x: number): number {
  let sum = 0
  for (const t of q) {
    const trig = t.b === 0 ? 1 : t.trig === 'cos' ? Math.cos(t.b * x) : Math.sin(t.b * x)
    sum += t.c * Math.pow(x, t.k) * Math.exp(t.a * x) * trig
  }
  return sum
}

export const asFunction = (q: Quasi) => (x: number) => evaluate(q, x)

/** The shape of a term with its coefficient stripped — what a trial form is made of. */
export const shapeKey = (t: QTerm): string => key(t)

/** Distinct term shapes present, coefficients discarded. */
export function shapes(q: Quasi): QTerm[] {
  const seen = new Map<string, QTerm>()
  for (const t of normalize(q)) seen.set(key(t), { ...t, c: 1 })
  return [...seen.values()]
}

// ---------------------------------------------------------------------------
// LaTeX
// ---------------------------------------------------------------------------

function numTex(v: number): string {
  if (Number.isInteger(v)) return String(v)
  // Frequencies and rates in the corpus are halves or thirds at worst.
  for (const d of [2, 3, 4, 5, 6]) {
    if (Number.isInteger(v * d)) {
      const n = v * d
      return `${n < 0 ? '-' : ''}\\tfrac{${Math.abs(n)}}{${d}}`
    }
  }
  return String(Number(v.toFixed(4)))
}

/** One term without its coefficient, e.g. x^{2}e^{-3x}\cos 4x. */
export function termTex(t: QTerm, variable = 'x'): string {
  const parts: string[] = []
  if (t.k === 1) parts.push(variable)
  else if (t.k > 1) parts.push(`${variable}^{${t.k}}`)
  if (Math.abs(t.a) > EPS) {
    const rate = t.a === 1 ? variable : t.a === -1 ? `-${variable}` : `${numTex(t.a)}${variable}`
    parts.push(`e^{${rate}}`)
  }
  if (t.b > EPS) {
    const arg = t.b === 1 ? variable : `${numTex(t.b)}${variable}`
    parts.push(`\\${t.trig} ${arg}`)
  }
  return parts.length ? parts.join('') : '1'
}

/** Plain-text form of a term, for typed-answer examples. */
export function termText(t: QTerm, variable = 'x'): string {
  const parts: string[] = []
  if (t.k === 1) parts.push(variable)
  else if (t.k > 1) parts.push(`${variable}^${t.k}`)
  if (Math.abs(t.a) > EPS) parts.push(`e^(${t.a === 1 ? '' : t.a === -1 ? '-' : t.a}${variable})`)
  if (t.b > EPS) parts.push(`${t.trig}(${t.b === 1 ? '' : t.b}${variable})`)
  return parts.length ? parts.join('*') : '1'
}

/** Full quasipolynomial as LaTeX, with signs folded into the joins. */
export function quasiTex(q: Quasi, variable = 'x'): string {
  const terms = normalize(q)
  if (!terms.length) return '0'
  return terms
    .map((t, i) => {
      const body = termTex(t, variable)
      const mag = Math.abs(t.c)
      const coeff = mag === 1 && body !== '1' ? '' : numTex(mag)
      const sign = t.c < 0 ? '-' : i === 0 ? '' : '+'
      const joined = `${coeff}${body === '1' && coeff !== '' ? '' : body}`
      return i === 0 ? `${sign}${joined}` : ` ${sign} ${joined}`
    })
    .join('')
}
