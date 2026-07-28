import type { ReactNode } from 'react'
import type { DerivationStep } from '../lib/derive'
import { DerivationToggle } from './Derivation'
import { Rich, Tex } from './Tex'

/** A multiple-choice question, normalized so Classify and Path render it identically. */
export interface Ask {
  /** Progress key. */
  id: string
  badge?: string
  section?: string
  meta?: string
  question: string
  statementTex?: string
  givenTex?: string
  givenLabel?: string
  options: string[]
  correctIndex: number
  /** Per-option: the mistake it encodes. */
  explanations: (string | null)[]
  hint?: string
  solution?: string
  note?: string
  derivation?: () => DerivationStep[]
}

interface QuestionViewProps {
  ask: Ask
  /** Index the student chose, or null before they have answered. */
  picked: number | null
  onPick: (index: number) => void
  hintShown?: boolean
  /** The caller's action row, rendered under the feedback. */
  actions?: ReactNode
}

export function QuestionView({ ask, picked, onPick, hintShown, actions }: QuestionViewProps) {
  const answered = picked !== null
  const correct = answered && picked === ask.correctIndex
  const wide = ask.options.every((o) => o.length < 46)
  const diagnosis = answered && !correct ? ask.explanations[picked] : null

  return (
    <div className="card problem-card">
      {ask.badge || ask.section || ask.meta ? (
        <div className="problem-meta">
          {ask.badge ? <span className="badge">{ask.badge}</span> : null}
          {ask.section ? <span className="badge badge-section">{ask.section}</span> : null}
          {ask.meta ? <span className="meta-note">{ask.meta}</span> : null}
        </div>
      ) : null}

      <p className="question-line">
        <Rich text={ask.question} />
      </p>

      {ask.statementTex ? (
        <div className="problem-tex">
          <Tex tex={ask.statementTex} block />
        </div>
      ) : null}

      {ask.givenTex ? (
        <div className="given-row">
          <span className="given-label">{ask.givenLabel ?? 'Given'}</span>
          <Tex tex={ask.givenTex} />
        </div>
      ) : null}

      <div className="divider" />

      <div className={wide ? 'options options-wide' : 'options'}>
        {ask.options.map((opt, i) => {
          const isCorrect = i === ask.correctIndex
          const cls = [
            'option',
            answered && isCorrect ? 'option-correct' : '',
            picked === i && !isCorrect ? 'option-wrong' : '',
            answered && !isCorrect && picked !== i ? 'option-dim' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => onPick(i)}>
              <span className="option-key">{i + 1}</span>
              <span className="option-body">
                <Rich text={opt} />
              </span>
            </button>
          )
        })}
      </div>

      {answered ? (
        <div className={correct ? 'feedback feedback-good' : 'feedback feedback-bad'} role="status">
          {correct ? 'Correct' : 'Not that one'}
        </div>
      ) : null}

      {diagnosis ? (
        <div className="diagnosis">
          <span className="diagnosis-label">What that answer assumed</span>
          <Rich text={diagnosis} />
        </div>
      ) : null}

      {actions}

      {hintShown && ask.hint ? (
        <div className="hint">
          <Rich text={ask.hint} />
        </div>
      ) : null}

      {answered && (ask.solution || ask.note) ? (
        <div className="solution">
          {ask.solution ? (
            <>
              <span className="solution-label">Working</span>
              <Rich text={ask.solution} />
            </>
          ) : null}
          {ask.note ? (
            <div className="note-line">
              <Rich text={ask.note} />
            </div>
          ) : null}
        </div>
      ) : null}

      {answered && ask.derivation ? (
        <div style={{ marginTop: 12 }}>
          <DerivationToggle steps={ask.derivation()} />
        </div>
      ) : null}
    </div>
  )
}
