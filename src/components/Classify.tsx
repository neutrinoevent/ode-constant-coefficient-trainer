import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FAMILY_BY_ID } from '../data/cases'
import { nextProblem, scopedGenerators } from '../generators'
import { resolveOptionCount } from '../lib/adapt'
import { TIER_LABEL, tierFor } from '../lib/mastery'
import { buildQuestion, pickCase, scopedCases, shuffle } from '../lib/pick'
import { masteryMap, statsFor, type ProgressState } from '../store/progress'
import type { Settings } from '../store/settings'
import { Rich, Tex } from './Tex'
import { ScopePicker } from './ScopePicker'

type Source = 'mixed' | 'facts' | 'problems'

const SOURCES: { id: Source; label: string; blurb: string }[] = [
  { id: 'mixed', label: 'Mixed', blurb: 'Stated results and generated equations, interleaved.' },
  { id: 'facts', label: 'Results', blurb: 'The stated case results, straight from the library.' },
  { id: 'problems', label: 'Equations', blurb: 'Freshly generated equations every time.' },
]

interface Drill {
  /** Progress key: a case id or a generator id. */
  id: string
  badge: string
  section: string
  question: string
  statementTex?: string
  givenTex?: string
  givenLabel?: string
  options: string[]
  correctIndex: number
  hint?: string
  solution?: string
  note?: string
}

interface ClassifyProps {
  progress: ProgressState
  settings: Settings
  scope: string[] | null
  onScope: (next: string[] | null) => void
  onAnswer: (id: string, correct: boolean) => void
}

