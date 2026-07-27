import { useEffect, useMemo, useState } from 'react'
import { CASE_BY_ID } from '../data/cases'
import { TIER_LABEL, tierFor } from '../lib/mastery'
import { cardQueue, statsFor, type Grade, type ProgressState } from '../store/progress'
import type { Settings } from '../store/settings'
import { Rich } from './Tex'
import { ScopePicker } from './ScopePicker'

interface CardsProps {
  progress: ProgressState
  settings: Settings
  scope: string[] | null
  onScope: (next: string[] | null) => void
  onGrade: (id: string, grade: Grade) => void
}

export function Cards({ progress, settings, scope, onScope, onGrade }: CardsProps) {
  const [shown, setShown] = useState(false)

  const queue = useMemo(
    () => cardQueue(progress, scope, settings.newPerDay),
    [progress, scope, settings.newPerDay],
  )
  const currentId = queue.due[0] ?? queue.fresh[0] ?? null
  const item = currentId ? CASE_BY_ID.get(currentId) : null

  useEffect(() => setShown(false), [currentId])

  const grade = (g: Grade) => {
    if (!currentId) return
    onGrade(currentId, g)
    setShown(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item) return
      if (!shown && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setShown(true)
        return
      }
      if (shown && e.key === '1') grade('again')
      if (shown && e.key === '2') grade('good')
      if (shown && e.key === '3') grade('easy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!item) {
    return (
      <section>
        <ScopePicker scope={scope} onScope={onScope} />
        <div className="card empty-state">
          <p className="empty-title">Nothing due in this scope</p>
          <p className="muted">
            {queue.freshRemaining === 0
              ? `Today's ${settings.newPerDay} new cards are done. Reviews arrive on their own schedule; Classify and Solve are always open.`
              : 'Every card here is scheduled ahead. Widen the scope, or drill in Classify and Solve.'}
          </p>
        </div>
      </section>
    )
  }

  const stats = statsFor(progress, item.id)
  const isNew = stats.due === null

  return (
    <section>
      <ScopePicker scope={scope} onScope={onScope} />
      <div className="card problem-card">
        <div className="problem-meta">
          <span className={isNew ? 'badge badge-section' : 'badge'}>
            {isNew ? 'New' : 'Review'}
          </span>
          <span className="badge badge-section">{item.section}</span>
          <span className="meta-note">
            {item.familyName} · {TIER_LABEL[tierFor(stats)]}
          </span>
          <span className="meta-note" style={{ marginLeft: 'auto' }}>
            {queue.due.length} due · {queue.fresh.length} new left today
          </span>
        </div>

        <p className="question-line" style={{ fontSize: 16, color: 'var(--ink)' }}>
          <Rich text={item.prompt} />
        </p>

        <div className="divider" style={{ marginTop: 18 }} />

        {shown ? (
          <>
            <div className="card-answer">
              <Rich text={item.answer} />
            </div>
            {item.note ? (
              <div className="hint">
                <Rich text={item.note} />
              </div>
            ) : null}
            <div className="actions grade-row">
              <button className="btn btn-danger" onClick={() => grade('again')}>
                Again
              </button>
              <button className="btn" onClick={() => grade('good')}>
                Good
              </button>
              <button className="btn btn-primary" onClick={() => grade('easy')}>
                Easy
              </button>
              <span className="meta-note">Keys 1 / 2 / 3</span>
            </div>
          </>
        ) : (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setShown(true)}>
              Show answer
            </button>
            <span className="meta-note">Space or Enter</span>
          </div>
        )}

        <p className="cards-note muted">
          Intervals follow an SM-2 style schedule. A miss in Classify or Solve pulls the matching
          card forward.
        </p>
      </div>
    </section>
  )
}
