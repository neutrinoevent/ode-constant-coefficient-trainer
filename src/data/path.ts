/**
 * The path: a route through the chapter, one idea at a time.
 *
 * v1 offered every mode and every topic at once, weighted only by adaptive
 * sampling. That is the right shape for someone revising and the wrong shape
 * for someone meeting the material: mixing the three root cases from the first
 * question means none of them ever forms as a category. Interleaving beats
 * blocked practice, but only after each category exists to be interleaved.
 *
 * So each step here teaches one thing, drills that thing alone, and hands over
 * to the next. Steps are data, not content: `practice` names generators and
 * library families that already exist, so adding a generator makes it reachable
 * without touching this file, and nothing in the free-practice modes is
 * removed or duplicated.
 */

import { frac } from '../lib/frac'
import { deriveHomogeneous, deriveTrial, type DerivationStep } from '../lib/derive'
import { complex, real } from '../lib/roots'
import { term } from '../lib/quasipoly'

export type PracticeItem =
  | { kind: 'generator'; generatorId: string; variant?: string }
  | { kind: 'cases'; familyId: string }

export interface TeachBlock {
  /** Rich text paragraphs. */
  body: string[]
  /** A fixed worked example, computed the same way the app computes any other. */
  example?: () => DerivationStep[]
  exampleLabel?: string
}

export interface PathStep {
  id: string
  title: string
  /** What you will be able to do when this step is behind you. */
  goal: string
  section: string
  teach?: TeachBlock
  practice: PracticeItem[]
  /** Questions in a run, and how many must be right to clear it. */
  run: { length: number; pass: number }
  /** Families this step covers, used by "practice this more". */
  scope: string[]
}

