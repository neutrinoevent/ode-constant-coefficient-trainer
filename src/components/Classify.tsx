import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FAMILY_BY_ID } from '../data/cases'
import { nextProblem, scopedGenerators } from '../generators'
import { resolveOptionCount } from '../lib/adapt'
import { TIER_LABEL, tierFor } from '../lib/mastery'
import { buildQuestion, pickCase, scopedCases, shuffle } from '../lib/pick'
import { masteryMap, statsFor, type ProgressState } from '../store/progress'
import type { Settings } from '../store/settings'
import { QuestionView, type Ask } from './QuestionView'
import { ScopePicker } from './ScopePicker'

type Source = 'mixed' | 'facts' | 'problems'

const SOURCES: { id: Source; label: string; blurb: string }[] = [
  { id: 'mixed', label: 'Mixed', blurb: 'Stated results and generated equations, interleaved.' },
  { id: 'facts', label: 'Results', blurb: 'The stated case results, straight from the library.' },
  { id: 'problems', label: 'Equations', blurb: 'Freshly generated equations every time.' },
]

/** A Classify question is an Ask; the tier badge is filled in at render time. */
type Drill = Ask

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
          explanations: q.options.map(() => null),
          note: item.note,
        }
      }
      const p = nextProblem('choice', scope, masteryMap(state), excludeId ?? undefined)
      if (p.answer.kind !== 'choice') throw new Error('expected a choice problem')
      const stats = statsFor(state, p.generatorId)
      const count = resolveOptionCount(opts, tierFor(stats), recentWindow)
      const trimmed = trimOptions(
        p.answer.options,
        p.answer.correctIndex,
        p.answer.explanations ?? p.answer.options.map(() => null),
        count,
      )
      return {
        id: p.generatorId,
        badge: FAMILY_BY_ID.get(p.topicId)?.name ?? p.topicId,
        section: FAMILY_BY_ID.get(p.topicId)?.section ?? '',
        question: p.question,
        statementTex: p.statementTex,
        givenTex: opts.showComplementary ? p.givenTex : undefined,
        givenLabel: p.givenLabel,
        ...trimmed,
        hint: p.hint,
        solution: p.solution,
        note: p.note,
        derivation: p.derivation,
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

      <QuestionView
        ask={{ ...drill, meta: TIER_LABEL[tier] }}
        picked={picked}
        onPick={answer}
        hintShown={hintShown}
        actions={
          <div className="actions">
            {drill.hint ? (
              <button
                className="btn"
                onClick={() => setHintShown(true)}
                disabled={hintShown || picked !== null}
              >
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
        }
      />
    </section>
  )
}

/**
 * Keep the correct option and a random selection of the wrong ones, carrying
 * each option's explanation with it.
 */
function trimOptions(
  options: string[],
  correctIndex: number,
  explanations: (string | null)[],
  count: number,
) {
  const paired = options.map((text, i) => ({ text, why: explanations[i] ?? null }))
  const correct = paired[correctIndex]
  const kept =
    options.length <= count
      ? paired
      : [correct, ...shuffle(paired.filter((_, i) => i !== correctIndex)).slice(0, count - 1)]
  const next = options.length <= count ? kept : shuffle(kept)
  return {
    options: next.map((o) => o.text),
    correctIndex: next.indexOf(correct),
    explanations: next.map((o) => o.why),
  }
}
