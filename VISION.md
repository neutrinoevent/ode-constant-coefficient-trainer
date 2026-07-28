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

---

## V-002 — The app assessed and did not teach (raised 2026-07-27, shipped)

### The ask, as stated

> "As somebody who hasn't even yet internalized the 3 basic cases, per the values of $m_1$, $m_2$ in the characteristic equation, it isn't even easy to diversely come to an internalization of that, in current form. However, I don't want to choke the ceiling of this clearly-powerful framework."

Both halves of that are the entry.

### The diagnosis

v1 has eight modes and seventeen generators, and every one of them **measures**. None teaches. Three specific failures, in order of how much they hurt:

**F1 — It mixes before it blocks.** Classify drew from all three root cases and all nine families from question one. Interleaving does beat blocked practice, but only *after* each category has been learned separately; before that it is not interleaving, it is noise. You cannot learn to discriminate between categories that do not yet exist. This is the direct cause of the complaint.

**F2 — The derivation was computable and thrown away.** Every intermediate is recoverable from the root set the problem was generated from — substitute $y=e^{mx}$, factor out, factor, read the roots, attach a basis function to each. v1 rendered the first and the last and discarded the middle, on every question.

**F3 — Distractors were named mistakes in code and anonymous in the UI.** `complexAsReal`, `lostTheX`, `swapAlphaBeta`, "the rule applied to one term instead of the group" — the code knew exactly which error each wrong option encoded, and the app said "Not that one."

### D8 — One case at a time, then mix

The path (`src/data/path.ts`) is fifteen steps. Steps 3, 4 and 5 are Case I, Case II and Case III **alone**: the generator is pinned to that case and produces nothing else. Step 6 is the first time they appear together, which is where v1 started.

The pinning mechanism is deliberately small. `GeneratorDef.generate` takes an optional `variant`, and `rootgen.secondOrder(rng, kind)` already accepted a case argument, so this is plumbing rather than new mathematics. A generator that does not understand a variant ignores it; `path.test.ts` fails if a step asks for one that is not offered, and separately checks that pinning `general-2-choice` to `repeated` really does produce a factor of $x$ on all forty seeds tested.

Two more narrowings came out of the same idea: `plain` and `resonant` on the trial-form generators, so §4.4's shape-guessing (step 11) is taught before §4.4's multiplication rule (step 12) instead of both arriving at once.

### D9 — Worked examples are computed, never written

`src/lib/derive.ts` turns a root set into ordered `DerivationStep`s, and there are three more entry points for trial forms, annihilators and Cauchy–Euler. A `Problem` carries `derivation?: () => DerivationStep[]` — a thunk, so nothing is built until someone asks.

The consequence worth stating: the worked example is always about the numbers actually on screen, and it **cannot** drift from the answer being graded, because both are computed from the same object. Teach screens in the path use the same renderer on a fixed example. The corpus test checks every derivation over 200 seeds: at least four steps, every step labelled and non-empty, first and last carrying display math.

Writing sixty worked examples by hand would have been the obvious approach and would have rotted the first time a generator changed.

### D10 — A wrong answer costs a mark and buys an explanation

`wrongSolutions` and `wrongTrials` now return `{ tex, why }`, and `why` names the mistake in terms of the numbers in front of you rather than in general:

> This treats $m = -1 \pm 2i$ as two separate real roots $-1$ and $2$. A conjugate pair gives one exponential $e^{-x}$ carrying a cosine and a sine, not two exponentials.

The plumbing is one optional `explanations: (string | null)[]` on the choice answer spec, kept in step with `options` through shuffling and through Classify's option-count trimming. The corpus test asserts the arrays stay the same length and that the *correct* option never carries a rebuttal — which is the failure mode a naive implementation would have.

Near-miss distractors (a root nudged by one) get a generic sentence and are only used to fill when the named mangles do not apply.

### D11 — The path is a view, not a second content system

A step is `{ teach?, practice: PracticeItem[], run: {length, pass}, scope }` where a `PracticeItem` names a generator id (with an optional variant) or a library family id. It owns no questions of its own. Adding a generator makes it reachable from free practice immediately and from a path step by adding one line; removing one fails `path.test.ts` rather than breaking a screen.

One compromise: a path run is multiple choice throughout, so it never switches answer interfaces mid-run. Steps that name a typed generator are silently served its multiple-choice sibling (`choiceFallback`). Typing lives in Solve. This is worth revisiting — see the open questions.

### D12 — Soft gating, chosen deliberately over firm gating

All nine tabs are visible and usable from first launch. The path is the **default view** and the coach line points at the next step, but nothing is locked. The alternative considered was starting with two tabs and unlocking the rest at Familiar.

