import { ALL_CASES, FAMILIES } from '../data/cases'
import { GENERATORS } from '../generators'
import { Rich } from './Tex'

const CHECKING = [
  'There is no computer algebra system and no stored answer string. A general solution is a span, so the checker isolates the function multiplying each arbitrary constant, samples it, and asks whether every one lies in the span of a correct fundamental set and whether there are exactly as many independent ones as the equation’s order.',
  'The consequence is that any legitimate fundamental set passes: `c1*cosh(x) + c2*sinh(x)` for roots $\\pm 1$, any ordering of terms, any names for the constants, any invertible recombination. A repeated root written without its factor of $x$ fails as linearly dependent rather than as a string mismatch, and the message says so.',
  'Trial forms are graded the same way, with $A, B, C, \\ldots$ in place of the arbitrary constants. Annihilators are graded by applying the typed operator to $g(x)$ exactly: any operator that kills $g$ is accepted, and one that is not of least order is accepted with a note saying which order the minimal one has.',
]

const MODES: [string, string][] = [
  ['Learn', 'the case library, organized by section, with the trap named for each result.'],
  [
    'Classify',
    'multiple choice over both the stated results and freshly generated equations. Distractors are specific mistakes: a complex pair read as two real roots, a repeated root that lost its factor of $x$, the multiplication rule applied to one term instead of the whole group.',
  ],
  ['Solve', 'type the answer. General solutions, trial forms, annihilators, Cauchy-Euler.'],
  [
    'Challenge',
    'roots plotted in the complex plane with no equation given, and a board pairing root lists with solution bases.',
  ],
  [
    'Cards',
    'spaced repetition over the stated results. A miss in Classify or Solve pulls the matching card’s review forward.',
  ],
  ['Progress', 'per-topic mastery, and JSON backup and restore.'],
]

export function About() {
  const entry = GENERATORS.filter((g) => g.mode === 'entry').length
  const choice = GENERATORS.length - entry

  return (
    <div className="about">
      <section className="card">
        <h2 className="section-title">What this is</h2>
        <p>
          A drill trainer for the case structure of constant-coefficient linear ODEs, at the level
          of Zill, <em>A First Course in Differential Equations</em>, 9e, chapter 4. The material is
          small — three cases, one multiplication rule, a handful of operator identities — and it is
          almost entirely a matter of recognition speed. That is what this drills.
        </p>
        <p>
          {ALL_CASES.length} stated results across {FAMILIES.length} topics, plus {GENERATORS.length}{' '}
          problem generators ({choice} multiple choice, {entry} typed), covering §4.1 through §4.7
          and the damped-motion reading of the same three cases in §5.1.
        </p>
      </section>

      <section className="card">
        <h2 className="section-title">How answers are checked</h2>
        {CHECKING.map((text, i) => (
          <p key={i}>
            <Rich text={text} />
          </p>
        ))}
      </section>

      <section className="card">
        <h2 className="section-title">Modes</h2>
        <ul>
          {MODES.map(([name, text]) => (
            <li key={name}>
              <strong>{name}</strong> — <Rich text={text} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">Where progress lives</h2>
        <p>
          In this browser&rsquo;s localStorage. No server, no account, nothing leaves the machine.
          That also means the browser can clear it: export a backup from the Progress tab if the
          history matters to you.
        </p>
      </section>
    </div>
  )
}
