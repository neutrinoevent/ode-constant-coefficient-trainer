/**
 * Grading typed solutions.
 *
 * A general solution is a *span*, not a string. Rather than compare text to a
 * stored answer, the checker isolates the function multiplying each arbitrary
 * constant, samples it, and asks two questions: does every one of them lie in
 * the span of the correct fundamental set, and are there exactly as many
 * independent ones as the equation's order? That accepts any legitimate
 * fundamental set — c₁cosh x + c₂sinh x for roots ±1, either order of terms,
 * constants named whatever the student likes — and rejects a set that is short
 * a solution, carries an extra, or quietly repeats one.
 *
 * The same machinery grades an undetermined-coefficients trial form, where the
 * unknowns are A, B, C, … instead of c₁, c₂, ….
 */

// The number-only build: same parser and the same elementary functions, without
// the BigNumber, Complex, and Matrix machinery the checker never touches.
import { parse, type MathNode } from 'mathjs/number'
import { asFunction, type QTerm } from './quasipoly'
import { orthonormalize, rank, residual, type Vec } from './linalg'

export type AnswerCode =
  | 'empty'
  | 'parse'
  | 'symbol'
  | 'nonlinear'
  | 'stray'
  | 'no-constants'
  | 'too-few'
  | 'too-many'
  | 'dependent'
  | 'outside'
  | 'domain'

export type AnswerVerdict = { ok: true; constants: string[] } | { ok: false; code: AnswerCode; message: string }

const KNOWN_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'log', 'log10', 'exp', 'sqrt', 'abs', 'pow',
])

const RESERVED = new Set(['x', 'e', 'pi', 'PI'])

/** Calculator syntax to mathjs syntax: ln, implicit multiplication, ^ chains. */
export function preprocess(raw: string): string {
  let s = raw.trim()
  s = s.replace(/\bln\b/g, 'log')
  s = s.replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'))
  // c_1 -> c1, so subscript habits from LaTeX survive
  s = s.replace(/([A-Za-z])_(\d)/g, '$1$2')
  // Implicit multiplication
  s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2') // 2x, 3sin(, 4(
  s = s.replace(/\)\s*([a-zA-Z0-9(])/g, ')*$1') // )(, )x, )3
  s = s.replace(/\b([a-zA-Z]\d*)\s*\(/g, (m, name: string) =>
    KNOWN_FUNCTIONS.has(name) ? m : `${name}*(`,
  )
  // c1x -> c1*x, Ax -> A*x, but leave function names alone
  s = s.replace(/\b([A-Za-z]\d+)([a-zA-Z])/g, '$1*$2')
  return s
}

interface Compiled {
  evaluate: (scope: Record<string, number>) => unknown
}

interface ParsedExpression {
  node: MathNode
  compiled: Compiled
  constants: string[]
  tex: string
}

/** Parse and collect the free symbols that are not x or a known constant/function. */
export function parseExpression(raw: string): ParsedExpression | { error: string; code: AnswerCode } {
  const cleaned = preprocess(raw)
  if (!cleaned) return { error: 'Enter an expression.', code: 'empty' }
  let node: MathNode
  try {
    node = parse(cleaned)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Could not read that expression.',
      code: 'parse',
    }
  }

  const constants: string[] = []
  let bad: string | null = null
  node.traverse((n, _path, parent) => {
    if (n.type !== 'SymbolNode') return
    const name = (n as MathNode & { name: string }).name
    // A function name appears as the fn of a FunctionNode; skip those.
    if (parent?.type === 'FunctionNode' && (parent as MathNode & { fn?: MathNode }).fn === n) {
      if (!KNOWN_FUNCTIONS.has(name)) bad ??= name
      return
    }
    if (RESERVED.has(name)) return
    if (KNOWN_FUNCTIONS.has(name)) return
    if (!/^[A-Za-z]\d*$/.test(name)) {
      bad ??= name
      return
    }
    if (!constants.includes(name)) constants.push(name)
  })
  if (bad) {
    return { error: `Unknown symbol “${bad}”. Use x for the variable.`, code: 'symbol' }
  }

  let compiled: Compiled
  try {
    compiled = node.compile()
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Could not read that expression.',
      code: 'parse',
    }
  }

  let tex: string
  try {
    tex = node.toTex({ parenthesis: 'auto' })
  } catch {
    tex = cleaned
  }
  return { node, compiled, constants, tex }
}

/** Live preview for the input box: how the expression was read, or why it wasn't. */
export function previewOf(raw: string): { tex: string } | { error: string } | null {
  if (!raw.trim()) return null
  const parsed = parseExpression(raw)
  return 'error' in parsed ? { error: parsed.error } : { tex: parsed.tex }
}

const SAMPLE_LO = -1.1
const SAMPLE_HI = 1.3
const SAMPLE_N = 37