Soft won because the failure modes are asymmetric. Firm gating annoys the expert immediately and visibly; soft gating merely fails to help the novice who ignores an obvious call to action. And the placement question already distinguishes the two: choosing "revising for an exam" sets `level: 'advanced'`, which skips the path as the landing view entirely and, if chosen at placement time, moves off it.

### What shipped for V-002

- `src/lib/derive.ts` and the `Derivation` / `DerivationToggle` components. "Show me how" on every homogeneous, trial-form, annihilator and Cauchy–Euler problem, in Path, Classify, Solve and Challenge.
- Labelled distractors across every generator that has them, surfaced as a "What that answer assumed" panel.
- `variants` on `GeneratorDef`; case pinning on five generators, resonance pinning on three.
- New generator `roots-only`: read the roots, no solution asked for, which isolates the algebra from the taxonomy for path step 2.
- `src/data/path.ts` — fifteen steps from "why an exponential" to Cauchy–Euler — and the `Path` component: overview, teach screen, run with a progress bar and a pass mark, result screen.
- `pathDone` in `ProgressState`, carried by export/import and filtered against the current step list on the way in.
- `QuestionView`, extracted so Path and Classify render questions through one component rather than drifting apart.
- Tests: 121 → 127. New `path.test.ts` (pointer integrity, reachable pass marks, real narrowing) plus corpus checks on explanations and derivations, and UI tests for a full teach-drill-clear cycle, a surfaced diagnosis, and an opened derivation.

### Deliberately NOT done

- **No firm gating.** See D12.
- **No new content system.** Every path step points at material that already existed.
- **The three-cases explorer** (drag $b$, watch the discriminant flip, the roots move, the curve redraw) was scoped and deferred. It is the highest-variance item on the list: most likely to produce the moment where it clicks, most likely to end up decorative. Better judged once the path is in use and it is clear what the path leaves unexplained.

---

## Backlog — raised but not scheduled

Not commitments.

- **Initial-value problems.** Given an ODE and conditions at a point, solve for the constants. Needs a second checker: sample the student's specific function against the exact one. The exact solution is computable in the quasipolynomial algebra once the linear system for the constants is solved, so the machinery is nearly all present.
- **Boundary-value problems** (§4.1.1) where existence or uniqueness *fails*. The instructive case, and currently absent.
- **Code-split mathjs.** The bundle is 933 kB (279 kB gzipped), and mathjs is most of it. Only `Solve` needs it. A dynamic import behind that tab would cut the initial load roughly in half.
- **Timed mode.** Recognition speed is the actual target and nothing currently measures it. A per-question clock feeding a separate "fluency" statistic, distinct from accuracy.
- **The three-cases explorer.** Deferred from V-002: one figure with $b$ on a slider, showing the discriminant's sign, the roots moving on the complex plane, the solution form, and the solution curve, all at once. `RootPlane` is already half of it.
- **Typed answers inside a path run.** Currently a run is multiple choice throughout and typed steps are served their choice sibling. Faded worked examples — study, then completion with the last step blank, then solve — would fit here and are the natural next pedagogical move once B exists.
- **Per-step review.** A cleared step can be re-run but its questions are drawn fresh; there is no way to revisit the specific questions that were missed.
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
4. A path run is multiple choice throughout, so steps naming a typed generator are served its choice sibling instead (D11). Recognition before production is defensible as a sequence, but the typed check is the better instrument and it is currently absent from the guided route. Mix them within a run, or add a typed second half to each step?
5. The pass mark is a fixed count per step (5 of 6, 7 of 8). Should it instead be a criterion on the mastery tier, so a step clears when its items reach Familiar rather than when one good run happens?

## Change log

- **2026-07-27** — V-001 raised and implemented. Initial commit, tagged `v1.0-baseline`, pushed to `neutrinoevent/ode-constant-coefficient-trainer`. Sealed archive at `../ode-constant-coefficient-trainer-ARCHIVE-v1.0-20260727/` (folder copy, git bundle, tarball, checksums, `RESTORE.md`), read-only.
- **2026-07-27** — V-002 raised and implemented the same day, on the reading that v1 assessed without teaching. Tagged `v2.0-path`.
- **2026-07-28** — Fixed a flaky UI assertion (`> 4` where the corpus contract is `>= 4` derivation steps; a single-group annihilator derives in exactly four). Wrote `docs/HANDOFF-2026-07-28.md`: state, repository map, the invariants and which test guards each, recipes, rough edges, and the open questions with a recommendation attached to each.
