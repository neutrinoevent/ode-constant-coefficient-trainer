import { useEffect, useLayoutEffect, useState } from 'react'

export const TOUR_KEY = 'ode-trainer-tour-v1'

interface Step {
  /** data-tour attribute of the element to spotlight, or null for a centred card. */
  target: string | null
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    target: null,
    title: 'Five minutes to the shape of it',
    body: 'Chapter 4 is three cases and one rule about when to multiply by a power of x. Everything here aims at recognizing which case you are in, fast.',
  },
  {
    target: 'path',
    title: 'Path',
    body: 'The route through the chapter, one idea at a time. Each step explains a single thing, shows it worked through on real numbers, then drills that thing alone before the next arrives. Start here if the three cases are not yet automatic.',
  },
  {
    target: 'learn',
    title: 'Learn',
    body: 'The stated results, by section, with the specific mistake each one invites. A reference rather than a route — use it to look something up.',
  },
  {
    target: 'classify',
    title: 'Classify',
    body: 'Multiple choice over everything at once, with no ordering. Keys 1 to 4 answer, Enter advances. Every wrong option is a specific mistake, and picking one tells you which.',
  },
  {
    target: 'solve',
    title: 'Solve',
    body: 'Type the answer instead of picking it. Any valid fundamental set is accepted, so you are not guessing at a preferred form.',
  },
  {
    target: 'challenge',
    title: 'Challenge',
    body: 'Roots plotted in the complex plane, with no equation to work from, and a matching board.',
  },
  {
    target: 'cards',
    title: 'Cards',
    body: 'Spaced repetition over the stated results. The badge counts what is due. A miss elsewhere pulls the matching card forward.',
  },
  {
    target: 'settings',
    title: 'Settings',
    body: 'Choice counts, difficulty adaptation, whether the complementary function is given, and card pace.',
  },
]

export function Tour({ onDone }: { onDone: (goStart: boolean) => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = STEPS[i]

  useLayoutEffect(() => {
    if (!step.target) {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone(false)
      if (e.key === 'ArrowRight') setI((n) => Math.min(STEPS.length - 1, n + 1))
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const finish = (goStart: boolean) => {
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      // storage unavailable — the tour will simply offer itself again
    }
    onDone(goStart)
  }

  const pad = 6
  const spot = rect
    ? {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + 2 * pad,
        height: rect.height + 2 * pad,
      }
    : null

  const popStyle = spot
    ? {
        left: Math.min(Math.max(12, spot.left), window.innerWidth - 342),
        top: spot.top + spot.height + 12,
      }
    : {
        left: Math.max(12, window.innerWidth / 2 - 165),
        top: Math.max(12, window.innerHeight / 2 - 120),
      }

  return (
    <div className="tour-root">
      {spot ? <div className="tour-spot" style={spot} /> : <div className="tour-spot" style={{ inset: 0 }} />}
      <div className="tour-pop" style={popStyle}>
        <div className="tour-title">{step.title}</div>
        <div className="tour-body">{step.body}</div>
        <div className="tour-dots">
          {STEPS.map((_, n) => (
            <i key={n} className={n === i ? 'on' : ''} />
          ))}
        </div>
        <div className="tour-row">
          <button className="btn" onClick={() => finish(false)}>
            Skip
          </button>
          <span className="tour-spacer" />
          {i > 0 ? (
            <button className="btn" onClick={() => setI(i - 1)}>
              Back
            </button>
          ) : null}
          {i < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => finish(true)}>
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
