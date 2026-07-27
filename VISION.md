# ODE Trainer — Vision & Working Notes

A running document. **Append, don't rewrite.** Each idea gets a numbered entry with the date it was raised, what it asks for, what it implies for the design, and what shipped. Superseded entries stay put with a note pointing at what replaced them — the history of the thinking is part of the value.

Hard constraints that every entry inherits (see also `README.md`):

- Static site. No server, no accounts, no build step beyond Vite. `dist/` must deploy to any static host.
- Answer checking is exact or numerically verifiable. No stored answer strings to compare against, and no LLM in the loop.
- Every generated problem must be verifiable against its own stated answer by the corpus test.
- Progress lives in `localStorage` and must survive every update. Export format stays `version: 1`.
- Copy is high-signal. No filler, no self-announcing framing, no hedging vocabulary.

---

## V-001 — v1 scope and the decisions behind it (raised 2026-07-27, shipped)

### The ask, as stated

A trainer that "smartly and modularly and progress-trackingly allows users to train to recognize, determine, and reinforce understanding of the cases of constant-coefficient ODEs, as encountered in a first course on ODEs (Zill 9e chapter 4 level content)", built to the same standard as `trig-trainer`, `integral-trainer`, `kanji-trainer`, and `guiri`.

Three verbs, and they are not the same skill:

1. **Recognize** — see an equation, know which case it is, without working it out.
2. **Determine** — produce the answer, not select it.
3. **Reinforce** — keep it after the exam.

The audit of the four reference projects mapped cleanly onto them. `trig-trainer` has the recognition machinery (adaptive multiple choice, criterion tiers, SRS, coach line, scope tracks, placement, tour). `integral-trainer` has the determination machinery (free entry with a real checker, procedural generators, a corpus self-test). `kanji-trainer` and `guiri` have the reinforcement machinery (SM-2 scheduling, per-item facets, goal tracking) and the documentation discipline this file follows.

### D1 — The answer checker treats a general solution as a span, not a string

This is the central design decision and everything else follows from it.

`integral-trainer` checks a typed antiderivative by differentiating it numerically and comparing against the integrand. That works because an antiderivative is a single function. A general solution is not: it is an *n*-dimensional space, and there are infinitely many correct ways to write a basis for it. `c₁cosh x + c₂sinh x` is exactly as correct as `c₁eˣ + c₂e⁻ˣ`, and a trainer that rejects it is teaching a preferred notation rather than the mathematics.

So the checker (`src/lib/answer.ts`) does this: parse the typed expression, find the free symbols acting as arbitrary constants, isolate the function multiplying each one by evaluating with that constant at 1 and the rest at 0, sample each on a window, and ask two questions.

1. Does every isolated function lie in the span of a correct fundamental set? (least-squares residual against an orthonormalized basis)
2. Are there exactly *n* of them, and are they independent? (rank of the sampled columns)

Together those give span *equality*, which is exactly the right criterion. The consequences are all good ones:

- Any valid fundamental set passes, including recombinations nobody anticipated.
- A repeated root written as `c1*e^(2x) + c2*e^(2x)` fails as **linearly dependent** — the real reason — instead of as a string mismatch.
- Missing a solution, carrying an extra one, or attaching a term to no constant each get their own diagnosis.
- The same code grades an undetermined-coefficients trial form with `A, B, C, …` in place of `c₁, c₂, …`, with no special-casing.
- It extends to Cauchy–Euler for free by passing raw functions (`x^m`, `x^m ln x`) instead of quasipolynomial terms, sampled on `x > 0`.

Linearity in each constant is checked explicitly (doubling a constant must double its contribution), which catches `c1*c2*e^(3x)` and similar.

### D2 — Exact arithmetic where exactness is available

Sampling is right for grading free-form student input. It is wrong for verifying the app's own corpus, where a silent numerical near-miss would ship a wrong answer.

`src/lib/quasipoly.ts` implements the algebra of finite sums of `c·x^k e^{ax} cos(bx)` and `c·x^k e^{ax} sin(bx)`. That family is closed under differentiation, so applying a constant-coefficient operator to one is exact arithmetic. Everything the app quizzes on lives in that family: solution bases, forcing functions, trial forms, and the residual after an annihilator.

`src/lib/frac.ts` adds exact rational arithmetic for one job — multiplying out a characteristic polynomial from its roots and clearing denominators — so the printed equation and its stated roots can never disagree, including for half-integer roots that give a leading coefficient of 2 or 4.

The corpus test uses both: it applies each problem's stated operator to each stated basis function and requires exactly zero.

### D3 — The root set is the single source of truth

A generated problem is built from a `RootSet` (real roots and conjugate pairs, each with a multiplicity). The characteristic polynomial, the printed ODE, the factored form, the general solution in LaTeX, the plain-text exemplar, the case label, and the complex-plane plot are all *computed* from it rather than stored alongside it. There is no way for the equation on screen to disagree with the answer being graded, because they are the same object rendered twice.

### D4 — Distractors are named mistakes

Ported from `trig-trainer`, where every wrong option is a classic sign error. Here (`src/generators/distractors.ts`, and `wrongTrials` in `nonhomogeneous.ts`) each mangle is a specific misreading: a conjugate pair read as two real roots, alpha and beta swapped, a repeated root turned into a ± pair by quadratic-formula reflex, a repeated root that lost its factor of `x`, the multiplication rule ignored / over-applied / applied to one term instead of the whole group, a trig trial form missing its sine partner.

Generic near misses (a root nudged by ±1) exist only as fallback, so a question never runs short of options when the named mangles do not apply. The corpus test enforces four distinct options.