export function Classify({ progress, settings, scope, onScope, onAnswer }: ClassifyProps) {
  const [source, setSource] = useState<Source>('mixed')
  const [picked, setPicked] = useState<number | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [recent, setRecent] = useState<boolean[]>([])
  const [drill, setDrill] = useState<Drill | null>(null)

  // Question construction reads all three of these, but none of them should
  // replace the question on the screen when they change: answering must not
  // swap the problem out from under the student.
  const progressRef = useRef(progress)
  progressRef.current = progress
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const recentRef = useRef(recent)
  recentRef.current = recent

  const build = useCallback(
    (mode: Source, excludeId: string | null): Drill => {
      const state = progressRef.current
      const opts = settingsRef.current
      const recentWindow = recentRef.current
      const generatorPool = scopedGenerators('choice', scope)
      const casePool = scopedCases(scope)
      const useCase =
        mode === 'facts' ||
        (mode === 'mixed' && generatorPool.length === 0) ||
        (mode === 'mixed' && Math.random() < 0.4)
      if (useCase && casePool.length) {
        const item = pickCase(state, scope, excludeId)
        const stats = statsFor(state, item.id)
        const count = resolveOptionCount(opts, tierFor(stats), recentWindow)
        const q = buildQuestion(item, count)
        return {
          id: item.id,
          badge: item.familyName,
          section: item.section,
          question: item.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          note: item.note,
        }
      }
      const p = nextProblem('choice', scope, masteryMap(state), excludeId ?? undefined)
      if (p.answer.kind !== 'choice') throw new Error('expected a choice problem')
      const stats = statsFor(state, p.generatorId)
      const count = resolveOptionCount(opts, tierFor(stats), recentWindow)
      const { options, correctIndex } = trimOptions(p.answer.options, p.answer.correctIndex, count)
      return {
        id: p.generatorId,
        badge: FAMILY_BY_ID.get(p.topicId)?.name ?? p.topicId,
        section: FAMILY_BY_ID.get(p.topicId)?.section ?? '',
        question: p.question,
        statementTex: p.statementTex,
        givenTex: opts.showComplementary ? p.givenTex : undefined,
        givenLabel: p.givenLabel,
        options,
        correctIndex,
        hint: p.hint,
        solution: p.solution,
        note: p.note,
      }
    },
    [scope],
  )

  // First question, and a fresh one whenever the scope or source changes.
  useEffect(() => {
    setDrill(build(source, null))
    setPicked(null)
    setHintShown(false)
  }, [source, build])

  const advance = useCallback(() => {
    setDrill((d) => build(source, d?.id ?? null))
    setPicked(null)
    setHintShown(false)
  }, [build, source])

  const answer = useCallback(
    (index: number) => {
      if (picked !== null || !drill) return
      setPicked(index)
      const correct = index === drill.correctIndex
      onAnswer(drill.id, correct)
      setRecent((r) => [...r.slice(-19), correct])
    },
    [picked, drill, onAnswer],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!drill) return
      if (e.key === 'Enter' && picked !== null) {
        advance()
        return
      }
      const n = Number(e.key)
      if (picked === null && n >= 1 && n <= drill.options.length) answer(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drill, picked, advance, answer])

  const stats = drill ? statsFor(progress, drill.id) : null
  const tier = stats ? tierFor(stats) : 'new'
  const blurb = useMemo(() => SOURCES.find((s) => s.id === source)?.blurb ?? '', [source])

  if (!drill) return null

  const wasCorrect = picked !== null && picked === drill.correctIndex
  const wide = drill.options.every((o) => o.length < 46)

  return (
    <section>
      <ScopePicker scope={scope} onScope={onScope} />
      <div className="mode-bar" role="tablist" aria-label="Question source">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={source === s.id}
            className={source === s.id ? 'chip chip-active' : 'chip'}
            onClick={() => setSource(s.id)}
          >
            {s.label}
          </button>
        ))}
        <span className="meta-note">{blurb}</span>
      </div>

      <div className="card problem-card">
        <div className="problem-meta">
          <span className="badge">{drill.badge}</span>
          {drill.section ? <span className="badge badge-section">{drill.section}</span> : null}
          <span className="meta-note">{TIER_LABEL[tier]}</span>
        </div>

        <p className="question-line">
          <Rich text={drill.question} />
        </p>

        {drill.statementTex ? (
          <div className="problem-tex">
            <Tex tex={drill.statementTex} block />
          </div>
        ) : null}

        {drill.givenTex ? (
          <div className="given-row">
            <span className="given-label">{drill.givenLabel ?? 'Given'}</span>
            <Tex tex={drill.givenTex} />
          </div>
        ) : null}

        <div className="divider" />

        <div className={wide ? 'options options-wide' : 'options'}>
          {drill.options.map((opt, i) => {
            const isCorrect = i === drill.correctIndex
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
                  <Rich text={opt} />
                </span>
              </button>
            )
          })}
        </div>

        {picked !== null ? (
          <div className={wasCorrect ? 'feedback feedback-good' : 'feedback feedback-bad'} role="status">
            <span className="feedback-tier">{TIER_LABEL[tierFor(statsFor(progress, drill.id))]}</span>
            {wasCorrect ? 'Correct' : 'Not that one'}
          </div>
        ) : null}

        <div className="actions">
          {drill.hint ? (
            <button className="btn" onClick={() => setHintShown(true)} disabled={hintShown || picked !== null}>
              Hint
            </button>
          ) : null}
          <button className="btn btn-primary" onClick={advance} disabled={picked === null}>
            Next →
          </button>
          <button className="btn" onClick={advance} disabled={picked !== null}>
            Skip
          </button>
          <span className="meta-note">Keys 1–{drill.options.length} answer, Enter advances.</span>
        </div>

        {hintShown && drill.hint ? (
          <div className="hint">
            <Rich text={drill.hint} />
          </div>
        ) : null}

        {picked !== null && (drill.solution || drill.note) ? (
          <div className="solution">
            {drill.solution ? (
              <>
                <span className="solution-label">Working</span>
                <Rich text={drill.solution} />
              </>
            ) : null}
            {drill.note ? (
              <div className="note-line">
                <Rich text={drill.note} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Keep the correct option and a random selection of the wrong ones. */
function trimOptions(options: string[], correctIndex: number, count: number) {
  if (options.length <= count) return { options, correctIndex }
  const correct = options[correctIndex]
  const wrong = shuffle(options.filter((_, i) => i !== correctIndex)).slice(0, count - 1)
  const next = shuffle([correct, ...wrong])
  return { options: next, correctIndex: next.indexOf(correct) }
}
