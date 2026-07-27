/**
 * The small amount of linear algebra the answer checker needs: is this sampled
 * function in the span of that fundamental set, and are these functions
 * independent? Modified Gram-Schmidt over sample vectors, which is stable
 * enough at the sizes here (at most eight vectors of a few dozen samples).
 */

export type Vec = number[]

export const dot = (a: Vec, b: Vec): number => a.reduce((s, v, i) => s + v * b[i], 0)
export const norm = (a: Vec): number => Math.sqrt(dot(a, a))

/** Unit-length copy, or null if the vector is numerically zero. */
export function unit(a: Vec): Vec | null {
  const n = norm(a)
  return n < 1e-300 ? null : a.map((v) => v / n)
}

/**
 * Orthonormal basis of the span, by modified Gram-Schmidt. `tol` is relative to
 * each incoming vector's own length, so scale does not decide independence.
 */
export function orthonormalize(vectors: Vec[], tol = 1e-6): Vec[] {
  const basis: Vec[] = []
  for (const v of vectors) {
    const len = norm(v)
    if (len < 1e-300) continue
    let w = v.slice()
    for (const q of basis) {
      const p = dot(w, q)
      for (let i = 0; i < w.length; i++) w[i] -= p * q[i]
    }
    if (norm(w) / len > tol) {
      const u = unit(w)
      if (u) basis.push(u)
    }
    w = []
  }
  return basis
}

/** Relative length of the part of `v` that the basis cannot reach. */
export function residual(v: Vec, basis: Vec[]): number {
  const len = norm(v)
  if (len < 1e-300) return 0
  const w = v.slice()
  for (const q of basis) {
    const p = dot(w, q)
    for (let i = 0; i < w.length; i++) w[i] -= p * q[i]
  }
  return norm(w) / len
}

export const rank = (vectors: Vec[], tol = 1e-6): number => orthonormalize(vectors, tol).length
