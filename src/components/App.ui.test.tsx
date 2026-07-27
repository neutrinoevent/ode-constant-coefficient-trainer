/**
 * Smoke test for the shell: every tab mounts and renders its own content, and
 * a Classify question can actually be answered. Covers the wiring that the
 * corpus and checker tests cannot see.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from '../App'
import { TOUR_KEY } from './Tour'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  // Skip the first-run tour and placement so the app opens straight into Learn.
  localStorage.setItem(TOUR_KEY, '1')
  localStorage.setItem(
    'ode-trainer-settings-v1',
    JSON.stringify({ version: 1, level: 'intermediate', optionCount: 4, autoAdapt: false, showComplementary: true, newPerDay: 8, scope: null, placementDone: true }),
  )
  container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    root = createRoot(container)
    root.render(<App />)
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const tab = (label: string): HTMLButtonElement => {
  const el = [...container.querySelectorAll<HTMLButtonElement>('.tab')].find(
    (b) => b.textContent?.startsWith(label),
  )
  if (!el) throw new Error(`no tab labelled ${label}`)
  return el
}

const click = (el: HTMLElement) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

describe('app shell', () => {
  it('opens on Learn with the case library visible', () => {
    expect(container.querySelector('.brand-name')?.textContent).toBe('ODE Trainer')
    expect(container.querySelectorAll('.learn-item').length).toBeGreaterThan(5)
    expect(container.querySelectorAll('.case-row').length).toBeGreaterThan(3)
  })

  it('mounts every tab', () => {
    for (const label of ['Classify', 'Solve', 'Challenge', 'Cards', 'Progress', 'About', 'Learn']) {
      click(tab(label))
      expect(container.querySelector('.main')?.textContent?.length ?? 0).toBeGreaterThan(40)
    }
  })

  it('answers a Classify question and records the attempt', () => {
    click(tab('Classify'))
    const options = [...container.querySelectorAll<HTMLButtonElement>('.option')]
    expect(options.length).toBeGreaterThanOrEqual(2)
    // KaTeX actually rendered rather than leaving raw markup on the page.
    expect(container.querySelector('.katex')).not.toBeNull()

    click(options[0])
    expect(container.querySelector('.feedback')).not.toBeNull()

    click(tab('Progress'))
    const answered = container.querySelector('.stat-value')?.textContent
    expect(answered).toBe('1')
  })

  it('offers a typed-answer box under Solve', () => {
    click(tab('Solve'))
    const input = container.querySelector<HTMLInputElement>('#answer-input')
    expect(input).not.toBeNull()
    expect(input?.placeholder.length ?? 0).toBeGreaterThan(0)
    expect(container.querySelector('.problem-tex')).not.toBeNull()
  })

  it('shows a root plane under Challenge', () => {
    click(tab('Challenge'))
    expect(container.querySelector('.root-plane')).not.toBeNull()
    // A triple real root plots as a single point, so one is the floor.
    expect(container.querySelectorAll('.plane-root').length).toBeGreaterThanOrEqual(1)
  })

  it('serves a flashcard under Cards', () => {
    click(tab('Cards'))
    expect(container.querySelector('.problem-card, .empty-state')).not.toBeNull()
  })
})
