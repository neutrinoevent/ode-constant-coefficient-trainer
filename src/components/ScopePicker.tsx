import { FAMILIES } from '../data/cases'
import { TRACKS } from '../data/tracks'

interface ScopePickerProps {
  scope: string[] | null
  onScope: (next: string[] | null) => void
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x))

/** Curated tracks on one line, individual families on the next. */
export function ScopePicker({ scope, onScope }: ScopePickerProps) {
  const toggle = (id: string) => {
    const current = scope ?? []
    const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
    onScope(next.length ? next : null)
  }

  return (
    <div className="scope-picker">
      <div className="mode-bar">
        <span className="scope-label">Scope</span>
        <button
          className={scope === null ? 'chip chip-track chip-active' : 'chip chip-track'}
          onClick={() => onScope(null)}
        >
          Everything
        </button>
        {TRACKS.map((t) => (
          <button
            key={t.id}
            className={
              scope && sameSet(scope, t.families)
                ? 'chip chip-track chip-active'
                : 'chip chip-track'
            }
            title={t.blurb}
            onClick={() => onScope([...t.families])}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mode-bar scope-families">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            className={scope?.includes(f.id) ? 'chip chip-active' : 'chip'}
            title={f.section}
            onClick={() => toggle(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  )
}