function samplePoints(lo = SAMPLE_LO, hi = SAMPLE_HI, n = SAMPLE_N): number[] {
  return Array.from({ length: n }, (_, i) => lo + ((i + 0.5) / n) * (hi - lo))
}

function sampleAt(compiled: Compiled, scope: Record<string, number>, xs: number[]): Vec | null {
  const out: Vec = []
  for (const x of xs) {
    let v: unknown
    try {
      v = compiled.evaluate({ ...scope, x })
    } catch {
      return null
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    out.push(v)
  }
  return out
}

export interface SpanOptions {
  /** How many arbitrary constants the answer must carry. */
  expected: number
  /** What the constants are called in the prompt, for error wording. */
  constantWord?: string
  /** Sampling window; Cauchy-Euler answers need x > 0. */
  domain?: [number, number]
}

/**
 * Compare a typed answer against a target fundamental set.
 *
 * The target is given as quasipolynomial terms with unit coefficients; each one
 * is sampled to a vector and the span of those vectors is what the answer must
 * reproduce. `target` may also be supplied as raw functions, which is how the
 * Cauchy-Euler mode (x^m, x^m ln x) reuses this checker.
 */
export function checkSpan(
  raw: string,
  target: QTerm[] | ((x: number) => number)[],
  opts: SpanOptions,
): AnswerVerdict {
  const word = opts.constantWord ?? 'arbitrary constant'
  if (!raw.trim()) return { ok: false, code: 'empty', message: 'Enter an answer first.' }

  const parsed = parseExpression(raw)
  if ('error' in parsed) return { ok: false, code: parsed.code, message: parsed.error }
  const { compiled, constants } = parsed

  if (constants.length === 0) {
    return {
      ok: false,
      code: 'no-constants',
      message: `That has no ${word}s in it. A general solution needs ${opts.expected}.`,
    }
  }
  if (constants.length < opts.expected) {
    return {
      ok: false,
      code: 'too-few',
      message: `Only ${constants.length} ${word}${constants.length === 1 ? '' : 's'} — this answer needs ${opts.expected}.`,
    }
  }
  if (constants.length > opts.expected) {
    return {
      ok: false,
      code: 'too-many',
      message: `${constants.length} ${word}s — this answer needs exactly ${opts.expected}.`,
    }
  }

  const [lo, hi] = opts.domain ?? [SAMPLE_LO, SAMPLE_HI]
  const xs = samplePoints(lo, hi)
  const zeroScope = Object.fromEntries(constants.map((c) => [c, 0]))

  const base = sampleAt(compiled, zeroScope, xs)
  if (!base) {
    return {
      ok: false,
      code: 'domain',
      message: 'That expression could not be evaluated across the sample window — check the syntax.',
    }
  }
  if (Math.max(...base.map(Math.abs)) > 1e-9) {
    return {
      ok: false,
      code: 'stray',
      message: `There is a term with no ${word} attached to it.`,
    }
  }

  const columns: Vec[] = []
  for (const c of constants) {
    const one = sampleAt(compiled, { ...zeroScope, [c]: 1 }, xs)
    const two = sampleAt(compiled, { ...zeroScope, [c]: 2 }, xs)
    if (!one || !two) {
      return {
        ok: false,
        code: 'domain',
        message: 'That expression could not be evaluated across the sample window — check the syntax.',
      }
    }
    const magnitude = Math.max(...one.map(Math.abs))
    // A constant that contributes nothing on its own is multiplying another
    // constant rather than a function — c_1c_2e^{3x} rather than c_1e^{3x}.
    if (magnitude < 1e-12) {
      return {
        ok: false,
        code: 'nonlinear',
        message: `${c} multiplies nothing on its own — each ${word} should stand in front of one solution.`,
      }
    }
    // Linear in each constant: doubling it must double the contribution.
    const scaleErr = Math.max(...two.map((v, i) => Math.abs(v - 2 * one[i])))
    if (scaleErr / magnitude > 1e-8) {
      return {
        ok: false,
        code: 'nonlinear',
        message: `${c} is not a plain multiplier — each ${word} should multiply one solution.`,
      }
    }
    columns.push(one)
  }

  const targetVectors: Vec[] = target.map((t) => {
    const f = typeof t === 'function' ? t : asFunction([t])
    return xs.map(f)
  })
  if (targetVectors.some((v) => v.some((c) => !Number.isFinite(c)))) {
    throw new Error('target basis is not finite on the sample window')
  }
  const targetBasis = orthonormalize(targetVectors)

  for (let i = 0; i < columns.length; i++) {
    if (residual(columns[i], targetBasis) > 1e-6) {
      return {
        ok: false,
        code: 'outside',
        message: `The function multiplying ${constants[i]} does not solve the equation.`,
      }
    }
  }
  if (rank(columns) < opts.expected) {
    return {
      ok: false,
      code: 'dependent',
      message: 'Those pieces are not linearly independent — one is a multiple or combination of the others.',
    }
  }
  return { ok: true, constants }
}
