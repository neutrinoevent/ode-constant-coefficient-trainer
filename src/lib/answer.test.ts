import { describe, expect, it } from 'vitest'
import { checkSpan } from './answer'
import { term } from './quasipoly'
import { basisTerms, charPoly, complex, real } from './roots'
import { frac } from './frac'
import { annihilatorOf, gradeAnnihilator } from './annihilator'
import { parseOperator, operatorTex } from './operator'
import { trialTerms } from './undetermined'

const distinctReal = basisTerms([real(frac(3)), real(frac(-1))]) // e^{3x}, e^{-x}
const repeated = basisTerms([real(frac(2), 2)]) // e^{2x}, x e^{2x}
const oscillating = basisTerms([complex(frac(-1), frac(2))]) // e^{-x}cos 2x, e^{-x}sin 2x
const pureTrig = basisTerms([complex(frac(0), frac(1))]) // cos x, sin x

const accepts = (raw: string, target = distinctReal, expected = 2) =>
  checkSpan(raw, target, { expected })

describe('general solutions', () => {
  it('accepts the canonical form', () => {
    expect(accepts('c1*e^(3x) + c2*e^(-x)').ok).toBe(true)
  })

  it('does not care about term order, spacing, or constant names', () => {
    expect(accepts('k2 e^(-x) + k1 e^(3x)').ok).toBe(true)
    expect(accepts('c_1e^{3x}+c_2e^{-x}').ok).toBe(true)
  })

  it('accepts any fundamental set spanning the same space', () => {
    // cosh x and sinh x span the same space as e^x and e^{-x}.
    const pm = basisTerms([real(frac(1)), real(frac(-1))])
    expect(checkSpan('c1*cosh(x) + c2*sinh(x)', pm, { expected: 2 }).ok).toBe(true)
    // Any invertible recombination works too.
    expect(accepts('c1*(e^(3x) + e^(-x)) + c2*(e^(3x) - e^(-x))').ok).toBe(true)
  })

  it('accepts the factored form of a complex case', () => {
    expect(checkSpan('e^(-x)*(c1*cos(2x) + c2*sin(2x))', oscillating, { expected: 2 }).ok).toBe(true)
    expect(checkSpan('c1*e^(-x)*cos(2x) + c2*e^(-x)*sin(2x)', oscillating, { expected: 2 }).ok).toBe(
      true,
    )
  })

  it('rejects a repeated root written without the factor of x', () => {
    const v = checkSpan('c1*e^(2x) + c2*e^(2x)', repeated, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('dependent')
  })

  it('rejects a solution of the wrong equation', () => {
    const v = checkSpan('c1*e^(3x) + c2*e^(x)', distinctReal, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('outside')
  })

  it('rejects a complex case with only one trig term', () => {
    const v = checkSpan('c1*cos(x)', pureTrig, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('too-few')
  })

  it('rejects an extra arbitrary constant', () => {
    const v = checkSpan('c1*e^(3x) + c2*e^(-x) + c3*x*e^(3x)', distinctReal, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('too-many')
  })

  it('rejects a term carrying no arbitrary constant', () => {
    const v = checkSpan('c1*e^(3x) + c2*e^(-x) + 5', distinctReal, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('stray')
  })

  it('rejects constants multiplied together instead of distributed', () => {
    const v = checkSpan('c1*c2*e^(3x)', distinctReal, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('nonlinear')
  })

  it('names the unknown symbol it could not read', () => {
    const v = checkSpan('c1*e^(3t) + c2*e^(-t)', distinctReal, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.message).toContain('t')
  })
})

describe('trial forms', () => {
  // y'' - 4y' + 4y = e^{2x}: m = 2 is a double root, so s = 2.
  const roots = [real(frac(2), 2)]
  const g = [term(1, 0, 2)]
  const target = trialTerms(g, roots)

  it('demands the x^2 the multiplication rule calls for', () => {
    expect(checkSpan('A*x^2*e^(2x)', target, { expected: 1 }).ok).toBe(true)
    expect(checkSpan('A*e^(2x)', target, { expected: 1 }).ok).toBe(false)
    expect(checkSpan('A*x*e^(2x)', target, { expected: 1 }).ok).toBe(false)
  })

  it('requires both trig slots when g has only one', () => {
    // y'' + y = cos 2x, no duplication: A cos 2x + B sin 2x.
    const trig = trialTerms([term(1, 0, 0, 2, 'cos')], [complex(frac(0), frac(1))])
    expect(checkSpan('A*cos(2x) + B*sin(2x)', trig, { expected: 2 }).ok).toBe(true)
    const v = checkSpan('A*cos(2x)', trig, { expected: 2 })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.code).toBe('too-few')
  })
})

describe('annihilators', () => {
  const check = (raw: string, g: Parameters<typeof annihilatorOf>[0]) => {
    const parsed = parseOperator(raw)
    if (!parsed.ok) return { ok: false as const, message: parsed.error }
    return gradeAnnihilator(parsed.poly, g, annihilatorOf(g).order)
  }

  it('parses juxtaposed factors and exponents', () => {
    expect(parseOperator('(D-2)^2 D^3').ok).toBe(true)
    const squared = parseOperator('(D-2)^2')
    expect(squared.ok && operatorTex(squared.poly)).toBe('D^{2} - 4D + 4')
  })

  it('accepts the minimal annihilator', () => {
    const g = [term(3, 1, 2)] // 3x e^{2x}
    const v = check('(D-2)^2', g)
    expect(v.ok).toBe(true)
    expect(v.ok && v.minimal).toBe(true)
  })

  it('accepts a larger operator but flags it as not minimal', () => {
    const g = [term(3, 1, 2)]
    const v = check('(D-2)^3', g)
    expect(v.ok).toBe(true)
    expect(v.ok && v.minimal).toBe(false)
  })

  it('rejects an operator that does not annihilate g', () => {
    expect(check('(D-2)', [term(3, 1, 2)]).ok).toBe(false)
    expect(check('(D+2)^2', [term(3, 1, 2)]).ok).toBe(false)
  })

  it('handles the exponential-times-trig factor', () => {
    const g = [term(1, 0, -1, 3, 'cos')] // e^{-x} cos 3x
    expect(annihilatorOf(g).poly).toEqual([1, 2, 10])
    expect(check('D^2+2D+10', g).ok).toBe(true)
  })

  it('multiplies factors for a sum', () => {
    const g = [term(1, 0, 0), term(1, 0, 0, 2, 'sin')] // 1 + sin 2x
    expect(check('D(D^2+4)', g).ok).toBe(true)
    expect(check('D + (D^2+4)', g).ok).toBe(false)
  })

  it('reports a parse error rather than guessing', () => {
    expect(parseOperator('(D-2').ok).toBe(false)
    expect(parseOperator('x^2').ok).toBe(false)
  })
})

describe('characteristic polynomials', () => {
  it('multiplies out to coprime integers with a positive lead', () => {
    expect(charPoly([real(frac(3)), real(frac(-1))])).toEqual([1, -2, -3])
    expect(charPoly([real(frac(2), 2)])).toEqual([1, -4, 4])
    expect(charPoly([complex(frac(-1), frac(2))])).toEqual([1, 2, 5])
    // Half-integer roots clear to an integer leading coefficient.
    expect(charPoly([real(frac(1, 2)), real(frac(-3))])).toEqual([2, 5, -3])
  })
})
