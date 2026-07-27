import { useRef, useState } from 'react'
import { FAMILIES } from '../data/cases'
import { familyItemIds, familyScore, familyTier, TIER_LABEL } from '../lib/mastery'
import { dueCount, exportProgress, statsFor, type ProgressState } from '../store/progress'

interface ProgressViewProps {
  progress: ProgressState
  onReset: () => void
  onImport: (json: string) => boolean
}

export function ProgressView({ progress, onReset, onImport }: ProgressViewProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [importNote, setImportNote] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const accuracy =
    progress.totalAttempts > 0
      ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
      : 0

  const download = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ode-trainer-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = (file: File) => {
    file
      .text()
      .then((text) => setImportNote(onImport(text) ? 'Progress restored.' : 'That file could not be read as a backup.'))
      .catch(() => setImportNote('That file could not be read.'))
  }

  return (
    <section>
      <div className="stat-row">
        <div className="card stat-tile">
          <div className="stat-value">{progress.totalAttempts}</div>
          <div className="stat-label">Answered</div>
        </div>
        <div className="card stat-tile">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="card stat-tile">
          <div className="stat-value">{progress.currentStreak}</div>
          <div className="stat-label">Streak</div>
        </div>
        <div className="card stat-tile">
          <div className="stat-value">{progress.bestStreak}</div>
          <div className="stat-label">Best streak</div>
        </div>
        <div className="card stat-tile">
          <div className="stat-value">{dueCount(progress)}</div>
          <div className="stat-label">Cards due</div>
        </div>
      </div>

      <div className="card table-card">
        <h2 className="section-title">By topic</h2>
        <p className="table-caption muted">
          The score is a moving average over every item in the topic — its stated results and its
          generated problems together — so it tracks what you can do now rather than what you have
          ever done.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="num">Seen</th>
              <th className="num">Accuracy</th>
              <th className="meter-col">Mastery</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {FAMILIES.map((f) => {
              const ids = familyItemIds(f.id)
              const attempts = ids.reduce((n, id) => n + statsFor(progress, id).attempts, 0)
              const correct = ids.reduce((n, id) => n + statsFor(progress, id).correct, 0)
              const score = familyScore(progress, f.id)
              const tier = familyTier(progress, f)
              return (
                <tr key={f.id}>
                  <td>
                    <div className="row-name">{f.name}</div>
                    <div className="row-blurb">{f.section}</div>
                  </td>
                  <td className="num">{attempts}</td>
                  <td className="num">
                    {attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '—'}
                  </td>
                  <td className="meter-col">
                    <span className="meter">
                      <span className="meter-fill" style={{ width: `${Math.round(score * 100)}%` }} />
                    </span>
                    <span className="meter-num">{Math.round(score * 100)}</span>
                  </td>
                  <td>
                    <span className={`tier-chip tier-${tier}`}>{TIER_LABEL[tier]}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="reset-row">
          <input
            ref={fileRef}
            className="hidden-input"
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.target.value = ''
            }}
          />
          <button className="btn" onClick={download}>
            Export backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          {confirmReset ? (
            <>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onReset()
                  setConfirmReset(false)
                  setImportNote(null)
                }}
              >
                Erase everything
              </button>
              <button className="btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              Reset progress
            </button>
          )}
        </div>
        {importNote ? <p className="meta-note">{importNote}</p> : null}
      </div>
    </section>
  )
}
