/**
 * Wrong general solutions worth showing, each carrying the mistake it encodes.
 *
 * A distractor is only worth a student's attention if picking it teaches them
 * something, so every mangle below is a specific misreading and states, in
 * terms of the numbers actually on screen, what went wrong. Reading a conjugate
 * pair as two real roots, losing the factor of x on a repeated root, swapping
 * alpha and beta, reflexively turning a repeated root into a plus/minus pair:
 * these are the errors that get made, and naming them is the whole point of
 * offering them.
 */

import { fNum, frac } from '../lib/frac'
import { complex, generalSolutionTex, real, type RealRoot, type RootSet } from '../lib/roots'
import type { RNG } from '../lib/rng'

export interface Distractor {
  tex: string
  /** Rich text: what this answer assumed, and what is actually true. */
  why: string
}

/** A root set plus the sentence explaining why reading it that way is wrong. */
interface Mangle {
  roots: RootSet
  why: string
}

const num = (v: number): string => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4))))

const realTex = (r: RealRoot): string => num(fNum(r.m))

function negate(roots: RootSet): Mangle {
  const sample = roots[0]
  const shown = sample.kind === 'real' ? fNum(sample.m) : fNum(sample.a)
  return {
    roots: roots.map((r) =>
      r.kind === 'real'
        ? real(frac(-r.m.n, r.m.d), r.mult)
        : complex(frac(-r.a.n, r.a.d), r.b, r.mult),
    ),
    why: `Every exponent has the wrong sign. The factor $(m ${shown < 0 ? '+' : '-'} ${num(Math.abs(shown))})$ gives the root $m = ${num(shown)}$, and the root goes into the exponent as it stands: $e^{${num(shown)}x}$.`,
  }
}

/** Read a conjugate pair as if alpha and beta were two separate real roots. */
function complexAsReal(roots: RootSet): Mangle | null {
  const out: RootSet = []
  let why: string | null = null
  for (const r of roots) {
    if (r.kind === 'complex' && r.mult === 1 && fNum(r.a) !== fNum(r.b)) {
      out.push(real(r.a), real(r.b))
      why ??= `This treats $m = ${fNum(r.a) === 0 ? '' : num(fNum(r.a))} \\pm ${num(fNum(r.b))}i$ as two separate real roots $${num(fNum(r.a))}$ and $${num(fNum(r.b))}$. A conjugate pair gives one exponential $e^{${num(fNum(r.a))}x}$ carrying a cosine and a sine, not two exponentials.`
    } else out.push(r)
  }
  return why ? { roots: out, why } : null
}

/** Swap the roles of the real and imaginary parts. */
function swapAlphaBeta(roots: RootSet): Mangle | null {
  const out: RootSet = []
  let why: string | null = null
  for (const r of roots) {
    if (r.kind === 'complex' && fNum(r.b) > 0 && fNum(r.a) !== 0 && fNum(r.a) !== fNum(r.b)) {
      out.push(complex(r.b, r.a, r.mult))
      why ??= `$\\alpha$ and $\\beta$ are the wrong way round. For $m = ${num(fNum(r.a))} \\pm ${num(fNum(r.b))}i$, the real part $${num(fNum(r.a))}$ is the exponential rate and the imaginary part $${num(fNum(r.b))}$ is the frequency: $e^{${num(fNum(r.a))}x}$ times $\\cos ${num(fNum(r.b))}x$.`
    } else out.push(r)
  }
  return why ? { roots: out, why } : null
}

/** Treat a repeated root as a plus/minus pair — the quadratic-formula reflex. */
function repeatedAsPair(roots: RootSet): Mangle | null {
  const out: RootSet = []
  let why: string | null = null
  for (const r of roots) {
    if (r.kind === 'real' && r.mult === 2 && r.m.n !== 0) {
      out.push(real(r.m), real(frac(-r.m.n, r.m.d)))
      why ??= `This reads the root as $\\pm ${num(Math.abs(fNum(r.m)))}$. The discriminant is zero here, so the quadratic formula gives $m = ${realTex(r)}$ twice — there is no $\\pm$ to take.`
    } else out.push(r)
  }
  return why ? { roots: out, why } : null
}

/** Collapse two distinct real roots into one repeated one. */
function distinctAsRepeated(roots: RootSet): Mangle | null {
  const idxs = roots.flatMap((r, i) => (r.kind === 'real' && r.mult === 1 ? [i] : []))
  if (idxs.length < 2) return null
  const first = roots[idxs[0]] as RealRoot
  const second = roots[idxs[1]] as RealRoot
  const rest = roots.filter((_, i) => i !== idxs[0] && i !== idxs[1])
  return {
    roots: [real(first.m, 2), ...rest],
    why: `The factor of $x$ belongs to a repeated root. Here $m = ${realTex(first)}$ and $m = ${realTex(second)}$ are two different roots, so each contributes a plain exponential and nothing is multiplied by $x$.`,
  }
}

