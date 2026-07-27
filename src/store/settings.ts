import { FAMILY_BY_ID } from '../data/cases'
import { TRACKS } from '../data/tracks'

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type OptionCount = 'auto' | 2 | 3 | 4

export interface Settings {
  version: 1
  level: Level
  /** Choices per multiple-choice question; 'auto' scales 2 to 4 with mastery. */
  optionCount: OptionCount
  /** Nudge difficulty to hold rolling success near the retrieval-practice band. */
  autoAdapt: boolean
  /** Show the complementary function alongside nonhomogeneous problems. */
  showComplementary: boolean
  newPerDay: number
  /** Sticky family scope shared by every mode. null = everything. */
  scope: string[] | null
  placementDone: boolean
}

const KEY = 'ode-trainer-settings-v1'

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  level: 'intermediate',
  optionCount: 'auto',
  autoAdapt: true,
  showComplementary: true,
  newPerDay: 8,
  scope: null,
  placementDone: false,
}

/**
 * Defaults per experience level, per the expertise-reversal effect: heavy
 * scaffolding for novices (small option sets, a narrow starting scope, the
 * complementary function handed to them, a gentle card pace), none of it for
 * someone revising for a final.
 */
export function levelPreset(level: Level): Partial<Settings> {
  switch (level) {
    case 'beginner':
      return {
        level,
        optionCount: 'auto',
        autoAdapt: true,
        showComplementary: true,
        newPerDay: 4,
        scope: [...(TRACKS.find((t) => t.id === 'core')?.families ?? [])],
      }
    case 'intermediate':
      return {
        level,
        optionCount: 'auto',
        autoAdapt: true,
        showComplementary: true,
        newPerDay: 8,
        scope: null,
      }
    case 'advanced':
      return {
        level,
        optionCount: 4,
        autoAdapt: false,
        showComplementary: false,
        newPerDay: 16,
        scope: null,
      }
  }
}

function sanitizeScope(scope: unknown): string[] | null {
  if (!Array.isArray(scope)) return null
  const valid = scope.filter((f): f is string => typeof f === 'string' && FAMILY_BY_ID.has(f))
  return valid.length > 0 ? valid : null
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Settings
    if (parsed.version !== 1) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...parsed, scope: sanitizeScope(parsed.scope) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // storage unavailable — settings just won't persist
  }
}
