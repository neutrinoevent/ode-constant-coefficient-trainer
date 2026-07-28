# ODE Trainer

Drill the case structure of constant-coefficient linear ODEs — the material in Zill, *A First Course in Differential Equations*, 9e, chapter 4. Three root cases, one multiplication rule, a handful of operator identities. The content is small; the skill is recognizing which case you are in without stopping to think. That is what this drills.

Covers §4.1 solution structure, §4.2 reduction of order, §4.3 the three root cases at every order, §4.4 undetermined coefficients and the multiplication rule, §4.5 annihilators, §4.6 variation of parameters, §4.7 Cauchy–Euler, and the damped-motion reading of the same three cases in §5.1.

A 15-step guided path through the chapter, 73 stated results across 9 topics, and 18 problem generators (12 multiple choice, 6 typed). Local-first: no server, no accounts, progress in `localStorage`.

## Learning it, not just being tested on it

The path is the default view. Each step teaches one idea, shows it worked through on the numbers actually in front of you, then drills that idea **alone** before the next arrives — the three root cases get a step each before anything mixes them. Mixed practice beats blocked practice, but only once each case exists as a category to tell apart.

Worked derivations are computed, not written. Every intermediate is recoverable from the same root set the problem was generated from — substitute, factor out, factor, read the roots, name the case, attach a basis function to each root — so "Show me how" produces a real derivation for any question, in Path, Classify, or Solve, and can never drift from the answer being graded.

Wrong multiple-choice options are named mistakes, and picking one says which:

> **What that answer assumed** — This treats $m = -1 \pm 2i$ as two separate real roots $-1$ and $2$. A conjugate pair gives one exponential $e^{-x}$ carrying a cosine and a sine, not two exponentials.

Nothing is gated. All nine tabs are open from the first launch; the path is a route, not a wall. Placing yourself as revising for an exam skips it entirely.

## Answer checking

There is no computer algebra system and no stored answer string.

**General solutions.** A general solution is a *span*. The checker isolates the function multiplying each arbitrary constant, samples it, and asks two things: does every one lie in the span of a correct fundamental set, and are there exactly as many independent ones as the equation's order? So any legitimate fundamental set passes — `c1*cosh(x) + c2*sinh(x)` for roots ±1, terms in any order, constants named whatever you like, any invertible recombination. A repeated root written without its factor of `x` fails as *linearly dependent*, and the message says so rather than saying "wrong".

**Trial forms.** The same machinery with `A, B, C, …` in place of the arbitrary constants. A missing `x^s` and a missing sine partner both fail for their own stated reason.

**Annihilators.** Typed operator notation — `(D-2)^2`, `D^3(D^2+9)` — parsed into an integer polynomial in `D` and applied to `g(x)` exactly. Any operator that kills `g` is accepted; one that is not of least order is accepted with a note naming the minimal order.

The exactness comes from a quasipolynomial module (`src/lib/quasipoly.ts`): finite sums of `c·x^k e^{ax} cos(bx)` and its sine partner. That set is closed under differentiation, so applying a constant-coefficient operator is arithmetic rather than numerical estimation. Every solution basis, forcing function, trial form, and annihilator in the app lives there.

## Modes

- **Path** — 15 steps from "why an exponential" to Cauchy–Euler. Teach, worked example, then a short run of questions drawn from that step alone, with a pass mark to clear it.
- **Learn** — the case library by section, with the specific mistake each result invites. A reference rather than a route.
- **Classify** — multiple choice over everything at once, mixing stated results with freshly generated equations. Distractors are named errors: a complex pair read as two real roots, a repeated root that lost its `x`, the multiplication rule applied to one term instead of the whole group. Keys 1–4 answer, Enter advances.
- **Solve** — type the answer. General solutions to order four, trial forms, annihilators, Cauchy–Euler.
- **Challenge** — roots plotted in the complex plane with no equation given, and a board pairing root lists with solution bases.
- **Cards** — spaced repetition (SM-2 style) over the stated results. A miss in Classify or Solve pulls the matching card's review forward.
- **Progress** — per-topic mastery tiers, and JSON backup and restore.
- **Settings** — experience-level presets plus individual overrides: choices per question (fixed or mastery-scaled 2→4), accuracy-band difficulty adaptation, whether the complementary function is given on nonhomogeneous problems, and card pace.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # corpus + checker + UI tests
npm run lint
npm run build    # type-check + production build to dist/
```

`dist/` deploys to any static host. For GitHub Pages under a subpath, set `base` in `vite.config.ts`.

## Tests

The path test keeps its pointers honest: every generator and family a step names must exist, every variant it asks for must be offered, and pinning `general-2-choice` to `repeated` must actually produce a repeated root on every seed.

The corpus test runs every generator over 200 seeds and checks each problem against its own stated answer using the same code that grades a student: the exemplar answer must pass the grader, the stated fundamental set must be annihilated exactly by the stated operator and be numerically independent on the sample window, and multiple-choice options must be distinct with the correct one present. A generator that drifts out of agreement with its answer fails there rather than in front of someone.

## Adding a generator

Add a module in `src/generators/` exporting a `GeneratorDef` and register it in `src/generators/index.ts`:

```ts
{
  id: 'my-generator',
  name: 'Shown in Learn and Progress',
  blurb: 'One line.',
  section: '§4.3',
  topicId: 'roots2',        // a family id from src/data/cases.ts
  mode: 'entry',            // 'choice' for multiple choice
  variants: ['distinct'],   // optional: narrowings a path step can pin
  generate: (rng, variant) => ({ ... }),
}
```

Supply `derivation: () => deriveHomogeneous(roots)` and the "Show me how" button appears everywhere the problem does. Wrong options built as `{ tex, why }` rather than bare strings get their explanation shown when picked.

Typed-answer problems must supply `answer.exemplar` (one answer that passes) and, where there is one, the homogeneous `operator`. The corpus test picks both up automatically. Practice modes, scoping, mastery tracking, and the coach line pick up new generators from the registry.

Built with Vite, React, TypeScript, KaTeX, and mathjs.

## License

MIT © Alexander Nichols
