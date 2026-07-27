/**
 * The case library.
 *
 * One entry per fact a student has to hold in their head to work Zill chapter 4
 * without looking anything up. Prompts and answers are rich text: `$...$`
 * segments render as math, everything else as prose. `traps` are the wrong
 * answers worth showing — each one is a mistake that actually gets made, not
 * filler, so a distractor is itself a teaching moment.
 *
 * Section numbers follow Zill, *A First Course in Differential Equations*, 9e.
 */

export interface CaseItem {
  id: string
  familyId: string
  /** Short label for lists, tables, and the flashcard front. */
  name: string
  prompt: string
  answer: string
  /** Why it earns its keep, or the boundary of when it applies. */
  note?: string
  /** Wrong answers that a student plausibly produces. */
  traps?: string[]
}

export interface Family {
  id: string
  name: string
  section: string
  blurb: string
  cases: Omit<CaseItem, 'familyId'>[]
}

export const FAMILIES: Family[] = [
  {
    id: 'structure',
    name: 'Solution structure',
    section: '§4.1',
    blurb:
      'What a general solution is made of, and how many pieces it takes. Every later section assumes this scaffolding, and most lost points trace back to it rather than to the algebra.',
    cases: [
      {
        id: 'st-superposition',
        name: 'Superposition, homogeneous',
        prompt: 'If $y_1$ and $y_2$ both solve a homogeneous linear DE on an interval, what else solves it?',
        answer: 'Every linear combination $c_1y_1 + c_2y_2$',
        note: 'This fails for nonhomogeneous equations and for nonlinear ones. It is what makes a two-dimensional solution space possible.',
        traps: ['Only the sum $y_1 + y_2$', 'The product $y_1y_2$', 'Only $y_1$ and $y_2$ themselves'],
      },
      {
        id: 'st-fundamental-set',
        name: 'Size of a fundamental set',
        prompt: 'How many linearly independent solutions does an $n$th-order homogeneous linear DE have on an interval $I$?',
        answer: 'Exactly $n$',
        note: 'So the count of arbitrary constants in a general solution is fixed by the order, before you compute anything.',
        traps: ['$n - 1$', '$n + 1$', 'It depends on the coefficients'],
      },
      {
        id: 'st-general-nonhomog',
        name: 'General solution, nonhomogeneous',
        prompt: 'What is the general solution of a nonhomogeneous linear DE?',
        answer: '$y = y_c + y_p$: the complementary function plus any one particular solution',
        note: '$y_c$ carries all $n$ arbitrary constants; $y_p$ carries none.',
        traps: [
          '$y = y_c \\cdot y_p$',
          '$y = y_p$ alone',
          '$y = y_c$ alone',
        ],
      },
      {
        id: 'st-yc-meaning',
        name: 'Complementary function',
        prompt: 'What is $y_c$ for a nonhomogeneous equation $L(y) = g(x)$?',
        answer: 'The general solution of the associated homogeneous equation $L(y) = 0$',
        traps: [
          'A particular solution of $L(y) = g(x)$',
          'The part of the solution containing $g(x)$',
          'The solution satisfying the initial conditions',
        ],
      },
      {
        id: 'st-superposition-nonhomog',
        name: 'Superposition for particular solutions',
        prompt: 'If $y_{p_1}$ solves $L(y) = g_1$ and $y_{p_2}$ solves $L(y) = g_2$, what solves $L(y) = g_1 + g_2$?',
        answer: '$y_{p_1} + y_{p_2}$',
        note: 'This is why a forcing function can be split into pieces and handled one at a time.',
        traps: ['$y_{p_1}y_{p_2}$', '$y_{p_1}$ only', '$\\tfrac{1}{2}(y_{p_1} + y_{p_2})$'],
      },
      {
        id: 'st-wronskian-def',
        name: 'Wronskian of two functions',
        prompt: 'Write $W(y_1, y_2)$.',
        answer: '$W = y_1y_2\' - y_2y_1\'$',
        traps: ['$W = y_1y_2\' + y_2y_1\'$', '$W = y_1\'y_2\' - y_1y_2$', '$W = y_1y_2 - y_1\'y_2\''],
      },
      {
        id: 'st-wronskian-test',
        name: 'Wronskian test',
        prompt: 'For solutions of a homogeneous linear DE on $I$, what does $W \\neq 0$ tell you?',
        answer: 'The solutions are linearly independent, so they form a fundamental set',
        note: 'For solutions of the same linear DE the Wronskian is either identically zero or never zero on $I$, so testing one point settles it.',
        traps: [
          'They are linearly dependent',
          'The equation has constant coefficients',
          'The initial-value problem has no solution',
        ],
      },
      {
        id: 'st-trivial',
        name: 'Trivial solution',
        prompt: 'What does $y = 0$ do for a homogeneous linear DE?',
        answer: 'It always solves it',
        note: 'And by the existence-uniqueness theorem it is the only solution with all-zero initial conditions.',
        traps: ['It solves it only for constant coefficients', 'It never solves it', 'It solves it only if $a_0 = 0$'],
      },
      {
        id: 'st-ivp-conditions',
        name: 'Initial conditions for an IVP',
        prompt: 'What conditions does an $n$th-order initial-value problem impose?',
        answer: 'Values of $y, y\', \\ldots, y^{(n-1)}$ at one single point $x_0$',
        note: 'Conditions at two different points make it a boundary-value problem, where existence and uniqueness can both fail.',
        traps: [
          'Values of $y$ at $n$ different points',
          'Values of $y$ and $y\'$ at two endpoints',
          'Values of $y^{(n)}$ at one point',
        ],
      },
      {
        id: 'st-linear-dependence',
        name: 'Linear dependence',
        prompt: 'When is a set of functions linearly dependent on an interval?',
        answer: 'When some nontrivial combination $c_1f_1 + \\cdots + c_nf_n$ is identically zero on the interval',
        traps: [
          'When they all vanish at some point',
          'When one is a constant multiple of another at some point',
          'When their Wronskian is nonzero',
        ],
      },
    ],
  },
  {
    id: 'roots2',
    name: 'Second-order root cases',
    section: '§4.3',
    blurb:
      'The three cases for $ay\'\' + by\' + cy = 0$. The whole section is one decision — sign of the discriminant — followed by one memorized form. Getting fluent here is most of the chapter.',
    cases: [
      {
        id: 'r2-aux',
        name: 'Auxiliary equation',
        prompt: 'What auxiliary equation does $ay\'\' + by\' + cy = 0$ produce?',
        answer: '$am^2 + bm + c = 0$',
        note: 'It comes from substituting $y = e^{mx}$ and dividing out $e^{mx}$, which is never zero.',
        traps: ['$am^2 + bm = 0$', '$m^2 + bm + c = 0$', '$am^2 - bm + c = 0$'],
      },
      {
        id: 'r2-case1',
        name: 'Case I — distinct real',
        prompt: 'Distinct real roots $m_1 \\neq m_2$. General solution?',
        answer: '$y = c_1e^{m_1x} + c_2e^{m_2x}$',
        traps: [
          '$y = c_1e^{m_1x} + c_2xe^{m_2x}$',
          '$y = e^{m_1x}(c_1 + c_2x)$',
          '$y = c_1e^{m_1x}\\cos m_2x + c_2e^{m_1x}\\sin m_2x$',
        ],
      },
      {
        id: 'r2-case2',
        name: 'Case II — repeated real',
        prompt: 'A repeated real root $m_1$. General solution?',
        answer: '$y = c_1e^{m_1x} + c_2xe^{m_1x}$',
        note: 'The extra factor of $x$ is what reduction of order produces; without it you have one solution, not two.',
        traps: [
          '$y = c_1e^{m_1x} + c_2e^{m_1x}$',
          '$y = c_1e^{m_1x} + c_2e^{-m_1x}$',
          '$y = c_1e^{m_1x} + c_2x^2e^{m_1x}$',
        ],
      },
      {
        id: 'r2-case3',
        name: 'Case III — conjugate complex',
        prompt: 'Roots $m = \\alpha \\pm i\\beta$ with $\\beta > 0$. General solution in real form?',
        answer: '$y = e^{\\alpha x}(c_1\\cos\\beta x + c_2\\sin\\beta x)$',
        traps: [
          '$y = e^{\\beta x}(c_1\\cos\\alpha x + c_2\\sin\\alpha x)$',
          '$y = c_1e^{\\alpha x}\\cos\\beta x$',
          '$y = e^{\\alpha x}(c_1\\cos\\beta x + c_2x\\sin\\beta x)$',
        ],
      },
      {
        id: 'r2-disc-pos',
        name: 'Discriminant positive',
        prompt: '$b^2 - 4ac > 0$. Which case?',
        answer: 'Case I — two distinct real roots',
        traps: ['Case II — one repeated real root', 'Case III — conjugate complex roots', 'No real solutions'],
      },
      {
        id: 'r2-disc-zero',
        name: 'Discriminant zero',
        prompt: '$b^2 - 4ac = 0$. Which case?',
        answer: 'Case II — one real root of multiplicity two',
        traps: ['Case I — two distinct real roots', 'Case III — conjugate complex roots', 'The equation has no solution'],
      },
      {
        id: 'r2-disc-neg',
        name: 'Discriminant negative',
        prompt: '$b^2 - 4ac < 0$. Which case?',
        answer: 'Case III — a conjugate complex pair $\\alpha \\pm i\\beta$',
        traps: ['Case I — two distinct real roots', 'Case II — one repeated real root', 'The solutions are complex-valued'],
      },
      {
        id: 'r2-alpha-beta',
        name: 'Reading α and β',
        prompt: 'The roots of $am^2 + bm + c = 0$ are complex. What are $\\alpha$ and $\\beta$?',
        answer: '$\\alpha = -\\dfrac{b}{2a}$ and $\\beta = \\dfrac{\\sqrt{4ac - b^2}}{2a}$',
        traps: [
          '$\\alpha = -\\dfrac{b}{a},\\ \\beta = \\dfrac{\\sqrt{4ac - b^2}}{a}$',
          '$\\alpha = \\dfrac{b}{2a},\\ \\beta = \\dfrac{\\sqrt{b^2 - 4ac}}{2a}$',
          '$\\alpha = -\\dfrac{b}{2a},\\ \\beta = \\dfrac{\\sqrt{b^2 - 4ac}}{2a}$',
        ],
      },
      {
        id: 'r2-euler',
        name: 'Why the real form',
        prompt: 'Where does $e^{\\alpha x}(c_1\\cos\\beta x + c_2\\sin\\beta x)$ come from?',
        answer: 'Euler\'s formula applied to $e^{(\\alpha \\pm i\\beta)x}$, then taking real combinations',
        note: 'The complex exponentials are a perfectly good fundamental set; the real form is a change of basis, chosen so the answer is real-valued.',
        traps: [
          'A separate theorem unrelated to the exponential case',
          'The Wronskian test',
          'Reduction of order',
        ],
      },
      {
        id: 'r2-beta-sign',
        name: 'Sign of β',
        prompt: 'Does it matter whether you use $\\beta$ or $-\\beta$ in the real form?',
        answer: 'No — the sign is absorbed into $c_2$, since $\\sin(-\\beta x) = -\\sin\\beta x$',
        traps: [
          'Yes, $\\beta$ must be negative',
          'Yes, the solution changes sign',
          'Yes, only $\\beta > 0$ gives a real solution',
        ],
      },
      {
        id: 'r2-second-solution',
        name: 'Second solution, repeated root',
        prompt: 'For a repeated root, why is $xe^{m_1x}$ the second solution rather than $e^{m_1x}$ again?',
        answer: 'Reduction of order on $y_1 = e^{m_1x}$ gives $y_2 = xe^{m_1x}$, and $e^{m_1x}$ repeated would be linearly dependent',
        traps: [
          'It is a convention with no derivation',
          'Because $x$ makes the Wronskian zero',
          'Because the auxiliary equation has degree two',
        ],
      },
    ],
  },
  {
    id: 'rootsn',
    name: 'Higher-order roots',
    section: '§4.3',
    blurb:
      'Order $n$ is the same three cases indexed by multiplicity. Once you can write the basis attached to a root of multiplicity $k$, order makes no difference.',
    cases: [
      {
        id: 'rn-real-mult',
        name: 'Real root, multiplicity k',
        prompt: 'A real root $m_1$ of multiplicity $k$ contributes which solutions?',
        answer: '$e^{m_1x},\\ xe^{m_1x},\\ \\ldots,\\ x^{k-1}e^{m_1x}$',
        note: 'Highest power of $x$ is $k - 1$, not $k$ — the count has to come out to $k$ solutions.',
        traps: [
          '$e^{m_1x},\\ xe^{m_1x},\\ \\ldots,\\ x^{k}e^{m_1x}$',
          '$e^{m_1x}$ repeated $k$ times',
          '$e^{m_1x},\\ e^{2m_1x},\\ \\ldots,\\ e^{km_1x}$',
        ],
      },
      {
        id: 'rn-complex-mult',
        name: 'Complex pair, multiplicity k',
        prompt: 'A pair $\\alpha \\pm i\\beta$ of multiplicity $k$ contributes which solutions?',
        answer: '$x^{j}e^{\\alpha x}\\cos\\beta x$ and $x^{j}e^{\\alpha x}\\sin\\beta x$ for $j = 0, 1, \\ldots, k-1$',
        note: 'That is $2k$ solutions, matching the $2k$ roots the pair accounts for.',
        traps: [
          '$x^{j}e^{\\alpha x}\\cos\\beta x$ for $j = 0, \\ldots, 2k-1$',
          '$e^{\\alpha x}\\cos\\beta x$ and $e^{\\alpha x}\\sin\\beta x$ only',
          '$x^{k}e^{\\alpha x}\\cos\\beta x$ and $x^{k}e^{\\alpha x}\\sin\\beta x$',
        ],
      },
      {
        id: 'rn-degree',
        name: 'Degree matches order',
        prompt: 'What is the degree of the auxiliary equation of an $n$th-order constant-coefficient DE?',
        answer: '$n$, so it has $n$ roots counted with multiplicity',
        traps: ['$n - 1$', '$2n$', 'It depends on how many coefficients are nonzero'],
      },
      {
        id: 'rn-conjugates',
        name: 'Complex roots come in pairs',
        prompt: 'The coefficients are real and $\\alpha + i\\beta$ is a root. What else is a root?',
        answer: '$\\alpha - i\\beta$, with the same multiplicity',
        note: 'This is why a complex pair always adds an even number to the order.',
        traps: ['$-\\alpha + i\\beta$', '$-\\alpha - i\\beta$', 'Nothing further is forced'],
      },
      {
        id: 'rn-rational-root',
        name: 'Finding a first root',
        prompt: 'The auxiliary polynomial has integer coefficients. Where do you look for a rational root?',
        answer: 'Among $\\pm p/q$ with $p$ dividing the constant term and $q$ dividing the leading coefficient',
        note: 'For a monic polynomial that reduces to the integer divisors of the constant term — usually $\\pm1, \\pm2, \\pm3$ in practice.',
        traps: [
          'Among divisors of the leading coefficient only',
          'Among $\\pm1$ only',
          'There is no systematic place to look',
        ],
      },
      {
        id: 'rn-basis-count',
        name: 'Counting the basis',
        prompt: 'How do you check you have written down the whole general solution?',
        answer: 'Count the arbitrary constants — there must be exactly $n$ of them for an $n$th-order equation',
        traps: [
          'Check that the Wronskian is zero',
          'Count the distinct roots',
          'Count the terms in the auxiliary equation',
        ],
      },
    ],
  },
  {
    id: 'trial',
    name: 'Undetermined coefficients',
    section: '§4.4',
    blurb:
      'Guess the shape of $y_p$ from the shape of $g(x)$. The guessing part is mechanical; the multiplication rule is where the marks go.',
    cases: [
      {
        id: 'uc-applies',
        name: 'When it applies',
        prompt: 'Which forcing functions can undetermined coefficients handle?',
        answer: 'Constants, polynomials, $e^{\\alpha x}$, $\\sin\\beta x$, $\\cos\\beta x$, and finite products of these',
        note: 'The reason is closure: this family stays inside itself under differentiation. $\\ln x$, $1/x$, and $\\tan x$ do not, so they need variation of parameters.',
        traps: [
          'Any continuous function',
          'Any function with an elementary antiderivative',
          'Only polynomials and exponentials',
        ],
      },
      {
        id: 'uc-poly',
        name: 'Polynomial forcing',
        prompt: 'Trial form for $g(x) = 3x^2 - 1$, with no root at $m = 0$?',
        answer: '$y_p = Ax^2 + Bx + C$',
        note: 'Full polynomial of the same degree, every power present, even the ones missing from $g$.',
        traps: ['$y_p = Ax^2$', '$y_p = Ax^2 + B$', '$y_p = Ax^3 + Bx^2 + Cx + D$'],
      },
      {
        id: 'uc-exp',
        name: 'Exponential forcing',
        prompt: 'Trial form for $g(x) = 5e^{3x}$, with $m = 3$ not a root?',
        answer: '$y_p = Ae^{3x}$',
        traps: ['$y_p = Axe^{3x}$', '$y_p = Ae^{3x} + B$', '$y_p = 5Ae^{3x}$'],
      },
      {
        id: 'uc-trig',
        name: 'Sine or cosine forcing',
        prompt: 'Trial form for $g(x) = \\sin 4x$, with $m = \\pm 4i$ not roots?',
        answer: '$y_p = A\\cos 4x + B\\sin 4x$',
        note: 'Both go in even though only one appears in $g$: differentiating a sine produces a cosine, so the pair is inseparable.',
        traps: ['$y_p = A\\sin 4x$', '$y_p = A\\cos 4x$', '$y_p = Ax\\sin 4x$'],
      },
      {
        id: 'uc-product',
        name: 'Product forcing',
        prompt: 'Trial form for $g(x) = xe^{2x}$, with $m = 2$ not a root?',
        answer: '$y_p = (Ax + B)e^{2x}$',
        traps: ['$y_p = Axe^{2x}$', '$y_p = Ax + Be^{2x}$', '$y_p = (Ax^2 + Bx + C)e^{2x}$'],
      },
      {
        id: 'uc-exp-trig',
        name: 'Exponential times trig',
        prompt: 'Trial form for $g(x) = e^{-x}\\cos 2x$, with $m = -1 \\pm 2i$ not roots?',
        answer: '$y_p = e^{-x}(A\\cos 2x + B\\sin 2x)$',
        traps: [
          '$y_p = Ae^{-x}\\cos 2x$',
          '$y_p = Ae^{-x} + B\\cos 2x$',
          '$y_p = xe^{-x}(A\\cos 2x + B\\sin 2x)$',
        ],
      },
      {
        id: 'uc-poly-trig',
        name: 'Polynomial times trig',
        prompt: 'Trial form for $g(x) = x\\cos 3x$, with $m = \\pm 3i$ not roots?',
        answer: '$y_p = (Ax + B)\\cos 3x + (Cx + D)\\sin 3x$',
        note: 'Four unknowns: the polynomial degree doubles the count because both trig slots need one.',
        traps: [
          '$y_p = (Ax + B)\\cos 3x$',
          '$y_p = Ax\\cos 3x + Bx\\sin 3x$',
          '$y_p = (Ax + B)(\\cos 3x + \\sin 3x)$',
        ],
      },
      {
        id: 'uc-rule',
        name: 'Multiplication rule',
        prompt: 'A term of your trial $y_p$ already appears in $y_c$. What do you do?',
        answer: 'Multiply that whole group by $x^s$, where $s$ is the multiplicity of the corresponding root',
        note: 'The smallest power that clears the duplication, applied to the entire group — not to the offending term alone.',
        traps: [
          'Drop the duplicated term',
          'Multiply only the duplicated term by $x$',
          'Switch to variation of parameters',
        ],
      },
      {
        id: 'uc-rule-group',
        name: 'The rule acts on the whole group',
        prompt: '$y_c = c_1 + c_2e^{2x}$ and $g(x) = 4x$. Trial form?',
        answer: '$y_p = x(Ax + B) = Ax^2 + Bx$',
        note: '$m = 0$ is a root, so $s = 1$ and the whole polynomial gets the factor. Multiplying only the constant term would leave $Ax + Bx$, which is one function, not two.',
        traps: ['$y_p = Ax + B$', '$y_p = Ax^2$', '$y_p = x^2(Ax + B)$'],
      },
      {
        id: 'uc-rule-repeated',
        name: 'Duplication against a repeated root',
        prompt: '$y_c = c_1e^{2x} + c_2xe^{2x}$ and $g(x) = e^{2x}$. Trial form?',
        answer: '$y_p = Ax^2e^{2x}$',
        note: '$m = 2$ has multiplicity two, so $s = 2$.',
        traps: ['$y_p = Ae^{2x}$', '$y_p = Axe^{2x}$', '$y_p = Ax^3e^{2x}$'],
      },
      {
        id: 'uc-yc-first',
        name: 'Order of operations',
        prompt: 'What must you compute before you can write down the trial form?',
        answer: '$y_c$ — the multiplication rule needs the roots of the auxiliary equation',
        traps: [
          'The Wronskian',
          'A particular solution by inspection',
          'Nothing; the trial form depends only on $g(x)$',
        ],
      },
      {
        id: 'uc-split',
        name: 'Sums in g(x)',
        prompt: '$g(x) = e^{x} + \\sin x$. How do you handle it?',
        answer: 'Treat each piece separately and add the results, by superposition',
        note: 'The multiplication rule is decided per group, so one piece can pick up an $x^s$ while the other does not.',
        traps: [
          'Use the trial form of whichever term dominates',
          'Multiply the two trial forms',
          'Undetermined coefficients does not apply to sums',
        ],
      },
    ],
  },
  {
    id: 'annih',
    name: 'Annihilators',
    section: '§4.5',
    blurb:
      'The operator view of the same trial forms. Applying an annihilator turns a nonhomogeneous problem into a homogeneous one of higher order, and the multiplication rule stops being something to remember.',
    cases: [
      {
        id: 'an-dn',
        name: 'Powers of D',
        prompt: 'Which operator annihilates $1, x, x^2, \\ldots, x^{n-1}$?',
        answer: '$D^{n}$',
        traps: ['$D^{n-1}$', '$D^{n+1}$', '$(D - 1)^{n}$'],
      },
      {
        id: 'an-exp',
        name: 'Exponential',
        prompt: 'Which operator annihilates $e^{\\alpha x},\\ xe^{\\alpha x},\\ \\ldots,\\ x^{n-1}e^{\\alpha x}$?',
        answer: '$(D - \\alpha)^{n}$',
        traps: ['$(D + \\alpha)^{n}$', '$(D - \\alpha)^{n-1}$', '$D^{n} - \\alpha$'],
      },
      {
        id: 'an-trig',
        name: 'Sine and cosine',
        prompt: 'Which operator annihilates $\\cos\\beta x$ and $\\sin\\beta x$?',
        answer: '$D^2 + \\beta^2$',
        traps: ['$D^2 - \\beta^2$', '$D^2 + \\beta$', '$(D - \\beta)^2$'],
      },
      {
        id: 'an-exp-trig',
        name: 'Exponential times trig',
        prompt: 'Which operator annihilates $x^{j}e^{\\alpha x}\\cos\\beta x$ and $x^{j}e^{\\alpha x}\\sin\\beta x$ for $j < n$?',
        answer: '$\\left(D^2 - 2\\alpha D + (\\alpha^2 + \\beta^2)\\right)^{n}$',
        note: 'The inner quadratic is exactly the factor a pair $\\alpha \\pm i\\beta$ contributes to a characteristic polynomial.',
        traps: [
          '$\\left(D^2 + 2\\alpha D + (\\alpha^2 + \\beta^2)\\right)^{n}$',
          '$\\left(D^2 - 2\\alpha D + (\\alpha^2 - \\beta^2)\\right)^{n}$',
          '$(D - \\alpha)^{n}(D^2 + \\beta^2)^{n}$',
        ],
      },
      {
        id: 'an-product',
        name: 'Annihilating a sum',
        prompt: '$L_1$ annihilates $g_1$ and $L_2$ annihilates $g_2$. What annihilates $g_1 + g_2$?',
        answer: 'The product $L_1L_2$',
        note: 'Constant-coefficient operators commute, so the order does not matter.',
        traps: ['$L_1 + L_2$', 'Whichever of $L_1, L_2$ has higher order', 'No single operator does'],
      },
      {
        id: 'an-minimal',
        name: 'Which annihilator to use',
        prompt: 'Many operators annihilate a given $g(x)$. Which one do you want?',
        answer: 'The one of lowest order',
        note: 'A larger operator still works but inflates the auxiliary equation and leaves you solving for coefficients that turn out to be zero.',
        traps: ['Any of them, they give identical work', 'The one of highest order', 'The one matching the order of the original DE'],
      },
      {
        id: 'an-method',
        name: 'How the method runs',
        prompt: 'You have annihilated $g(x)$ with $L_1$. What now?',
        answer: 'Solve the homogeneous equation $L_1L(y) = 0$, discard the part that is $y_c$, and the rest is the trial $y_p$',
        note: 'The discarded overlap is precisely what the multiplication rule handles by hand in §4.4.',
        traps: [
          'The general solution of $L_1L(y) = 0$ is the answer',
          'Apply $L_1$ to $y_c$ instead',
          'Divide the equation by $L_1$',
        ],
      },
      {
        id: 'an-notation',
        name: 'Operator notation',
        prompt: 'What does $(D - 2)y$ mean?',
        answer: '$y\' - 2y$',
        traps: ['$y\' \\cdot (-2)$', '$y\'\' - 2y$', '$-2y\''],
      },
    ],
  },
  {
    id: 'varpar',
    name: 'Variation of parameters',
    section: '§4.6',
    blurb:
      'What to do when $g(x)$ falls outside the undetermined-coefficients family. Slower, always available, and unforgiving about the standard form.',
    cases: [
      {
        id: 'vp-standard-form',
        name: 'Standard form first',
        prompt: 'Before applying the formulas, what must the equation look like?',
        answer: '$y\'\' + P(x)y\' + Q(x)y = f(x)$ — leading coefficient divided out',
        note: 'Skipping this is the most common error in the section: $f$ must be $g/a_2$, not $g$.',
        traps: [
          '$a_2y\'\' + a_1y\' + a_0y = g(x)$ as given',
          'The auxiliary equation must be monic',
          'It must be homogeneous',
        ],
      },
      {
        id: 'vp-form',
        name: 'Form of the particular solution',
        prompt: 'What form does variation of parameters seek?',
        answer: '$y_p = u_1y_1 + u_2y_2$, with $y_1, y_2$ a fundamental set of the homogeneous equation',
        traps: [
          '$y_p = u_1y_1 + u_2y_2$ with $u_1, u_2$ constant',
          '$y_p = u_1y_1u_2y_2$',
          '$y_p = y_1 + y_2 + u$',
        ],
      },
      {
        id: 'vp-w1w2',
        name: 'The determinants',
        prompt: 'Write $W_1$ and $W_2$.',
        answer: '$W_1 = -y_2f(x)$ and $W_2 = y_1f(x)$',
        note: 'They are $W$ with the corresponding column replaced by $(0, f)$, which is Cramer\'s rule on the system for $u_1\', u_2\'$.',
        traps: [
          '$W_1 = y_2f(x),\\ W_2 = -y_1f(x)$',
          '$W_1 = -y_2\'f(x),\\ W_2 = y_1\'f(x)$',
          '$W_1 = y_1f(x),\\ W_2 = y_2f(x)$',
        ],
      },
      {
        id: 'vp-derivatives',
        name: 'Solving for the parameters',
        prompt: 'What are $u_1\'$ and $u_2\'$?',
        answer: '$u_1\' = \\dfrac{W_1}{W}$ and $u_2\' = \\dfrac{W_2}{W}$',
        note: 'Then integrate. No constants of integration are needed — they would only rebuild $y_c$.',
        traps: [
          '$u_1 = \\dfrac{W_1}{W},\\ u_2 = \\dfrac{W_2}{W}$ with no integration',
          '$u_1\' = \\dfrac{W}{W_1},\\ u_2\' = \\dfrac{W}{W_2}$',
          '$u_1\' = W_1W,\\ u_2\' = W_2W$',
        ],
      },
      {
        id: 'vp-when',
        name: 'When to reach for it',
        prompt: 'When is variation of parameters the method to use?',
        answer: 'Whenever $g(x)$ is outside the undetermined-coefficients family — $\\tan x$, $\\ln x$, $1/x$, $\\sec x$',
        note: 'It also works for the easy cases; it is just more integration than they need.',
        traps: [
          'Only for constant-coefficient equations',
          'Only when the roots are complex',
          'Only when $g(x)$ is a polynomial',
        ],
      },
      {
        id: 'vp-nonzero-w',
        name: 'Why W is never zero',
        prompt: 'Why can you always divide by $W$ here?',
        answer: '$y_1, y_2$ are a fundamental set, so $W \\neq 0$ on the interval',
        traps: [
          '$W$ is a constant',
          'Because the coefficients are constant',
          'You cannot; the method fails where $W = 0$',
        ],
      },
    ],
  },
  {
    id: 'cauchy',
    name: 'Cauchy-Euler',
    section: '§4.7',
    blurb:
      'Variable coefficients that behave like constant ones. $x = e^{t}$ turns the equation into a constant-coefficient equation, which is why the same three cases show up with $\\ln x$ where $x$ used to be.',
    cases: [
      {
        id: 'ce-form',
        name: 'The form',
        prompt: 'What makes an equation Cauchy-Euler?',
        answer: 'Each term is $a_kx^{k}y^{(k)}$ — the power of $x$ matches the order of the derivative',
        traps: [
          'The coefficients are polynomials',
          'Each term is $a_kx^{k}y$',
          'The equation is homogeneous',
        ],
      },
      {
        id: 'ce-substitution',
        name: 'The substitution',
        prompt: 'What do you substitute to find the auxiliary equation?',
        answer: '$y = x^{m}$',
        traps: ['$y = e^{mx}$', '$y = mx$', '$y = x^{m}\\ln x$'],
      },
      {
        id: 'ce-aux',
        name: 'The auxiliary equation',
        prompt: 'What auxiliary equation does $ax^2y\'\' + bxy\' + cy = 0$ produce?',
        answer: '$am(m-1) + bm + c = 0$, that is $am^2 + (b-a)m + c = 0$',
        note: 'Forgetting to expand $m(m-1)$ is the standard slip — the linear coefficient is $b - a$, not $b$.',
        traps: ['$am^2 + bm + c = 0$', '$am(m+1) + bm + c = 0$', '$am^2 + (a-b)m + c = 0$'],
      },
      {
        id: 'ce-case1',
        name: 'Distinct real roots',
        prompt: 'Distinct real roots $m_1 \\neq m_2$. General solution on $x > 0$?',
        answer: '$y = c_1x^{m_1} + c_2x^{m_2}$',
        traps: [
          '$y = c_1e^{m_1x} + c_2e^{m_2x}$',
          '$y = c_1x^{m_1} + c_2x^{m_1}\\ln x$',
          '$y = x^{m_1}(c_1 + c_2x)$',
        ],
      },
      {
        id: 'ce-case2',
        name: 'Repeated root',
        prompt: 'A repeated root $m_1$. General solution on $x > 0$?',
        answer: '$y = c_1x^{m_1} + c_2x^{m_1}\\ln x$',
        note: '$\\ln x$ takes the place the factor $x$ takes in the constant-coefficient case — the substitution $x = e^{t}$ makes them the same statement.',
        traps: [
          '$y = c_1x^{m_1} + c_2xx^{m_1}$',
          '$y = c_1x^{m_1} + c_2x^{m_1+1}$',
          '$y = (c_1 + c_2)x^{m_1}$',
        ],
      },
      {
        id: 'ce-case3',
        name: 'Complex roots',
        prompt: 'Roots $m = \\alpha \\pm i\\beta$. General solution on $x > 0$?',
        answer: '$y = x^{\\alpha}\\left(c_1\\cos(\\beta\\ln x) + c_2\\sin(\\beta\\ln x)\\right)$',
        traps: [
          '$y = x^{\\alpha}(c_1\\cos\\beta x + c_2\\sin\\beta x)$',
          '$y = e^{\\alpha x}(c_1\\cos(\\beta\\ln x) + c_2\\sin(\\beta\\ln x))$',
          '$y = x^{\\beta}(c_1\\cos(\\alpha\\ln x) + c_2\\sin(\\alpha\\ln x))$',
        ],
      },
      {
        id: 'ce-interval',
        name: 'Interval of validity',
        prompt: 'Why is the solution stated on $x > 0$?',
        answer: 'The equation is singular at $x = 0$, where the leading coefficient vanishes',
        note: 'For $x < 0$, substitute $t = -x$; the usual shortcut is to write $|x|$.',
        traps: [
          '$x^{m}$ is undefined for negative $x$ for every $m$',
          'The auxiliary equation has no roots for $x < 0$',
          'It is a convention with no reason behind it',
        ],
      },
      {
        id: 'ce-to-constant',
        name: 'Reduction to constant coefficients',
        prompt: 'What does $x = e^{t}$ do to a Cauchy-Euler equation?',
        answer: 'Turns it into a constant-coefficient equation in $t$',
        note: 'And $t = \\ln x$, which is where every $\\ln x$ in the solutions comes from.',
        traps: [
          'Makes it homogeneous',
          'Makes it first order',
          'Makes it separable',
        ],
      },
    ],
  },
  {
    id: 'reduction',
    name: 'Reduction of order',
    section: '§4.2',
    blurb:
      'One known solution buys the second. It is also the derivation behind the repeated-root case, so it explains a form rather than adding one.',
    cases: [
      {
        id: 'ro-formula',
        name: 'The formula',
        prompt: 'Given $y_1$ solving $y\'\' + P(x)y\' + Q(x)y = 0$, what is $y_2$?',
        answer: '$y_2 = y_1\\displaystyle\\int \\frac{e^{-\\int P\\,dx}}{y_1^{2}}\\,dx$',
        traps: [
          '$y_2 = y_1\\displaystyle\\int \\frac{e^{\\int P\\,dx}}{y_1^{2}}\\,dx$',
          '$y_2 = \\displaystyle\\int \\frac{e^{-\\int P\\,dx}}{y_1^{2}}\\,dx$',
          '$y_2 = y_1\\displaystyle\\int \\frac{e^{-\\int P\\,dx}}{y_1}\\,dx$',
        ],
      },
      {
        id: 'ro-standard',
        name: 'Standard form again',
        prompt: 'What is $P(x)$ in that formula?',
        answer: 'The coefficient of $y\'$ after dividing through by the coefficient of $y\'\'$',
        traps: ['The coefficient of $y\'$ as written', 'The coefficient of $y$', 'The forcing function'],
      },
      {
        id: 'ro-substitution',
        name: 'The substitution behind it',
        prompt: 'What substitution produces the formula?',
        answer: '$y = u(x)y_1(x)$, which reduces the equation to first order in $u\'$',
        traps: ['$y = u + y_1$', '$y = e^{u}y_1$', '$y = u/y_1$'],
      },
      {
        id: 'ro-repeated',
        name: 'The repeated-root case',
        prompt: 'Apply it to $y_1 = e^{m_1x}$ for a repeated root. What comes out?',
        answer: '$y_2 = xe^{m_1x}$',
        note: 'For $ay\'\' + by\' + cy = 0$ with a repeated root, $P = b/a = -2m_1$, and the integral collapses to $\\int dx = x$.',
        traps: ['$y_2 = x^2e^{m_1x}$', '$y_2 = e^{2m_1x}$', '$y_2 = e^{-m_1x}$'],
      },
      {
        id: 'ro-independence',
        name: 'Why the second solution is new',
        prompt: 'Why is the $y_2$ the formula produces guaranteed independent of $y_1$?',
        answer: 'Their ratio $y_2/y_1$ is a nonconstant integral, so neither is a constant multiple of the other',
        traps: [
          'Because the formula includes a constant of integration',
          'Because $y_2$ has a higher power of $x$',
          'It is not guaranteed; it has to be checked with the Wronskian',
        ],
      },
    ],
  },
  {
    id: 'damping',
    name: 'Damped motion',
    section: '§5.1',
    blurb:
      'The three cases as physics. $mx\'\' + \\beta x\' + kx = 0$ is the same equation, and the discriminant is the difference between an oscillation and a slow return to rest.',
    cases: [
      {
        id: 'dm-equation',
        name: 'The equation',
        prompt: 'Write the free damped spring-mass equation.',
        answer: '$m\\dfrac{d^2x}{dt^2} + \\beta\\dfrac{dx}{dt} + kx = 0$',
        note: 'Zill divides through and writes $x\'\' + 2\\lambda x\' + \\omega^2x = 0$ with $2\\lambda = \\beta/m$ and $\\omega^2 = k/m$.',
        traps: [
          '$m\\dfrac{d^2x}{dt^2} + kx = \\beta$',
          '$m\\dfrac{d^2x}{dt^2} - \\beta\\dfrac{dx}{dt} + kx = 0$',
          '$\\beta\\dfrac{d^2x}{dt^2} + m\\dfrac{dx}{dt} + kx = 0$',
        ],
      },
      {
        id: 'dm-over',
        name: 'Overdamped',
        prompt: '$\\beta^2 - 4mk > 0$. What is the motion called, and what does it look like?',
        answer: 'Overdamped — two distinct negative real roots, smooth decay with at most one crossing of equilibrium',
        traps: [
          'Underdamped — decaying oscillation',
          'Critically damped — fastest return without oscillating',
          'Undamped — steady oscillation',
        ],
      },
      {
        id: 'dm-critical',
        name: 'Critically damped',
        prompt: '$\\beta^2 - 4mk = 0$. What is the motion called?',
        answer: 'Critically damped — a repeated root, and any decrease in damping produces oscillation',
        note: 'The solution $e^{m_1t}(c_1 + c_2t)$ still crosses equilibrium at most once.',
        traps: [
          'Overdamped — two distinct real roots',
          'Underdamped — decaying oscillation',
          'Resonant',
        ],
      },
      {
        id: 'dm-under',
        name: 'Underdamped',
        prompt: '$\\beta^2 - 4mk < 0$. What is the motion called, and what does it look like?',
        answer: 'Underdamped — complex roots, oscillation inside a decaying envelope $e^{-\\beta t/2m}$',
        traps: [
          'Overdamped — no oscillation',
          'Critically damped — repeated root',
          'Undamped — constant amplitude',
        ],
      },
      {
        id: 'dm-undamped',
        name: 'Undamped',
        prompt: '$\\beta = 0$. What are the roots and the motion?',
        answer: 'Pure imaginary roots $\\pm i\\sqrt{k/m}$ — simple harmonic motion at constant amplitude',
        traps: [
          'A repeated root at zero — no motion',
          'Two negative real roots — decay',
          'Complex roots with negative real part — decaying oscillation',
        ],
      },
      {
        id: 'dm-sign',
        name: 'Why the roots have negative real part',
        prompt: 'With $m, \\beta, k > 0$, why is every root\'s real part negative?',
        answer: 'The real part is $-\\beta/2m < 0$, and in the real case $\\sqrt{\\beta^2 - 4mk} < \\beta$',
        note: 'That is the algebraic reason free damped motion always dies out.',
        traps: [
          'Because the discriminant is negative',
          'Because $k > 0$ alone forces it',
          'They need not be; overdamping can give a positive root',
        ],
      },
      {
        id: 'dm-amplitude-form',
        name: 'Amplitude form',
        prompt: 'Rewrite $e^{-\\lambda t}(c_1\\cos\\omega t + c_2\\sin\\omega t)$ as a single trig term.',
        answer: '$Ae^{-\\lambda t}\\sin(\\omega t + \\phi)$ with $A = \\sqrt{c_1^2 + c_2^2}$',
        note: '$A e^{-\\lambda t}$ is the damped amplitude and $\\phi$ the phase angle.',
        traps: [
          '$Ae^{-\\lambda t}\\sin(\\omega t)$ with $A = c_1 + c_2$',
          '$Ae^{-\\lambda t}\\cos(\\omega t\\phi)$ with $A = c_1c_2$',
          '$Ae^{-\\lambda t}\\sin(\\phi t + \\omega)$ with $A = \\sqrt{c_1^2 + c_2^2}$',
        ],
      },
    ],
  },
]

export interface FlatCase extends CaseItem {
  familyName: string
  section: string
}

export const ALL_CASES: FlatCase[] = FAMILIES.flatMap((f) =>
  f.cases.map((c) => ({ ...c, familyId: f.id, familyName: f.name, section: f.section })),
)

export const CASE_BY_ID = new Map(ALL_CASES.map((c) => [c.id, c]))
export const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]))
