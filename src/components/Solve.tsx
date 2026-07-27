import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FAMILY_BY_ID } from '../data/cases'
import { nextProblem, scopedGenerators, type Problem } from '../generators'
import { checkSpan, previewOf, type AnswerVerdict } from '../lib/answer'
import { gradeAnnihilator, type AnnihilatorVerdict } from '../lib/annihilator'
import { TIER_LABEL, tierFor } from '../lib/mastery'
import { parseOperator } from '../lib/operator'
import { operatorTex } from '../lib/operator'
import { masteryMap, statsFor, type ProgressState } from '../store/progress'
import type { Settings } from '../store/settings'
import { Rich, Tex } from './Tex'
import { ScopePicker } from './ScopePicker'

interface SolveProps {
  progress: ProgressState
  settings: Settings
  scope: string[] | null
  onScope: (next: string[] | null) => void
  onAnswer: (id: string, correct: boolean) => void
}

type Verdict =
  | { ok: true; note?: string }
  | { ok: false; message: string }

export function Solve({ progress, settings, scope, onScope, onAnswer }: SolveProps) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [scored, setScored] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const progressRef = useRef(progress)
  progressRef.current = progress

  const build = useCallback(
    (excludeId?: string): Problem =>
      nextProblem('entry', scope, masteryMap(progressRef.current), excludeId),
    [scope],
  )

  useEffect(() => {
    setProblem(build())
    setText('')
    setVerdict(null)
    setHintShown(false)
    setRevealed(false)
    setScored(false)
  }, [build])

  const advance = useCallback(() => {
    setProblem((p) => build(p?.generatorId))
    setText('')
    setVerdict(null)
    setHintShown(false)
    setRevealed(false)
    setScored(false)
    inputRef.current?.focus()
  }, [build])

  const preview = useMemo(() => previewOf(text), [text])

  const solved = verdict?.ok === true

  const check = () => {
    if (!problem) return
    if (solved) {
      advance()
      return
    }
    const spec = problem.answer
    let v: Verdict
    let scorable = true
    if (spec.kind === 'span') {
      const result: AnswerVerdict = checkSpan(text, spec.target, {
        expected: spec.count,
        constantWord: spec.constantWord,
        domain: spec.domain,
      })
      // Syntax and evaluation slips are not wrong answers; they do not count.
      scorable = result.ok || !['empty', 'parse', 'symbol', 'domain'].includes(result.code)
      v = result.ok ? { ok: true } : { ok: false, message: result.message }
    } else if (spec.kind === 'operator') {
      const parsed = parseOperator(text)
      if (!parsed.ok) {
        scorable = false
        v = { ok: false, message: parsed.error }
      } else {
        const result: AnnihilatorVerdict = gradeAnnihilator(parsed.poly, spec.g, spec.minimalOrder)
        v = result.ok
          ? { ok: true, note: result.minimal ? undefined : result.message }
          : { ok: false, message: result.message }
      }
    } else {
      return
    }
    setVerdict(v)
    if (!scored && !revealed && scorable) {
      onAnswer(problem.generatorId, v.ok)
      setScored(true)
    }
  }

  const reveal = () => {
    if (!problem) return
    if (!scored && !solved) {
      onAnswer(problem.generatorId, false)
      setScored(true)
    }
    setRevealed(true)
  }

  if (!problem) return null

  const spec = problem.answer
  if (spec.kind === 'choice') return null

  const stats = statsFor(progress, problem.generatorId)
  const family = FAMILY_BY_ID.get(problem.topicId)
  const isOperator = spec.kind === 'operator'
  const label = isOperator
    ? 'Operator'
    : spec.constantWord === 'undetermined coefficient'
      ? 'Trial form'
      : 'General solution'
  const parsedOperator = isOperator ? parseOperator(text) : null
  const poolSize = scopedGenerators('entry', scope).length

  return (
    <section>
      <ScopePicker scope={scope} onScope={onScope} />
      {poolSize === 0 ? (
        <p className="meta-note" style={{ marginBottom: 14 }}>
          No typed-answer problems in this scope — showing everything instead.
        </p>
      ) : null}

      <div className="card problem-card">
        <div className="problem-meta">
          <span className="badge">{family?.name ?? problem.topicId}</span>
          {family ? <span className="badge badge-section">{family.section}</span> : null}
          <span className="meta-note">{TIER_LABEL[tierFor(stats)]}</span>
        </div>

        <p className="question-line">
          <Rich text={problem.question} />
        </p>

        <div className="problem-tex">
          <Tex tex={problem.statementTex} block />
        </div>

        {problem.givenTex && settings.showComplementary ? (
          <div className="given-row">
            <span className="given-label">{problem.givenLabel ?? 'Given'}</span>
            <Tex tex={problem.givenTex} />
          </div>
        ) : null}

        <div className="divider" />

        <label className="answer-label" htmlFor="answer-input">
          {label}
        </label>
        <div className="answer-row">
          <input
            id="answer-input"
            ref={inputRef}
            className="answer-input"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={spec.placeholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (verdict && !verdict.ok) setVerdict(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') check()
            }}
          />
          <button className="btn btn-primary" onClick={check}>
            {solved ? 'Next →' : 'Check'}
          </button>
        </div>

        <div className="preview">
          {isOperator ? (
            text.trim() ? (
              parsedOperator?.ok ? (
                <>
                  <span className="muted preview-label">reads as</span>{' '}
                  <Tex tex={operatorTex(parsedOperator.poly)} />
                </>
              ) : (
                <span className="muted preview-label">…keep typing</span>
              )
            ) : null
          ) : preview === null ? null : 'tex' in preview ? (
            <>
              <span className="muted preview-label">reads as</span> <Tex tex={preview.tex} />
            </>
          ) : (
            <span className="muted preview-label">…keep typing</span>
          )}
        </div>

        {verdict !== null ? (
          <div
            className={verdict.ok ? 'feedback feedback-good' : 'feedback feedback-bad'}
            role="status"
          >
            <span className="feedback-tier">{TIER_LABEL[tierFor(statsFor(progress, problem.generatorId))]}</span>
            {verdict.ok ? (verdict.note ? `Accepted. ${verdict.note}` : 'Correct') : verdict.message}
          </div>
        ) : null}

        <div className="actions">
          <button className="btn" onClick={() => setHintShown(true)} disabled={hintShown}>
            Hint
          </button>
          <button className="btn" onClick={reveal} disabled={revealed}>
            Show answer
          </button>
          <button className="btn" onClick={advance}>
            {solved ? 'Next problem' : 'Skip'}
          </button>
        </div>

        {hintShown ? (
          <div className="hint">
            <Rich text={problem.hint} />
          </div>
        ) : null}

        {revealed ? (
          <div className="solution">
            <span className="solution-label">Answer</span>
            <Rich text={problem.solution} />
            {problem.note ? (
              <div className="note-line">
                <Rich text={problem.note} />
              </div>
            ) : null}
            <div className="note-line">
              One accepted form: <code>{spec.exemplar}</code>
            </div>
          </div>
        ) : null}

        <div className="syntax">
          {isOperator ? (
            <>
              Type operators as <code>D</code>, <code>(D-2)^2</code>, <code>D^3(D^2+9)</code>.
            </>
          ) : (
            <>
              <code>e^(2x)</code>
              <code>x^2</code>
              <code>cos(3x)</code>
              <code>ln(x)</code>
              <code>2x</code> and <code>2*x</code> both work.
              {spec.constantWord === 'undetermined coefficient'
                ? ' Use A, B, C, … for the undetermined coefficients.'
                : ' Use c1, c2, … for the arbitrary constants; any equivalent fundamental set is accepted.'}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