### D5 — Generated problems and stated results share one progress store

`trig-trainer` tracks per-identity; `integral-trainer` tracks per-technique. Here both exist: 73 stated results from the case library and 17 problem generators. They write to the same `byId` map because they measure the same thing — whether you can do it right now — and because a miss on a generated problem should pull the matching flashcard's review forward. Topic mastery averages over both.

Challenge modes get stable ids in `src/data/challenges.ts` for the same reason. An id that is not one of those three kinds is dropped on import, so removing a generator does not corrupt a backup.

### D6 — The complex plane is the picture of the taxonomy

`trig-trainer` earns a lot from the unit-circle and curve-plot modes: a visual that *is* the concept rather than decoration. The analogue here is the root plane. On the real axis is Case I or II; off it, Case III. Left half decays, right half grows, the axis oscillates forever. A ring marks a repeated root — the one feature that changes the *shape* of the basis rather than the numbers in it. Challenge shows roots plotted with no equation at all and asks for the general solution.

### D7 — Zill fidelity in the notation

`m` for the auxiliary variable (not `λ` or `r`), "auxiliary equation" (not "characteristic equation" as the primary term, though `charPoly` uses it internally), Case I / II / III labels on second-order questions, section numbers on every family and generator. The brand mark is a serif italic `m`.

### What shipped for V-001

- Exact math core: `frac`, `quasipoly`, `roots`, `undetermined`, `annihilator`, `operator`, `cauchy`.
- Span-based answer checker with per-failure diagnoses, plus an operator parser and annihilator grader.
- 73 stated results in 9 families (§4.1–§4.7 plus §5.1), each with its trap.
- 17 generators: case naming, general solutions to order 4 (choice and typed), factored-form reading, reverse (solution → equation), root-set → basis, long-run behaviour, trial forms (choice and typed), the `x^s` multiplier in isolation, annihilators (choice and typed), the annihilator route to a trial form, Cauchy–Euler case and solution, damping regime.
- Modes: Learn, Classify, Solve, Challenge (root plane + match board), Cards, Progress, Settings, About, first-run placement, guided tour.
- 84 tests: corpus self-test over 200 seeds per generator, checker unit tests, UI smoke test.

### Deliberately NOT done, and why

- **No initial-value problems.** Solving for `c₁, c₂` from `y(0), y'(0)` is arithmetic, not case recognition, and it needs a different answer checker (a specific function, not a span). Worth adding; see the backlog.
- **No variation-of-parameters computation.** §4.6 appears as stated results only. Actually computing `u₁, u₂` requires integration, which is `integral-trainer`'s job. Drilling *which method applies* is the part that belongs here.
- **No step-by-step working.** The app grades answers and explains the case; it does not walk through algebra. That is a different product.
- **No accounts or sync.** See `kanji-trainer`'s V-003 and V-004 for the full analysis of that option space. The same conclusions apply: local-first is right, and browser storage must never be described as durable, which is why the footer and About both say where progress lives and point at export.

---

## Backlog — raised but not scheduled

Not commitments.

- **Initial-value problems.** Given an ODE and conditions at a point, solve for the constants. Needs a second checker: sample the student's specific function against the exact one. The exact solution is computable in the quasipolynomial algebra once the linear system for the constants is solved, so the machinery is nearly all present.
- **Boundary-value problems** (§4.1.1) where existence or uniqueness *fails*. The instructive case, and currently absent.
- **Code-split mathjs.** The bundle is 933 kB (279 kB gzipped), and mathjs is most of it. Only `Solve` needs it. A dynamic import behind that tab would cut the initial load roughly in half.
- **Timed mode.** Recognition speed is the actual target and nothing currently measures it. A per-question clock feeding a separate "fluency" statistic, distinct from accuracy.
- **Higher-order Cauchy–Euler.** Currently order two only. Order three brings `(ln x)²` and is a genuinely different exercise.
- **Systems by elimination** (§4.9) and **nonlinear reductions** (§4.10) — outside "constant-coefficient cases" as scoped, but adjacent, and §4.9 is pure operator algebra.
- **Superposition drill.** Given `g = g₁ + g₂` with different resonance on each piece, ask for the combined trial form. The generator already produces sums; there is no question type built specifically around splitting them.
- **Wronskian computation** as a typed answer, rather than the stated results it currently gets.
- **Per-item "why this is wrong" on distractors.** The mangles are named in the code; the UI does not surface *which* mistake a chosen distractor represents. It could, and that is the highest-value teaching upgrade available cheaply.
- **Goal tracking** in the style of `kanji-trainer`'s V-001 D5: name a target ("chapter 4 by the midterm"), get pace and per-topic coverage against it.
- **Print/export a problem set.** Generate 20 problems with an answer key as a static page.

## Open questions

1. Should Solve accept complex-exponential form (`c1*e^((−1+2i)x) + c2*e^((−1−2i)x)`) for the complex case? It is a correct fundamental set over ℂ, and the checker's real-valued sampling rejects it. Currently that is deliberate — the section is about producing the *real* form — but it is worth stating in the UI rather than leaving as a silent rejection.
2. The multiplication rule questions always show `y_c` unless the setting is turned off. Should the harder default be "compute `y_c` yourself" once a topic reaches Proficient, rather than a global toggle?
3. Damping (§5.1) is in scope because it is the same three cases. Should forced motion and resonance (§5.1.3) follow, or does that pull the app into chapter 5 proper?

## Change log

- **2026-07-27** — V-001 raised and implemented. Initial commit.
