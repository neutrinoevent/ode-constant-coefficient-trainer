/**
 * Local progress. One record per trackable item, where an item is either a case
 * from the library (flashcards, multiple choice on stated facts) or a problem
 * generator (everything procedurally generated). They share a store because
 * they measure the same thing — whether you can do it right now — and because
 * a miss on a generated problem should pull the matching card's review forward.
 */

import { ALL_CASES, CASE_BY_ID } from '../data/cases'
import { CHALLENGE_BY_ID } from '../data/challenges'
import { PATH_BY_ID } from '../data/path'
import { GENERATOR_BY_ID } from '../generators'

export interface ItemStats {
  attempts: number
  correct: number
  streak: number
  /** Exponential moving average of recent results, 0..1 — the mastery score. */
  ema: number
  lastSeen: number | null
  // Flashcard scheduling (SM-2 style); only case items are ever scheduled.
  reps: number
  lapses: number
  ease: number
  intervalDays: number
  /** Next review timestamp; null until the card is first studied. */
  due: number | null
}

export interface ProgressState {
  version: 1
  byId: Record<string, ItemStats>
  totalAttempts: number
  totalCorrect: number
  currentStreak: number
  bestStreak: number
  /** New-card introductions today, to pace the flashcard queue. */
  newDay: string
  newToday: number
  /** Path steps cleared, in the order they were cleared. */
  pathDone: string[]
}

export type Grade = 'again' | 'good' | 'easy'

const KEY = 'ode-trainer-progress-v1'
const EMA_ALPHA = 0.2
export const NEW_PER_DAY = 8
const MIN_EASE = 1.3
const MAX_EASE = 3.0
const DAY_MS = 24 * 60 * 60 * 1000
const AGAIN_DELAY_MS = 10 * 60 * 1000

export function emptyStats(): ItemStats {
  return {
    attempts: 0,
    correct: 0,
    streak: 0,
    ema: 0,
    lastSeen: null,
    reps: 0,
    lapses: 0,
    ease: 2.3,
    intervalDays: 0,
    due: null,
  }
}

