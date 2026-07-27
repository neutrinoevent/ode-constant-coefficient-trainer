/**
 * Exact rational arithmetic, just enough to multiply out a characteristic
 * polynomial from its roots without float drift. Roots in the generated corpus
 * are integers or small fractions, so numerators and denominators stay tiny.
 */

export interface Frac {
  n: number
  d: number
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

export function frac(n: number, d = 1): Frac {
  if (d === 0) throw new Error('zero denominator')
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error('frac needs integers')
  const s = d < 0 ? -1 : 1
  const g = gcd(n, d)
  return { n: (s * n) / g, d: (s * d) / g }
}

export const ZERO: Frac = { n: 0, d: 1 }
export const ONE: Frac = { n: 1, d: 1 }

export const fAdd = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d)
export const fSub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d)
export const fMul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d)
export const fNeg = (a: Frac): Frac => ({ n: -a.n, d: a.d })
export const fIsZero = (a: Frac): boolean => a.n === 0
export const fEq = (a: Frac, b: Frac): boolean => a.n === b.n && a.d === b.d
export const fNum = (a: Frac): number => a.n / a.d

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

/**
 * Clear denominators across a list and divide out any common factor, so a
 * polynomial with rational coefficients comes back as coprime integers with a
 * positive leading term.
 */
export function clearDenominators(coeffs: Frac[]): number[] {
  const L = coeffs.reduce((acc, c) => lcm(acc, c.d), 1)
  const ints = coeffs.map((c) => (c.n * L) / c.d)
  const g = ints.reduce((acc, v) => (v === 0 ? acc : gcd(acc, v)), 0) || 1
  const scaled = ints.map((v) => v / g)
  const lead = scaled.find((v) => v !== 0) ?? 1
  return lead < 0 ? scaled.map((v) => -v) : scaled
}

/** Render a fraction as LaTeX: 3, -1/2 -> \tfrac{-1}{2} becomes -\tfrac{1}{2}. */
export function fracTex(a: Frac): string {
  if (a.d === 1) return String(a.n)
  const sign = a.n < 0 ? '-' : ''
  return `${sign}\\tfrac{${Math.abs(a.n)}}{${a.d}}`
}

/** Inline plain-text form, for hints and typed-answer examples. */
export function fracText(a: Frac): string {
  return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`
}
