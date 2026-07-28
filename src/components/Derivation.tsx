import { useState } from 'react'
import type { DerivationStep } from '../lib/derive'
import { Rich, Tex } from './Tex'

/**
 * A worked example as numbered steps. Collapsed by default where it is offered
 * as help, expanded where it is the point of the screen.
 */
export function Derivation({ steps }: { steps: DerivationStep[] }) {
  return (
    <ol className="derivation">
      {steps.map((s, i) => (
        <li key={i} className="derivation-step">
          <div className="derivation-label">{s.label}</div>
          <div className="derivation-body">
            {s.tex ? (
              <div className="derivation-tex">
                <Tex tex={s.tex} block />
              </div>
            ) : null}
            {s.text ? (
              <div className="derivation-text">
                <Rich text={s.text} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** The same, behind a toggle. */
export function DerivationToggle({
  steps,
  label = 'Show me how',
  openLabel = 'Hide the working',
}: {
  steps: DerivationStep[]
  label?: string
  openLabel?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? openLabel : label}
      </button>
      {open ? (
        <div className="derivation-wrap">
          <Derivation steps={steps} />
        </div>
      ) : null}
    </>
  )
}
