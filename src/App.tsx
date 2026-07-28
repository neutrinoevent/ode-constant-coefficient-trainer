import { useEffect, useState } from 'react'
import { About } from './components/About'
import { Cards } from './components/Cards'
import { Challenge } from './components/Challenge'
import { Classify } from './components/Classify'
import { Learn } from './components/Learn'
import { Path } from './components/Path'
import { Placement } from './components/Placement'
import { ProgressView } from './components/ProgressView'
import { SettingsView } from './components/SettingsView'
import { Solve } from './components/Solve'
import { Tour, TOUR_KEY } from './components/Tour'
import { suggest } from './lib/coach'
import { nextStep, PATH } from './data/path'
import {
  dueCount,
  importProgress,
  loadProgress,
  markStepDone,
  recordAttempt,
  recordGrade,
  resetProgress,
  type Grade,
  type ProgressState,
} from './store/progress'
import { loadSettings, saveSettings, type Settings } from './store/settings'

type View =
  | 'path'
  | 'learn'
  | 'classify'
  | 'solve'
  | 'challenge'
  | 'cards'
  | 'progress'
  | 'about'
  | 'settings'
type Theme = 'light' | 'dark' | null

const THEME_KEY = 'ode-trainer-theme'

function initTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

function tourPending(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) !== '1'
  } catch {
    return false
  }
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'path', label: 'Path' },
  { id: 'learn', label: 'Learn' },
  { id: 'classify', label: 'Classify' },
  { id: 'solve', label: 'Solve' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'cards', label: 'Cards' },
  { id: 'progress', label: 'Progress' },
  { id: 'about', label: 'About' },
]

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  // The path leads unless it is finished, or the placement said "revising".
  const [view, setView] = useState<View>(() =>
    loadSettings().level === 'advanced' || nextStep(loadProgress().pathDone) === null
      ? 'learn'
      : 'path',
  )
  const [theme, setTheme] = useState<Theme>(() => initTheme())
  const [scope, setScope] = useState<string[] | null>(() => loadSettings().scope)
  const [showTour, setShowTour] = useState<boolean>(() => tourPending())
  const [coachDismissed, setCoachDismissed] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme) {
      root.setAttribute('data-theme', theme)
      try {
        localStorage.setItem(THEME_KEY, theme)
      } catch {
        // storage unavailable — theme just won't persist
      }
    } else {
      root.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    const dark =
      theme === 'dark' ||
      (theme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(dark ? 'light' : 'dark')
  }

  const updateSettings = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
    if (next.scope !== settings.scope) setScope(next.scope)
    // Someone revising for an exam does not want to be walked through it.
    if (next.level === 'advanced' && view === 'path') setView('classify')
  }

  const updateScope = (next: string[] | null) => {
    setScope(next)
    const merged = { ...settings, scope: next }
    setSettings(merged)
    saveSettings(merged)
  }

  const onAnswer = (id: string, correct: boolean) =>
    setProgress((p) => recordAttempt(p, id, correct))
  const onGrade = (id: string, grade: Grade) => setProgress((p) => recordGrade(p, id, grade))
  const onStepDone = (stepId: string) => setProgress((p) => markStepDone(p, stepId))
  const onImport = (json: string): boolean => {
    const next = importProgress(json)
    if (next) setProgress(next)
    return next !== null
  }

  const due = dueCount(progress)
  const pending = nextStep(progress.pathDone)
  const coach =
    pending && settings.level !== 'advanced' && due === 0
      ? {
          text: `Next on the path: step ${PATH.indexOf(pending) + 1}, ${pending.title}.`,
          go: 'path' as const,
          goLabel: 'Continue',
          scope: undefined,
        }
      : suggest(progress)
  const showCoach =
    !coachDismissed &&
    !showTour &&
    settings.placementDone &&
    view !== coach.go &&
    view !== 'settings' &&
    view !== 'about'

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            m
          </span>
          <span className="brand-name">ODE Trainer</span>
        </div>
        <nav className="tabs" aria-label="Main">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              data-tour={v.id}
              className={view === v.id ? 'tab tab-active' : 'tab'}
              onClick={() => setView(v.id)}
            >
              {v.label}
              {v.id === 'cards' && due > 0 ? <span className="due-dot">{due}</span> : null}
            </button>
          ))}
        </nav>
        <button
          className={view === 'settings' ? 'btn icon-btn btn-primary' : 'btn icon-btn'}
          data-tour="settings"
          onClick={() => setView('settings')}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
        <button
          className="btn icon-btn"
          onClick={() => setShowTour(true)}
          aria-label="Replay interface tour"
          title="Replay tour"
        >
          ?
        </button>
        <button className="btn icon-btn" onClick={toggleTheme} aria-label="Toggle color theme">
          ◐
        </button>
      </header>

      {showCoach ? (
        <div className="coach-bar">
          <span className="coach-text">{coach.text}</span>
          <button
            className="btn coach-go"
            onClick={() => {
              if (coach.scope !== undefined) updateScope(coach.scope)
              setView(coach.go)
            }}
          >
            {coach.goLabel}
          </button>
          <button
            className="btn coach-dismiss"
            onClick={() => setCoachDismissed(true)}
            aria-label="Dismiss suggestion"
          >
            ×
          </button>
        </div>
      ) : null}

      <main className="main">
        {view === 'path' ? (
          <Path
            progress={progress}
            settings={settings}
            onAnswer={onAnswer}
            onStepDone={onStepDone}
            onPractice={(next) => {
              updateScope(next)
              setView('classify')
            }}
          />
        ) : null}
        {view === 'learn' ? (
          <Learn
            progress={progress}
            onDrillFamily={(id) => {
              updateScope([id])
              setView('classify')
            }}
          />
        ) : null}
        {view === 'classify' ? (
          <Classify
            progress={progress}
            settings={settings}
            scope={scope}
            onScope={updateScope}
            onAnswer={onAnswer}
          />
        ) : null}
        {view === 'solve' ? (
          <Solve
            progress={progress}
            settings={settings}
            scope={scope}
            onScope={updateScope}
            onAnswer={onAnswer}
          />
        ) : null}
        {view === 'challenge' ? <Challenge progress={progress} onAnswer={onAnswer} /> : null}
        {view === 'cards' ? (
          <Cards
            progress={progress}
            settings={settings}
            scope={scope}
            onScope={updateScope}
            onGrade={onGrade}
          />
        ) : null}
        {view === 'progress' ? (
          <ProgressView
            progress={progress}
            onReset={() => setProgress(resetProgress())}
            onImport={onImport}
          />
        ) : null}
        {view === 'about' ? <About /> : null}
        {view === 'settings' ? <SettingsView settings={settings} onChange={updateSettings} /> : null}
      </main>

      <footer className="footer muted">
        Local-first — no server, no accounts. Progress lives in this browser; back it up under
        Progress.
      </footer>

      {showTour ? (
        <Tour
          onDone={(goStart) => {
            setShowTour(false)
            if (goStart) setView(settings.level === 'advanced' ? 'classify' : 'path')
          }}
        />
      ) : null}
      {!showTour && !settings.placementDone ? (
        <Placement settings={settings} onDone={updateSettings} />
      ) : null}
    </div>
  )
}
