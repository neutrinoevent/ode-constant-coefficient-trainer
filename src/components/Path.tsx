import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nextStep, PATH, type PathStep, type PracticeItem } from '../data/path'
import { GENERATOR_BY_ID } from '../generators'
import { buildQuestion, pickCase } from '../lib/pick'
import { randomRng } from '../lib/rng'
import { statsFor, type ProgressState } from '../store/progress'
import type { Settings } from '../store/settings'
import { Derivation } from './Derivation'
import { QuestionView, type Ask } from './QuestionView'
import { Rich } from './Tex'

interface PathProps {
  progress: ProgressState
  settings: Settings
  onAnswer: (id: string, correct: boolean) => void
  onStepDone: (stepId: string) => void
  /** Hand the free-practice modes this step's families and switch to them. */
  onPractice: (scope: string[]) => void
}

export function Path({ progress, settings, onAnswer, onStepDone, onPractice }: PathProps) {
  const done = progress.pathDone
  const current = nextStep(done)
  const [openId, setOpenId] = useState<string | null>(null)

  const step = openId ? (PATH.find((s) => s.id === openId) ?? null) : null

  if (step) {
    return (
      <StepView
        step={step}
        progress={progress}
        settings={settings}
        onAnswer={onAnswer}
        onDone={() => {
          onStepDone(step.id)
          const after = PATH[PATH.indexOf(step) + 1]
          setOpenId(after ? after.id : null)
        }}
        onClose={() => setOpenId(null)}
        onPractice={() => onPractice(step.scope)}
      />
    )
  }

  const cleared = done.length
  return (
    <section>
      <div className="card path-header">
        <div className="learn-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            {cleared === 0
              ? 'Start here'
              : current
                ? `Step ${PATH.indexOf(current) + 1} of ${PATH.length}`
                : 'Path complete'}
          </h2>
          <span className="meta-note">
            {cleared} of {PATH.length} cleared
          </span>
        </div>
        <p className="learn-blurb">
          {current
            ? 'Each step teaches one idea and drills that idea alone before the next arrives. Everything else in the app stays open — this is the route, not a gate.'
            : 'Every step is cleared. Classify and Solve mix all of it; Cards keep it. Any step can be reopened and run again.'}
        </p>
        {current ? (
          <button className="btn btn-primary" onClick={() => setOpenId(current.id)}>
            {cleared === 0 ? 'Begin' : 'Continue'} — {current.title}
          </button>
        ) : null}
      </div>

      <ol className="path-list">
        {PATH.map((s, i) => {
          const isDone = done.includes(s.id)
          const isCurrent = current?.id === s.id
          return (
            <li key={s.id}>
              <button
                className={[
                  'path-item',
                  isDone ? 'path-item-done' : '',
                  isCurrent ? 'path-item-current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setOpenId(s.id)}
              >
                <span className="path-num">{isDone ? '✓' : i + 1}</span>
                <span className="path-body">
                  <span className="path-title">
                    {s.title} <span className="learn-item-section">{s.section}</span>
                  </span>
                  <span className="path-goal">
                    <Rich text={s.goal} />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------
// One step: teach, then a run of questions
// ---------------------------------------------------------------------------

type Phase = 'teach' | 'run' | 'result'

function askFromItem(
  item: PracticeItem,
  progress: ProgressState,
  settings: Settings,
): Ask | null {
  if (item.kind === 'cases') {
    const pool = [item.familyId]
    const c = pickCase(progress, pool, null)
    const q = buildQuestion(c, settings.optionCount === 'auto' ? 4 : settings.optionCount)
    return {
      id: c.id,
      badge: c.familyName,
      section: c.section,
      question: c.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanations: q.options.map(() => null),
      note: c.note,
    }
  }
  const gen = GENERATOR_BY_ID.get(item.generatorId)
  if (!gen) return null
  const p = gen.generate(randomRng(), item.variant)
  if (p.answer.kind !== 'choice') return null
  return {
    id: p.generatorId,
    badge: gen.name,
    section: gen.section,
    question: p.question,
    statementTex: p.statementTex,
    givenTex: settings.showComplementary ? p.givenTex : undefined,
    givenLabel: p.givenLabel,
    options: p.answer.options,
    correctIndex: p.answer.correctIndex,
    explanations: p.answer.explanations ?? p.answer.options.map(() => null),
    hint: p.hint,
    solution: p.solution,
    note: p.note,
    derivation: p.derivation,
  }
}

/**
 * A typed-answer generator inside a path run is asked as multiple choice
 * instead, so a run never mixes two answer interfaces. The free-practice Solve
 * tab is where typing happens.
 */
function choiceFallback(item: PracticeItem): PracticeItem {
  if (item.kind === 'cases') return item
  const gen = GENERATOR_BY_ID.get(item.generatorId)
  if (!gen || gen.mode === 'choice') return item
  const swap: Record<string, string> = {
    'general-2': 'general-2-choice',
    'general-n': 'from-factored',
    'roots-to-basis': 'reverse-ode',
    'trial-form': 'trial-choice',
    annihilator: 'annihilator-choice',
    'cauchy-solve': 'cauchy-case',
  }
  const target = swap[item.generatorId]
  return target ? { ...item, generatorId: target } : item
}

function StepView({
  step,
  progress,
  settings,
  onAnswer,
  onDone,
  onClose,
  onPractice,
}: {
  step: PathStep
  progress: ProgressState
  settings: Settings
  onAnswer: (id: string, correct: boolean) => void
  onDone: () => void
  onClose: () => void
  onPractice: () => void
}) {
  const [phase, setPhase] = useState<Phase>(step.teach ? 'teach' : 'run')
  const [asked, setAsked] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [ask, setAsk] = useState<Ask | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [hintShown, setHintShown] = useState(false)

  const progressRef = useRef(progress)
  progressRef.current = progress
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const draw = useCallback((): Ask | null => {
    const rng = randomRng()
    // A few attempts, in case a generator declines a narrowing.
    for (let i = 0; i < 6; i++) {
      const item = choiceFallback(rng.pick(step.practice))
      const next = askFromItem(item, progressRef.current, settingsRef.current)
      if (next) return next
    }
    return null
  }, [step])

  useEffect(() => {
    setPhase(step.teach ? 'teach' : 'run')
    setAsked(0)
    setCorrect(0)
    setPicked(null)
    setHintShown(false)
    setAsk(draw())
  }, [step, draw])

  const advance = useCallback(() => {
    if (asked >= step.run.length) {
      setPhase('result')
      return
    }
    setAsk(draw())
    setPicked(null)
    setHintShown(false)
  }, [asked, step.run.length, draw])

  const pick = (i: number) => {
    if (picked !== null || !ask) return
    setPicked(i)
    const right = i === ask.correctIndex
    onAnswer(ask.id, right)
    setAsked((n) => n + 1)
    if (right) setCorrect((n) => n + 1)
  }

  // The handler closes over live state, so it re-binds each render.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'run' || !ask) return
      if (e.key === 'Enter' && picked !== null) {
        advance()
        return
      }
      const n = Number(e.key)
      if (picked === null && n >= 1 && n <= ask.options.length) pick(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const example = useMemo(() => step.teach?.example?.(), [step])
  const index = PATH.indexOf(step)
  const isDone = progress.pathDone.includes(step.id)
  const passed = correct >= step.run.pass

  const header = (
    <div className="card path-step-head">
      <div className="learn-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          <span className="muted">Step {index + 1}.</span> {step.title}{' '}
          <span className="muted">{step.section}</span>
        </h2>
        <div className="actions" style={{ marginTop: 0 }}>
          {isDone ? <span className="tier-chip tier-mastered">Cleared</span> : null}
          <button className="btn" onClick={onClose}>
            All steps
          </button>
        </div>
      </div>
      <p className="path-goal-line">
        <Rich text={step.goal} />
      </p>
    </div>
  )

  if (phase === 'teach' && step.teach) {
    return (
      <section>
        {header}
        <div className="card">
          {step.teach.body.map((p, i) => (
            <p key={i} className="teach-para">
              <Rich text={p} />
            </p>
          ))}
          {example ? (
            <>
              <div className="case-name" style={{ marginTop: 16 }}>
                {step.teach.exampleLabel ?? 'A worked example'}
              </div>
              <div className="derivation-wrap">
                <Derivation steps={example} />
              </div>
            </>
          ) : null}
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setPhase('run')}>
              Practice this — {step.run.length} questions
            </button>
            <span className="meta-note">
              {step.run.pass} of {step.run.length} clears the step.
            </span>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'result') {
    return (
      <section>
        {header}
        <div className="card empty-state">
          <p className="empty-title">
            {passed ? 'Step cleared' : `${correct} of ${asked}`}
          </p>
          <p className="muted">
            {passed
              ? `${correct} of ${asked}. ${nextStep([...progress.pathDone, step.id]) ? 'The next step builds on this one.' : 'That is the last step.'}`
              : `${step.run.pass} of ${step.run.length} clears it. Re-read the step and run it again — the questions are freshly generated each time.`}
          </p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            {passed ? (
              <button className="btn btn-primary" onClick={onDone}>
                {nextStep([...progress.pathDone, step.id]) ? 'Next step' : 'Finish'}
              </button>
            ) : null}
            <button
              className={passed ? 'btn' : 'btn btn-primary'}
              onClick={() => {
                setAsked(0)
                setCorrect(0)
                setPicked(null)
                setAsk(draw())
                setPhase('run')
              }}
            >
              Run it again
            </button>
            {step.teach ? (
              <button className="btn" onClick={() => setPhase('teach')}>
                Re-read
              </button>
            ) : null}
            <button className="btn" onClick={onPractice}>
              Free practice on this topic
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!ask) {
    return (
      <section>
        {header}
        <div className="card empty-state">
          <p className="empty-title">No questions available</p>
          <p className="muted">This step names a generator that is no longer registered.</p>
        </div>
      </section>
    )
  }

  const seen = statsFor(progress, ask.id)

  return (
    <section>
      {header}
      <div className="run-bar">
        <span className="run-count">
          {Math.min(asked + (picked === null ? 1 : 0), step.run.length)} / {step.run.length}
        </span>
        <span className="run-track">
          {Array.from({ length: step.run.length }, (_, i) => (
            <span
              key={i}
              className={['run-pip', i < asked ? 'run-pip-filled' : ''].filter(Boolean).join(' ')}
            />
          ))}
        </span>
        <span className="meta-note">
          {correct} right{seen.attempts === 0 ? ' · new question type' : ''}
        </span>
      </div>

      <QuestionView
        ask={ask}
        picked={picked}
        onPick={pick}
        hintShown={hintShown}
        actions={
          <div className="actions">
            {ask.hint ? (
              <button
                className="btn"
                onClick={() => setHintShown(true)}
                disabled={hintShown || picked !== null}
              >
                Hint
              </button>
            ) : null}
            <button className="btn btn-primary" onClick={advance} disabled={picked === null}>
              {asked >= step.run.length ? 'Finish' : 'Next →'}
            </button>
            <span className="meta-note">Keys 1–{ask.options.length} answer, Enter advances.</span>
          </div>
        }
      />
    </section>
  )
}