function dayKey(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function emptyProgress(): ProgressState {
  return {
    version: 1,
    byId: {},
    totalAttempts: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    newDay: dayKey(Date.now()),
    newToday: 0,
    pathDone: [],
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as ProgressState
    if (parsed.version !== 1 || typeof parsed.totalAttempts !== 'number') return emptyProgress()
    return { ...emptyProgress(), ...parsed, pathDone: parsed.pathDone ?? [] }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable (private mode etc.) — training still works, just untracked
  }
}

export function statsFor(state: ProgressState, id: string): ItemStats {
  return state.byId[id] ?? emptyStats()
}

/** Mastery scores keyed by item id, for the adaptive pickers. */
export function masteryMap(state: ProgressState): Map<string, number> {
  return new Map(Object.entries(state.byId).map(([id, s]) => [id, s.ema]))
}

/**
 * Record an answer. A miss on an item whose card is scheduled far out also
 * pulls that review forward — being wrong today outranks yesterday's schedule.
 */
export function recordAttempt(state: ProgressState, id: string, correct: boolean): ProgressState {
  const prev = statsFor(state, id)
  const now = Date.now()
  const stats: ItemStats = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    ema: prev.ema + EMA_ALPHA * ((correct ? 1 : 0) - prev.ema),
    lastSeen: now,
  }
  if (!correct && stats.due !== null && stats.due > now + DAY_MS) {
    stats.due = now + DAY_MS
    stats.intervalDays = 1
  }
  const currentStreak = correct ? state.currentStreak + 1 : 0
  const next: ProgressState = {
    ...state,
    byId: { ...state.byId, [id]: stats },
    totalAttempts: state.totalAttempts + 1,
    totalCorrect: state.totalCorrect + (correct ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
  }
  saveProgress(next)
  return next
}

/** Record a flashcard self-grade and reschedule the card. */
export function recordGrade(state: ProgressState, id: string, grade: Grade): ProgressState {
  const prev = statsFor(state, id)
  const now = Date.now()
  const wasNew = prev.due === null
  const stats: ItemStats = { ...prev, lastSeen: now }

  if (grade === 'again') {
    stats.lapses = prev.reps > 0 ? prev.lapses + 1 : prev.lapses
    stats.ease = Math.max(MIN_EASE, prev.ease - 0.2)
    stats.intervalDays = 0
    stats.due = now + AGAIN_DELAY_MS
    stats.ema = prev.ema + EMA_ALPHA * (0 - prev.ema)
  } else {
    const growth = grade === 'easy' ? prev.ease * 1.4 : prev.ease
    const first = grade === 'easy' ? 3 : 1
    stats.intervalDays =
      prev.intervalDays < 1
        ? first
        : Math.max(prev.intervalDays + 1, Math.round(prev.intervalDays * growth))
    stats.due = now + stats.intervalDays * DAY_MS
    stats.reps = prev.reps + 1
    if (grade === 'easy') stats.ease = Math.min(MAX_EASE, prev.ease + 0.05)
    stats.ema = prev.ema + EMA_ALPHA * (1 - prev.ema)
  }

  const today = dayKey(now)
  const next: ProgressState = {
    ...state,
    byId: { ...state.byId, [id]: stats },
    newDay: today,
    newToday: (state.newDay === today ? state.newToday : 0) + (wasNew ? 1 : 0),
  }
  saveProgress(next)
  return next
}

export interface CardQueue {
  due: string[]
  fresh: string[]
  freshRemaining: number
}

/** Cards to study now: everything due, then unseen cards up to the daily cap. */
export function cardQueue(
  state: ProgressState,
  scope: string[] | null,
  newPerDay: number = NEW_PER_DAY,
): CardQueue {
  const now = Date.now()
  const pool =
    scope && scope.length > 0 ? ALL_CASES.filter((c) => scope.includes(c.familyId)) : ALL_CASES
  const due: { id: string; at: number }[] = []
  const fresh: string[] = []
  for (const item of pool) {
    const s = state.byId[item.id]
    if (!s || s.due === null) fresh.push(item.id)
    else if (s.due <= now) due.push({ id: item.id, at: s.due })
  }
  due.sort((a, b) => a.at - b.at)
  const usedToday = state.newDay === dayKey(now) ? state.newToday : 0
  const freshRemaining = Math.max(0, newPerDay - usedToday)
  return { due: due.map((d) => d.id), fresh: fresh.slice(0, freshRemaining), freshRemaining }
}

export function dueCount(state: ProgressState): number {
  const now = Date.now()
  let n = 0
  for (const [id, s] of Object.entries(state.byId)) {
    if (CASE_BY_ID.has(id) && s.due !== null && s.due <= now) n++
  }
  return n
}

/** Record a cleared path step. Clearing one twice is a no-op. */
export function markStepDone(state: ProgressState, stepId: string): ProgressState {
  if (state.pathDone.includes(stepId)) return state
  const next: ProgressState = { ...state, pathDone: [...state.pathDone, stepId] }
  saveProgress(next)
  return next
}

/** Reopen a cleared step, so it can be run again from the overview. */
export function unmarkStepDone(state: ProgressState, stepId: string): ProgressState {
  const next: ProgressState = { ...state, pathDone: state.pathDone.filter((s) => s !== stepId) }
  saveProgress(next)
  return next
}

export function resetProgress(): ProgressState {
  const next = emptyProgress()
  saveProgress(next)
  return next
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2)
}

/** Parse a backup, keeping only records for items that still exist. */
export function importProgress(json: string): ProgressState | null {
  try {
    const parsed = JSON.parse(json) as ProgressState
    if (parsed.version !== 1 || typeof parsed.byId !== 'object' || parsed.byId === null) return null
    const byId: Record<string, ItemStats> = {}
    for (const [id, s] of Object.entries(parsed.byId)) {
      const known = CASE_BY_ID.has(id) || GENERATOR_BY_ID.has(id) || CHALLENGE_BY_ID.has(id)
      if (known && typeof s.attempts === 'number') byId[id] = { ...emptyStats(), ...s }
    }
    const next: ProgressState = {
      ...emptyProgress(),
      ...parsed,
      byId,
      // Backups written before the path existed have no such field.
      pathDone: (Array.isArray(parsed.pathDone) ? parsed.pathDone : []).filter(
        (id): id is string => typeof id === 'string' && PATH_BY_ID.has(id),
      ),
      version: 1,
    }
    saveProgress(next)
    return next
  } catch {
    return null
  }
}
