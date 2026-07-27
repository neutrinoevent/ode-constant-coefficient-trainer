/**
 * Wrong general solutions worth showing.
 *
 * Each mangle below is a specific error: reading a complex pair as two real
 * roots, losing the factor of x on a repeated root, swapping alpha and beta,
 * flipping a sign coming out of the quadratic formula. A distractor drawn this
 * way tells a student which mistake they just made; a randomly chosen wrong
 * expression tells them nothing.
 */

import { fNum, frac } from '../lib/frac'
import { complex, generalSolutionTex, real, type RealRoot, type RootSet } from '../lib/roots'
import type { RNG } from '../lib/rng'

function negate(roots: RootSet): RootSet {
  return roots.map((r) =>
    r.kind === 'real'
      ? real(frac(-r.m.n, r.m.d), r.mult)
      : complex(frac(-r.a.n, r.a.d), r.b, r.mult),
  )
}

/** Read a conjugate pair as if alpha and beta were two real roots. */
function complexAsReal(roots: RootSet): RootSet | null {
  const out: RootSet = []
  let changed = false
  for (const r of roots) {
    if (r.kind === 'complex' && r.mult === 1 && fNum(r.a) !== fNum(r.b)) {
      out.push(real(r.a), real(r.b))
      changed = true
    } else out.push(r)
  }
  return changed ? out : null
}

/** Swap the roles of the real and imaginary parts. */
function swapAlphaBeta(roots: RootSet): RootSet | null {
  const out: RootSet = []
  let changed = false
  for (const r of roots) {
    if (r.kind === 'complex' && fNum(r.b) > 0 && fNum(r.a) !== 0 && fNum(r.a) !== fNum(r.b)) {
      out.push(complex(r.b, r.a, r.mult))
      changed = true
    } else out.push(r)
  }
  return changed ? out : null
}

/** Treat a repeated root as a plus/minus pair, the reflex from the quadratic formula. */
function repeatedAsPair(roots: RootSet): RootSet | null {
  const out: RootSet = []
  let changed = false
  for (const r of roots) {
    if (r.kind === 'real' && r.mult === 2 && r.m.n !== 0) {
      out.push(real(r.m), real(frac(-r.m.n, r.m.d)))
      changed = true
    } else out.push(r)
  }
  return changed ? out : null
}

/** Collapse two distinct real roots into one repeated one. */
function distinctAsRepeated(roots: RootSet): RootSet | null {
  const idxs = roots.flatMap((r, i) => (r.kind === 'real' && r.mult === 1 ? [i] : []))
  if (idxs.length < 2) return null
  const first = roots[idxs[0]] as RealRoot
  const rest = roots.filter((_, i) => i !== idxs[0] && i !== idxs[1])
  return [real(first.m, 2), ...rest]
}

/** Raise the multiplicity by one, the "one x too many" answer. */
function extraMultiplicity(roots: RootSet): RootSet | null {
  const idx = roots.findIndex((r) => r.mult >= 2)
  if (idx < 0) return null
  const out = roots.slice()
  const r = out[idx]
  out[idx] = r.kind === 'real' ? real(r.m, r.mult + 1) : complex(r.a, r.b, r.mult + 1)
  return out
}

/** A repeated root written twice with no factor of x — two copies of one solution. */
function lostTheX(roots: RootSet): string | null {
  const r = roots.find((x) => x.kind === 'real' && x.mult === 2)
  if (!r || r.kind !== 'real') return null
  const rest = roots.filter((x) => x !== r)
  const m = fNum(r.m)
  const body = m === 0 ? '' : `e^{${m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`}}`
  const doubled = `c_{1}${body || '1'} + c_{2}${body || '1'}`
  if (!rest.length) return doubled
  return `${doubled} + ${generalSolutionTex(rest).replace(/c_\{(\d)\}/g, (_, d: string) => `c_{${Number(d) + 2}}`)}`
}

/** A complex pair with only one of the two trig terms. */
function halfTheTrig(roots: RootSet): string | null {
  const r = roots.find((x) => x.kind === 'complex')
  if (!r || r.kind !== 'complex' || roots.length !== 1 || r.mult !== 1) return null
  const a = fNum(r.a)
  const b = fNum(r.b)
  const ex = a === 0 ? '' : `e^{${a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`}}`
  const arg = b === 1 ? 'x' : `${b}x`
  return `${ex}\\left(c_{1}\\cos ${arg} + c_{2}x\\sin ${arg}\\right)`
}

/**
 * Root sets one arithmetic slip away. Not a named misconception like the
 * mangles above, but always available, so a question never runs short of
 * options when the specific mangles do not apply.
 */
function nudged(roots: RootSet): RootSet[] {
  const out: RootSet[] = []
  for (let i = 0; i < roots.length; i++) {
    for (const d of [1, -1]) {
      const copy = roots.slice()
      const r = roots[i]
      if (r.kind === 'real') {
        copy[i] = real(frac(r.m.n + d * r.m.d, r.m.d), r.mult)
      } else {
        const b = frac(r.b.n + d * r.b.d, r.b.d)
        // A pair needs a strictly positive imaginary part to still be a pair.
        if (fNum(b) <= 0) continue
        copy[i] = complex(r.a, b, r.mult)
      }
      out.push(copy)
    }
  }
  return out
}

/**
 * Up to `count` wrong general solutions for a root set: the named mistakes
 * first, then near misses.
 */
export function wrongSolutions(roots: RootSet, rng: RNG, count = 3): string[] {
  const correct = generalSolutionTex(roots)
  const named = [
    complexAsReal(roots),
    swapAlphaBeta(roots),
    repeatedAsPair(roots),
    distinctAsRepeated(roots),
    extraMultiplicity(roots),
    negate(roots),
  ].filter((r): r is RootSet => r !== null)
  const raw = [lostTheX(roots), halfTheTrig(roots)].filter((s): s is string => s !== null)

  const seen = new Set<string>([correct])
  const out: string[] = []
  const take = (tex: string) => {
    if (seen.has(tex) || out.length >= count) return
    seen.add(tex)
    out.push(tex)
  }
  for (const tex of rng.shuffle([...raw, ...named.map((r) => generalSolutionTex(r))])) take(tex)
  for (const r of rng.shuffle(nudged(roots))) take(generalSolutionTex(r))
  return out
}