/** Raise a multiplicity by one — the "one x too many" answer. */
function extraMultiplicity(roots: RootSet): Mangle | null {
  const idx = roots.findIndex((r) => r.mult >= 2)
  if (idx < 0) return null
  const out = roots.slice()
  const r = out[idx]
  out[idx] = r.kind === 'real' ? real(r.m, r.mult + 1) : complex(r.a, r.b, r.mult + 1)
  const total = roots.reduce((n, x) => n + (x.kind === 'real' ? x.mult : 2 * x.mult), 0)
  return {
    roots: out,
    why: `One power of $x$ too many. A root of multiplicity $k$ goes up to $x^{k-1}$, not $x^{k}$ — counting the constants is the check: this equation needs exactly ${total}.`,
  }
}

/** A repeated root written twice with no factor of x — two copies of one solution. */
function lostTheX(roots: RootSet): Distractor | null {
  const r = roots.find((x) => x.kind === 'real' && x.mult === 2)
  if (!r || r.kind !== 'real') return null
  const rest = roots.filter((x) => x !== r)
  const m = fNum(r.m)
  const body = m === 0 ? '' : `e^{${m === 1 ? 'x' : m === -1 ? '-x' : `${num(m)}x`}}`
  const doubled = `c_{1}${body || '1'} + c_{2}${body || '1'}`
  const tex = rest.length
    ? `${doubled} + ${generalSolutionTex(rest).replace(/c_\{(\d)\}/g, (_, d: string) => `c_{${Number(d) + 2}}`)}`
    : doubled
  return {
    tex,
    why: `Writing the same solution twice does not give two solutions — $c_1${body || '1'} + c_2${body || '1'}$ collapses to $(c_1+c_2)${body || '1'}$, which is one function. The double root at $m = ${realTex(r)}$ needs $x${body}$ as its second solution.`,
  }
}

/** A complex pair with the sine partner carrying a stray factor of x. */
function halfTheTrig(roots: RootSet): Distractor | null {
  const r = roots.find((x) => x.kind === 'complex')
  if (!r || r.kind !== 'complex' || roots.length !== 1 || r.mult !== 1) return null
  const a = fNum(r.a)
  const b = fNum(r.b)
  const ex = a === 0 ? '' : `e^{${a === 1 ? 'x' : a === -1 ? '-x' : `${num(a)}x`}}`
  const arg = b === 1 ? 'x' : `${num(b)}x`
  return {
    tex: `${ex}\\left(c_{1}\\cos ${arg} + c_{2}x\\sin ${arg}\\right)`,
    why: `The factor of $x$ comes from a repeated root. This pair $${a === 0 ? '' : num(a)} \\pm ${num(b)}i$ occurs once, so $\\cos ${arg}$ and $\\sin ${arg}$ both appear without it.`,
  }
}

/** Near misses used only when the named mangles run short. */
function nudged(roots: RootSet): Mangle[] {
  const out: Mangle[] = []
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
      out.push({
        roots: copy,
        why: 'The shape is right and a root is wrong. Re-factor the auxiliary equation and check each root against it.',
      })
    }
  }
  return out
}

/**
 * Up to `count` wrong general solutions: the named mistakes first, near misses
 * only to fill.
 */
export function wrongSolutions(roots: RootSet, rng: RNG, count = 3): Distractor[] {
  const correct = generalSolutionTex(roots)
  const named = [
    complexAsReal(roots),
    swapAlphaBeta(roots),
    repeatedAsPair(roots),
    distinctAsRepeated(roots),
    extraMultiplicity(roots),
    negate(roots),
  ].filter((m): m is Mangle => m !== null)
  const raw = [lostTheX(roots), halfTheTrig(roots)].filter((d): d is Distractor => d !== null)

  const seen = new Set<string>([correct])
  const out: Distractor[] = []
  const take = (d: Distractor) => {
    if (seen.has(d.tex) || out.length >= count) return
    seen.add(d.tex)
    out.push(d)
  }
  const asDistractor = (m: Mangle): Distractor => ({ tex: generalSolutionTex(m.roots), why: m.why })

  for (const d of rng.shuffle([...raw, ...named.map(asDistractor)])) take(d)
  for (const m of rng.shuffle(nudged(roots))) take(asDistractor(m))
  return out
}