export const PATH: PathStep[] = [
  {
    id: 'p-exponential',
    title: 'Why an exponential',
    goal: 'Turn a differential equation into a polynomial equation.',
    section: '§4.3',
    teach: {
      body: [
        'A constant-coefficient equation asks for a function whose derivatives are all multiples of itself. One elementary family does that: $y = e^{mx}$, where every derivative brings down another factor of $m$ and leaves $e^{mx}$ untouched.',
        'Substituting it turns the differential equation into a polynomial equation in $m$ — the auxiliary equation. Nothing else in this chapter is harder than that step, and everything else is read off its roots.',
      ],
      example: () => deriveHomogeneous([real(frac(3)), real(frac(-1))]),
      exampleLabel: 'Worked through',
    },
    practice: [{ kind: 'generator', generatorId: 'roots-only', variant: 'distinct' }],
    run: { length: 4, pass: 3 },
    scope: ['roots2'],
  },
  {
    id: 'p-roots',
    title: 'Read the roots',
    goal: 'Get $m_1$ and $m_2$ out of any second-order equation.',
    section: '§4.3',
    teach: {
      body: [
        'Before any solution, get the roots. Factor when it factors, use the quadratic formula when it does not.',
        'The sign flips on the way out: the factor $(m - 3)$ gives the root $m = 3$. That is the single most common slip in the whole section, and it is worth checking every time by substituting a root back in.',
        'The discriminant $b^2 - 4ac$ decides which of three cases you are in before you compute anything: positive, zero, or negative.',
      ],
    },
    practice: [{ kind: 'generator', generatorId: 'roots-only' }],
    run: { length: 6, pass: 5 },
    scope: ['roots2'],
  },
  {
    id: 'p-case-1',
    title: 'Case I — distinct real roots',
    goal: 'Write the solution when $b^2 - 4ac > 0$.',
    section: '§4.3',
    teach: {
      body: [
        'Two different real roots give two different exponentials, and that is the whole answer: $y = c_1e^{m_1x} + c_2e^{m_2x}$.',
        'No factors of $x$, no trigonometry. If you find yourself writing either one here, the roots were not distinct and real.',
      ],
      example: () => deriveHomogeneous([real(frac(2)), real(frac(-5))]),
    },
    practice: [
      { kind: 'generator', generatorId: 'general-2-choice', variant: 'distinct' },
      { kind: 'generator', generatorId: 'general-2', variant: 'distinct' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['roots2'],
  },
  {
    id: 'p-case-2',
    title: 'Case II — a repeated root',
    goal: 'Write the solution when $b^2 - 4ac = 0$, and know where the $x$ comes from.',
    section: '§4.3',
    teach: {
      body: [
        'A zero discriminant means the quadratic formula returns one root, twice. Writing $e^{m_1x}$ down twice does not give two solutions: $c_1e^{m_1x} + c_2e^{m_1x}$ collapses to $(c_1+c_2)e^{m_1x}$, which is one function with one constant.',
        'Reduction of order supplies the one that is missing, and what it produces is $y_2 = xe^{m_1x}$. The factor of $x$ is the signature of a repeated root; it appears here and nowhere else in the second-order cases.',
        'The count is the check. A second-order equation needs two independent solutions and therefore two arbitrary constants — no more, no fewer.',
      ],
      example: () => deriveHomogeneous([real(frac(2), 2)]),
    },
    practice: [
      { kind: 'generator', generatorId: 'general-2-choice', variant: 'repeated' },
      { kind: 'generator', generatorId: 'general-2', variant: 'repeated' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['roots2'],
  },
  {
    id: 'p-case-3',
    title: 'Case III — a complex pair',
    goal: 'Write the real solution when $b^2 - 4ac < 0$.',
    section: '§4.3',
    teach: {
      body: [
        'A negative discriminant gives $m = \\alpha \\pm i\\beta$. The complex exponentials $e^{(\\alpha \\pm i\\beta)x}$ are a perfectly good fundamental set, but they are complex-valued, and Euler\'s formula lets you take real combinations of them instead.',
        'What comes out is $y = e^{\\alpha x}\\left(c_1\\cos\\beta x + c_2\\sin\\beta x\\right)$. The real part $\\alpha$ becomes the exponential rate; the imaginary part $\\beta$ becomes the frequency. Getting those two the wrong way round is the standard error.',
        'Both trig terms are always present, even though the equation gave no hint of either. They are two independent solutions, and you need two.',
      ],
      example: () => deriveHomogeneous([complex(frac(-1), frac(2))]),
    },
    practice: [
      { kind: 'generator', generatorId: 'general-2-choice', variant: 'complex' },
      { kind: 'generator', generatorId: 'general-2', variant: 'complex' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['roots2'],
  },
  {
    id: 'p-mixed',
    title: 'Tell them apart',
    goal: 'Name the case and write the solution without being told which it is.',
    section: '§4.3',
    teach: {
      body: [
        'The three cases have been drilled one at a time. This step mixes them, which is the skill the chapter is actually testing: seeing an equation and knowing, before working anything out, what shape the answer will take.',
        'The decision is one line. $b^2 - 4ac > 0$: two exponentials. $= 0$: an exponential and $x$ times it. $< 0$: an exponential carrying a cosine and a sine.',
        'The reverse check is worth building now: given a solution, which case produced it? A factor of $x$ means repeated. A cosine means complex. Neither means distinct real.',
      ],
    },
    practice: [
      { kind: 'generator', generatorId: 'case-2' },
      { kind: 'generator', generatorId: 'general-2-choice' },
      { kind: 'generator', generatorId: 'general-2' },
    ],
    run: { length: 8, pass: 7 },
    scope: ['roots2'],
  },
  {
    id: 'p-behaviour',
    title: 'What the roots mean',
    goal: 'Read growth, decay, and oscillation straight off the roots.',
    section: '§4.3',
    teach: {
      body: [
        'The roots say more than the algebra. The real part of a root sets growth or decay: negative decays, positive grows, zero neither. A nonzero imaginary part is what oscillates, and its size is the frequency.',
        'That reading is why the same three cases turn up as overdamped, critically damped, and underdamped motion in the next chapter — the discriminant is the difference between a spring that returns quietly to rest and one that rings.',
      ],
    },
    practice: [
      { kind: 'generator', generatorId: 'behaviour' },
      { kind: 'generator', generatorId: 'damping' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['roots2', 'damping'],
  },
  {
    id: 'p-reverse',
    title: 'Backwards',
    goal: 'Recover the equation from its solution.',
    section: '§4.3',
    teach: {
      body: [
        'Running the process in reverse is what separates understanding it from recognizing it. Read the roots off the solution, build $\\prod(m - m_i) = 0$, multiply out, and swap each $m^{k}$ for $y^{(k)}$.',
        'A repeated root shows up as a factor of $x$; a pair $\\alpha \\pm i\\beta$ shows up as $e^{\\alpha x}$ carrying $\\cos\\beta x$ and $\\sin\\beta x$, and contributes the quadratic factor $m^2 - 2\\alpha m + (\\alpha^2+\\beta^2)$.',
      ],
    },
    practice: [
      { kind: 'generator', generatorId: 'reverse-ode' },
      { kind: 'generator', generatorId: 'roots-to-basis' },
    ],
    run: { length: 5, pass: 4 },
    scope: ['rootsn'],
  },
  {
    id: 'p-higher',
    title: 'Higher order',
    goal: 'Handle multiplicity, and complex pairs that repeat.',
    section: '§4.3',
    teach: {
      body: [
        'Order $n$ is the same three cases indexed by multiplicity. A real root of multiplicity $k$ contributes $e^{mx}, xe^{mx}, \\ldots, x^{k-1}e^{mx}$ — powers up to $x^{k-1}$, not $x^{k}$, so that the count comes out to $k$.',
        'A pair $\\alpha \\pm i\\beta$ of multiplicity $k$ contributes the cosine and the sine each multiplied by $x^{j}$ for $j < k$: $2k$ solutions, matching the $2k$ roots the pair accounts for.',
        'The check never changes. Count the arbitrary constants; there must be exactly $n$.',
      ],
      example: () => deriveHomogeneous([real(frac(-1), 2), complex(frac(0), frac(3))]),
    },
    practice: [
      { kind: 'generator', generatorId: 'from-factored' },
      { kind: 'generator', generatorId: 'general-n' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['rootsn'],
  },
  {
    id: 'p-structure',
    title: 'Adding a forcing term',
    goal: 'Know what a nonhomogeneous solution is made of.',
    section: '§4.1',
    teach: {
      body: [
        'With a right-hand side, the general solution is $y = y_c + y_p$: the complementary function, which is the general solution of the homogeneous equation and carries all $n$ arbitrary constants, plus any one particular solution, which carries none.',
        'So everything drilled so far is still step one of every nonhomogeneous problem. Nothing is replaced.',
        'Superposition does the rest: if $g$ splits into pieces, solve for each piece and add the particular solutions.',
      ],
    },
    practice: [{ kind: 'cases', familyId: 'structure' }],
    run: { length: 6, pass: 5 },
    scope: ['structure'],
  },
  {
    id: 'p-trial',
    title: 'Guessing the shape of y_p',
    goal: 'Write a trial form when nothing duplicates $y_c$.',
    section: '§4.4',
    teach: {
      body: [
        'Undetermined coefficients guesses the shape of $y_p$ from the shape of $g(x)$, then solves for the coefficients. It works because the family of polynomials, exponentials, sines and cosines is closed under differentiation — a guess from that family stays in it.',
        'Group $g(x)$ by its exponential rate and frequency. Each group gets a full polynomial of its own highest degree, with every lower power included, because differentiating the top term produces them all. A group carrying a $\\cos$ or a $\\sin$ gets both, because differentiating either produces the other.',
        'This step keeps the forcing function clear of $y_c$, so the shape is the only thing being decided.',
      ],
      example: () => deriveTrial([term(3, 1, 0, 0, 'cos')], [real(frac(2)), real(frac(-1))]),
      exampleLabel: 'Worked through',
    },
    practice: [
      { kind: 'generator', generatorId: 'trial-choice', variant: 'plain' },
      { kind: 'generator', generatorId: 'trial-form', variant: 'plain' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['trial'],
  },
  {
    id: 'p-multiplication',
    title: 'The multiplication rule',
    goal: 'Handle a forcing term that already solves the homogeneous equation.',
    section: '§4.4',
    teach: {
      body: [
        'When a term of the trial form already appears in $y_c$, substituting it back gives zero, and no coefficient can be found. The fix is to multiply that whole group by $x^{s}$, where $s$ is the multiplicity of the corresponding root of the auxiliary equation.',
        'Two things go wrong here. The multiplier applies to the entire group, not to the offending term alone — multiplying only the constant in $Ax + B$ leaves $Ax + Bx$, which is one function, not two. And $s$ is the multiplicity exactly: no larger, or the extra coefficients solve to zero.',
        'This is why $y_c$ has to be computed first. The rule cannot be applied without the roots.',
      ],
      example: () => deriveTrial([term(1, 0, 2)], [real(frac(2), 2)]),
      exampleLabel: 'Worked through',
    },
    practice: [
      { kind: 'generator', generatorId: 'shift-s', variant: 'resonant' },
      { kind: 'generator', generatorId: 'trial-choice', variant: 'resonant' },
      { kind: 'generator', generatorId: 'trial-form', variant: 'resonant' },
    ],
    run: { length: 8, pass: 7 },
    scope: ['trial'],
  },
  {
    id: 'p-annihilator',
    title: 'Annihilators',
    goal: 'Get the same trial forms from operator algebra instead of a rule.',
    section: '§4.5',
    teach: {
      body: [
        'The annihilator approach reaches the same trial forms without a rule to remember. Find an operator that kills $g(x)$, apply it to the whole equation, and what was nonhomogeneous becomes homogeneous at higher order.',
        'Three patterns cover everything: $D^{n}$ kills polynomials up to $x^{n-1}$, $(D-\\alpha)^{n}$ kills $x^{n-1}e^{\\alpha x}$, and $\\left(D^2 - 2\\alpha D + (\\alpha^2+\\beta^2)\\right)^{n}$ kills $x^{n-1}e^{\\alpha x}$ times a cosine or a sine. For a sum, multiply the factors.',
        'Solve the combined homogeneous equation, discard the part that is $y_c$, and what remains is the trial form — including the powers of $x$ that §4.4 had to supply by hand.',
      ],
    },
    practice: [
      { kind: 'generator', generatorId: 'annihilator-choice' },
      { kind: 'generator', generatorId: 'annihilator' },
      { kind: 'generator', generatorId: 'annihilator-route' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['annih'],
  },
  {
    id: 'p-varpar',
    title: 'When the guess will not work',
    goal: 'Know which method applies, and set up the other one.',
    section: '§4.6',
    teach: {
      body: [
        'Undetermined coefficients needs $g(x)$ to be a polynomial, an exponential, a sine or cosine, or a product of those. $\\tan x$, $\\ln x$, $\\sec x$, and $1/x$ are all outside it, because differentiating them never closes.',
        'Variation of parameters handles any continuous $g$. Divide through so the leading coefficient is $1$ — skipping that is the standard error, since $f$ must be $g/a_2$ — then $y_p = u_1y_1 + u_2y_2$ with $u_1\' = W_1/W$ and $u_2\' = W_2/W$.',
      ],
    },
    practice: [{ kind: 'cases', familyId: 'varpar' }],
    run: { length: 6, pass: 5 },
    scope: ['varpar'],
  },
  {
    id: 'p-cauchy',
    title: 'Cauchy-Euler',
    goal: 'Recognize the three cases in a variable-coefficient disguise.',
    section: '§4.7',
    teach: {
      body: [
        'In $ax^2y\'\' + bxy\' + cy = 0$ the power of $x$ on each term matches the order of its derivative, which makes $y = x^{m}$ the right guess instead of $y = e^{mx}$.',
        'Substituting gives $am(m-1) + bm + c = 0$. Expanding $m(m-1)$ is the step people skip: the linear coefficient is $b - a$, not $b$.',
        'Then it is the same three cases. Distinct real roots give $x^{m_1}$ and $x^{m_2}$; a repeated root gives $x^{m_1}$ and $x^{m_1}\\ln x$; a pair gives $x^{\\alpha}\\cos(\\beta\\ln x)$ and its sine partner. The substitution $x = e^{t}$ turns the equation into a constant-coefficient one in $t$, with $t = \\ln x$ — which is exactly why $\\ln x$ appears where $x$ used to.',
      ],
    },
    practice: [
      { kind: 'generator', generatorId: 'cauchy-case' },
      { kind: 'generator', generatorId: 'cauchy-solve' },
    ],
    run: { length: 6, pass: 5 },
    scope: ['cauchy'],
  },
]

export const PATH_BY_ID = new Map(PATH.map((s) => [s.id, s]))

/** The first step not yet cleared, or null when the path is finished. */
export function nextStep(done: readonly string[]): PathStep | null {
  return PATH.find((s) => !done.includes(s.id)) ?? null
}
