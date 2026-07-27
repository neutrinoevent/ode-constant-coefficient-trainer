import { useState } from 'react'
import { FAMILIES } from '../data/cases'
import { GENERATORS } from '../generators'
import { familyTier, TIER_LABEL, tierFor } from '../lib/mastery'
import { statsFor, type ProgressState } from '../store/progress'
import { Rich } from './Tex'

interface LearnProps {
  progress: ProgressState
  onDrillFamily: (familyId: string) => void
}

export function Learn({ progress, onDrillFamily }: LearnProps) {
  const [openId, setOpenId] = useState(FAMILIES[1].id)
  const family = FAMILIES.find((f) => f.id === openId) ?? FAMILIES[0]
  const tier = familyTier(progress, family)
  const generators = GENERATORS.filter((g) => g.topicId === family.id)

  return (
    <div className="learn">
      <nav className="learn-nav" aria-label="Topics">
        {FAMILIES.map((f) => {
          const t = familyTier(progress, f)
          return (
            <button
              key={f.id}
              className={f.id === openId ? 'learn-item learn-item-active' : 'learn-item'}
              onClick={() => setOpenId(f.id)}
            >
              <span>
                {f.name} <span className="learn-item-section">{f.section}</span>
              </span>
              <span className={`tier-dot tier-${t}`} title={TIER_LABEL[t]} />
            </button>
          )
        })}
      </nav>

      <section className="card">
        <div className="learn-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            {family.name} <span className="muted">{family.section}</span>
          </h2>
          <div className="actions" style={{ marginTop: 0 }}>
            <span className={`tier-chip tier-${tier}`}>{TIER_LABEL[tier]}</span>
            <button className="btn" onClick={() => onDrillFamily(family.id)}>
              Drill this
            </button>
          </div>
        </div>
        <p className="learn-blurb">
          <Rich text={family.blurb} />
        </p>

        <ul className="case-list">
          {family.cases.map((c) => {
            const s = statsFor(progress, c.id)
            const t = tierFor(s)
            return (
              <li key={c.id} className="case-row">
                <div className="case-name">{c.name}</div>
                <div className="case-prompt">
                  <span className={`tier-dot tier-${t}`} title={TIER_LABEL[t]} />
                  <span>
                    <Rich text={c.prompt} />
                  </span>
                </div>
                <div className="case-answer">
                  <Rich text={c.answer} />
                </div>
                {c.note ? (
                  <div className="case-note">
                    <Rich text={c.note} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>

        {generators.length ? (
          <>
            <div className="case-name" style={{ marginTop: 18 }}>
              Generated practice for this topic
            </div>
            <ul className="case-list">
              {generators.map((g) => (
                <li key={g.id} className="case-row">
                  <div className="case-prompt">
                    <span className="row-name">{g.name}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {g.mode === 'choice' ? 'Classify' : 'Solve'} · {g.section}
                    </span>
                  </div>
                  <div className="row-blurb">
                    <Rich text={g.blurb} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </div>
  )
}
