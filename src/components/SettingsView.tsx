import { levelPreset, type Level, type OptionCount, type Settings } from '../store/settings'
import { Rich } from './Tex'

interface SettingsViewProps {
  settings: Settings
  onChange: (next: Settings) => void
}

const LEVELS: { id: Level; name: string; blurb: string }[] = [
  {
    id: 'beginner',
    name: 'First pass',
    blurb: 'Starts on the three second-order cases, two or three choices at a time, the complementary function always shown, four new cards a day.',
  },
  {
    id: 'intermediate',
    name: 'Working through the chapter',
    blurb: 'Everything in scope, choices scaling with mastery, eight new cards a day.',
  },
  {
    id: 'advanced',
    name: 'Revising',
    blurb: 'Four choices always, no scaffolding, the complementary function withheld, sixteen new cards a day.',
  },
]

const OPTION_COUNTS: OptionCount[] = ['auto', 2, 3, 4]
const NEW_PER_DAY = [4, 8, 16, 30]

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  return (
    <div className="settings">
      <section className="card">
        <h2 className="section-title">Experience level</h2>
        <p className="settings-blurb">
          A preset for everything below. Change any individual setting afterwards and the level
          label stays where you put it.
        </p>
        <div className="level-row">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={settings.level === l.id ? 'level-tile level-active' : 'level-tile'}
              onClick={() => set(levelPreset(l.id))}
            >
              <span className="level-name">{l.name}</span>
              <span className="level-blurb">{l.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Practice</h2>

        <div className="setting-row">
          <div>
            <div className="setting-name">Choices per question</div>
            <div className="setting-note">
              On auto, a new item starts at two choices and widens to four as it is learned.
            </div>
          </div>
          <div className="setting-chips">
            {OPTION_COUNTS.map((n) => (
              <button
                key={String(n)}
                className={settings.optionCount === n ? 'chip chip-active' : 'chip'}
                onClick={() => set({ optionCount: n })}
              >
                {n === 'auto' ? 'Auto' : n}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Difficulty adaptation</div>
            <div className="setting-note">
              Widens or narrows the choice set to hold your recent accuracy near 85%, where
              retrieval practice does the most work.
            </div>
          </div>
          <div className="setting-chips">
            <button
              className={settings.autoAdapt ? 'chip chip-active' : 'chip'}
              onClick={() => set({ autoAdapt: true })}
            >
              On
            </button>
            <button
              className={!settings.autoAdapt ? 'chip chip-active' : 'chip'}
              onClick={() => set({ autoAdapt: false })}
            >
              Off
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Show the complementary function</div>
            <div className="setting-note">
              <Rich text="On nonhomogeneous problems, whether $y_c$ is given or you work it out first. Turning it off makes trial-form questions considerably harder." />
            </div>
          </div>
          <div className="setting-chips">
            <button
              className={settings.showComplementary ? 'chip chip-active' : 'chip'}
              onClick={() => set({ showComplementary: true })}
            >
              Show
            </button>
            <button
              className={!settings.showComplementary ? 'chip chip-active' : 'chip'}
              onClick={() => set({ showComplementary: false })}
            >
              Withhold
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">New cards per day</div>
            <div className="setting-note">
              How many unseen cards the flashcard queue introduces. Reviews are unaffected.
            </div>
          </div>
          <div className="setting-chips">
            {NEW_PER_DAY.map((n) => (
              <button
                key={n}
                className={settings.newPerDay === n ? 'chip chip-active' : 'chip'}
                onClick={() => set({ newPerDay: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
