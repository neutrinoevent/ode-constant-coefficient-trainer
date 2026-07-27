/**
 * Differential operators as integer polynomials in D (§4.5).
 *
 * Coefficients are stored in descending order, so `[1, 0, 4]` is D^2 + 4 and
 * feeds straight into `applyOperator` from the quasipolynomial module. The
 * parser accepts the notation the textbook uses — juxtaposed factors,
 * exponents, and bare `D` — so a student can type `(D-2)^2 D^3` verbatim.
 */

export type Poly = number[]

export const polyOne: Poly = [1]

export function polyTrim(p: Poly): Poly {
  let i = 0
  while (i < p.length - 1 && p[i] === 0) i++
  return p.slice(i)
}

export function polyAdd(p: Poly, q: Poly): Poly {
  const n = Math.max(p.length, q.length)
  const out = Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    out[n - 1 - i] = (p[p.length - 1 - i] ?? 0) + (q[q.length - 1 - i] ?? 0)
  }
  return polyTrim(out)
}

export const polyNeg = (p: Poly): Poly => p.map((v) => -v)

export function polyMul(p: Poly, q: Poly): Poly {
  const out = Array<number>(p.length + q.length - 1).fill(0)
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) out[i + j] += p[i] * q[j]
  }
  return polyTrim(out)
}

export function polyPow(p: Poly, n: number): Poly {
  let out: Poly = polyOne
  for (let i = 0; i < n; i++) out = polyMul(out, p)
  return out
}

export const polyDegree = (p: Poly): number => polyTrim(p).length - 1

export function polyEqual(p: Poly, q: Poly): boolean {
  const a = polyTrim(p)
  const b = polyTrim(q)
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export type ParseResult = { ok: true; poly: Poly } | { ok: false; error: string }

/**
 * Recursive descent over
 *   expr   := term (('+'|'-') term)*
 *   term   := factor (('*')? factor)*
 *   factor := base ('^' integer)?
 *   base   := number | 'D' | '(' expr ')'
 */
export function parseOperator(raw: string): ParseResult {
  const src = raw.replace(/\s+/g, '')
  if (!src) return { ok: false, error: 'Enter an operator, for example (D-2)^2.' }
  if (/[^0-9D()^+\-*]/i.test(src)) {
    const bad = src.match(/[^0-9D()^+\-*]/i)?.[0]
    return { ok: false, error: `Unexpected character “${bad}”. Use D, integers, ( ) and ^.` }
  }

  let i = 0
  let failure: string | null = null

  const fail = (msg: string): Poly => {
    failure ??= msg
    return polyOne
  }

  const parseInt_ = (): number => {
    const start = i
    while (i < src.length && /[0-9]/.test(src[i])) i++
    return Number(src.slice(start, i))
  }

  const parseBase = (): Poly => {
    if (i >= src.length) return fail('The expression ends early — a factor is missing.')
    const ch = src[i]
    if (ch === '(') {
      i++
      const inner = parseExpr()
      if (src[i] !== ')') return fail('Unbalanced parentheses.')
      i++
      return inner
    }
    if (ch === 'D' || ch === 'd') {
      i++
      return [1, 0]
    }
    if (/[0-9]/.test(ch)) return [parseInt_()]
    return fail(`Unexpected “${ch}”.`)
  }

  const parseFactor = (): Poly => {
    const base = parseBase()
    if (src[i] === '^') {
      i++
      if (!/[0-9]/.test(src[i] ?? '')) return fail('An exponent must be a non-negative integer.')
      const n = parseInt_()
      if (n > 12) return fail('That exponent is far larger than any problem here needs.')
      return polyPow(base, n)
    }
    return base
  }

  const startsFactor = () => i < src.length && /[0-9D(d]/.test(src[i])

  const parseTerm = (): Poly => {
    let out = parseFactor()
    for (;;) {
      if (src[i] === '*') {
        i++
        out = polyMul(out, parseFactor())
      } else if (startsFactor()) {
        out = polyMul(out, parseFactor())
      } else break
      if (failure) break
    }
    return out
  }

  const parseExpr = (): Poly => {
    let sign = 1
    if (src[i] === '+' || src[i] === '-') {
      sign = src[i] === '-' ? -1 : 1
      i++
    }
    let out = polyMul([sign], parseTerm())
    while (!failure && (src[i] === '+' || src[i] === '-')) {
      const op = src[i]
      i++
      const rhs = parseTerm()
      out = op === '+' ? polyAdd(out, rhs) : polyAdd(out, polyNeg(rhs))
    }
    return out
  }

  const poly = parseExpr()
  if (failure) return { ok: false, error: failure }
  if (i < src.length) return { ok: false, error: `Could not read “${src.slice(i)}”.` }
  return { ok: true, poly: polyTrim(poly) }
}

/** Descending integer coefficients -> "D^{3} - 2D^{2} + D". */
export function operatorTex(p: Poly): string {
  const poly = polyTrim(p)
  const n = poly.length - 1
  let out = ''
  let first = true
  for (let i = 0; i <= n; i++) {
    const c = poly[i]
    if (c === 0) continue
    const power = n - i
    const body = power === 0 ? '' : power === 1 ? 'D' : `D^{${power}}`
    const mag = Math.abs(c)
    const shown = mag === 1 && power > 0 ? '' : String(mag)
    const sign = c < 0 ? '-' : first ? '' : '+'
    out += `${first ? sign : ` ${sign} `}${shown}${body}`
    first = false
  }
  return first ? '0' : out
}
