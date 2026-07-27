import { levelPreset, type Level, type Settings } from '../store/settings'

const CHOICES: { id: Level; label: string }[] = [
  { id: 'beginner', label: 'Just met the auxiliary equation' },
  { id: 'intermediate', label: 'Working through chapter 4 now' },
  { id: 'advanced', label: 'Revising for an exam' },
]

/** One question on first run, so the defaults are not aimed at nobody in particular. */
export function Placement({
  settings,
  onDone,
}: {
  settings: Settings
  onDone: (next: Settings) => void
}) {
  const choose = (level: Level) =>
    onDone({ ...settings, ...levelPreset(level), placementDone: true })

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Set up">
      <div className="modal-card">
        <h2 className="section-title">Where are you with this material?</h2>
        <p className="settings-blurb">
          This sets the starting scope, how many choices questions offer, and the flashcard pace.
          All of it is adjustable later under Settings.
        </p>
        <div className="modal-choices">
          {CHOICES.map((c) => (
            <button key={c.id} className="btn" onClick={() => choose(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <button
          className="btn"
          style={{ width: '100%' }}
          onClick={() => onDone({ ...settings, placementDone: true })}
        >
          Skip — use the defaults
        </button>
      </div>
    </div>
  )
}
