import { useCallback, useEffect, useState } from 'react'
import { CHALLENGES } from '../data/challenges'
import { wrongSolutions } from '../generators/distractors'
import { higherOrder, secondOrder } from '../generators/rootgen'
import { CASE_LABEL, caseOf, generalSolutionTex, order, rootsTex, type RootSet } from '../lib/roots'
import { randomRng } from '../lib/rng'
import { shuffle } from '../lib/pick'
import { TIER_LABEL, tierFor } from '../lib/mastery'
import { statsFor, type ProgressState } from '../store/progress'
import { Rich, Tex } from './Tex'
import { RootPlane } from './RootPlane'

interface ChallengeProps {
  progress: ProgressState
  onAnswer: (id: string, correct: boolean) => void
}

export function Challenge({ progress, onAnswer }: ChallengeProps) {
  const [mode, setMode] = useState(CHALLENGES[0].id)
  const def = CHALLENGES.find((c) => c.id === mode) ?? CHALLENGES[0]
  const stats = statsFor(progress, def.id)

  return (
    <section>
      <div className="mode-bar" role="tablist" aria-label="Challenge mode">
        {CHALLENGES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={mode === c.id}
            className={mode === c.id ? 'chip chip-active' : 'chip'}
            onClick={() => setMode(c.id)}
          >
            {c.name}
          </button>
        ))}
        <span className="meta-note">{TIER_LABEL[tierFor(stats)]}</span>
      </div>
      <p className="meta-note" style={{ marginBottom: 14 }}>
        <Rich text={def.blurb} />
      </p>
      {mode === 'ch-plane' ? (
        <PlaneRound onAnswer={onAnswer} />
      ) : (
        <MatchRound onAnswer={onAnswer} />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Root plane
// ---------------------------------------------------------------------------

interface PlaneQuestion {
  roots: RootSet
  options: string[]
  correctIndex: number
}

function makePlaneQuestion(): PlaneQuestion {
  const rng = randomRng()
  const roots = rng.bool(0.45) ? secondOrder(rng) : higherOrder(rng)
  const correct = generalSolutionTex(roots)
  const shuffled = rng.shuffle([correct, ...wrongSolutions(roots, rng, 3)])
  return { roots, options: shuffled, correctIndex: shuffled.indexOf(correct) }
}

function PlaneRound({ onAnswer }: { onAnswer: (id: string, correct: boolean) => void }) {
  const [q, setQ] = useState<PlaneQuestion>(() => makePlaneQuestion())
  const [picked, setPicked] = useState<number | null>(null)

  const advance = useCallback(() => {
    setQ(makePlaneQuestion())
    setPicked(null)
  }, [])

  const answer = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    onAnswer('ch-plane', i === q.correctIndex)
  }

  // No dependency list: the handler closes over `picked` and `q`, so it has to
  // be re-bound on every render to stay in step with them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && picked !== null) advance()
      const n = Number(e.key)
      if (picked === null && n >= 1 && n <= q.options.length) answer(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const caseId = caseOf(q.roots)

  return (
    <div className="card problem-card">
      <p className="question-line">
        These are the roots of the auxiliary equation. Which general solution do they give?
      </p>
      <div className="plane-wrap">
        <RootPlane roots={q.roots} />
      </div>

      <div className="divider" />

      <div className="options">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex
          const cls = [
            'option',
            picked !== null && isCorrect ? 'option-correct' : '',
            picked === i && !isCorrect ? 'option-wrong' : '',
            picked !== null && !isCorrect && picked !== i ? 'option-dim' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button key={i} className={cls} disabled={picked !== null} onClick={() => answer(i)}>
              <span className="option-key">{i + 1}</span>
              <span className="option-body">
                <Tex tex={opt} />
              </span>
            </button>
          )
        })}
      </div>

      {picked !== null ? (
        <>
          <div
            className={picked === q.correctIndex ? 'feedback feedback-good' : 'feedback feedback-bad'}
            role="status"
          >
            {picked === q.correctIndex ? 'Correct' : 'Not that one'}
          </div>
          <div className="solution">
            <span className="solution-label">Roots</span>
            <Tex tex={rootsTex(q.roots)} /> — {CASE_LABEL[caseId].toLowerCase()}, order {order(q.roots)}.
          </div>
        </>
      ) : null}

      <div className="actions">
        <button className="btn btn-primary" onClick={advance} disabled={picked === null}>
          Next →
        </button>
        <button className="btn" onClick={advance} disabled={picked !== null}>
          Skip
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Match board
// ---------------------------------------------------------------------------

interface Pair {
  key: number
  rootsTex: string
  solutionTex: string
}

function makePairs(count = 4): Pair[] {
  const rng = randomRng()
  const pairs: Pair[] = []
  const seen = new Set<string>()
  let guard = 0
  while (pairs.length < count && guard++ < 60) {
    const roots = rng.bool(0.6) ? secondOrder(rng) : higherOrder(rng)
    const sol = generalSolutionTex(roots)
    if (seen.has(sol)) continue
    seen.add(sol)
    pairs.push({ key: pairs.length, rootsTex: rootsTex(roots), solutionTex: sol })
  }
  return pairs
}

function MatchRound({ onAnswer }: { onAnswer: (id: string, correct: boolean) => void }) {
  const [pairs, setPairs] = useState<Pair[]>(() => makePairs())
  const [right, setRight] = useState<Pair[]>(() => shuffle(pairs))
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState<number[]>([])
  const [missed, setMissed] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)

  const reset = () => {
    const next = makePairs()
    setPairs(next)
    setRight(shuffle(next))
    setSelected(null)
    setDone([])
    setMissed(null)
    setMisses(0)
  }

  const complete = done.length === pairs.length

  const clickRight = (key: number) => {
    if (selected === null || done.includes(key)) return
    if (key === selected) {
      const nextDone = [...done, key]
      setDone(nextDone)
      setSelected(null)
      setMissed(null)
      if (nextDone.length === pairs.length) onAnswer('ch-match', misses === 0)
    } else {
      setMissed(key)
      setMisses((m) => m + 1)
    }
  }

  return (
    <div className="card problem-card">
      <p className="question-line">
        Pair each root list with the general solution it produces.
      </p>

      <div className="match-grid" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairs.map((p) => (
            <button
              key={p.key}
              className={[
                'match-tile',
                selected === p.key ? 'match-selected' : '',
                done.includes(p.key) ? 'match-done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={done.includes(p.key)}
              onClick={() => setSelected(p.key)}
            >
              <Tex tex={p.rootsTex} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {right.map((p) => (
            <button
              key={p.key}
              className={[
                'match-tile',
                done.includes(p.key) ? 'match-done' : '',
                missed === p.key ? 'match-wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={done.includes(p.key)}
              onClick={() => clickRight(p.key)}
            >
              <Tex tex={p.solutionTex} />
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        {complete ? (
          <span className={misses === 0 ? 'feedback feedback-good' : 'feedback feedback-neutral'} style={{ marginTop: 0, flex: 1 }}>
            {misses === 0 ? 'Board cleared with no misses' : `Board cleared — ${misses} miss${misses === 1 ? '' : 'es'}`}
          </span>
        ) : (
          <span className="meta-note" style={{ flex: 1 }}>
            {selected === null ? 'Pick a root list on the left.' : 'Now pick its solution on the right.'}
          </span>
        )}
        <button className="btn btn-primary" onClick={reset}>
          New board
        </button>
      </div>
    </div>
  )
}
