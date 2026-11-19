// When to ask for a GitHub star. Only visitors who got value from the board see it, every week
// at most and three times ever (most people use the board for a few weeks only). Never again after
// they click the star link or "Don't ask again". Everything stays in this browser's localStorage:
// no cookie, nothing sent anywhere.

export const STAR_KEY = 'mva-stages:star-prompt'

export type StarState = {
  /** Distinct Paris days with a visit (only the count and the last one are kept). */
  days: number
  lastDay: number
  /** Postings opened with "Open the original posting". */
  opened: number
  /** Times the card was shown, and when it may show again (0: no snooze). */
  shown: number
  snoozeUntil: number
  /** Clicked the star link, or dismissed for good. */
  done: boolean
}

const DAY = 86_400_000
export const MIN_DAYS = 2
export const MIN_OPENED = 3
export const MAX_SHOWS = 3
export const SNOOZE_DAYS = 7

export const emptyState: StarState = { days: 0, lastDay: 0, opened: 0, shown: 0, snoozeUntil: 0, done: false }

export function parseState(raw: string | null): StarState {
  if (!raw) return { ...emptyState }
  try {
    const v = JSON.parse(raw) as Partial<StarState>
    const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : 0)
    return {
      days: n(v.days),
      lastDay: n(v.lastDay),
      opened: n(v.opened),
      shown: n(v.shown),
      snoozeUntil: n(v.snoozeUntil),
      done: v.done === true,
    }
  } catch {
    return { ...emptyState }
  }
}

/** Counts today as a visit day if it is a new one. `today` is a UTC midnight (parisToday). */
export function recordVisit(s: StarState, today: number): StarState {
  return today > s.lastDay ? { ...s, days: s.days + 1, lastDay: today } : s
}

export function recordOpened(s: StarState): StarState {
  return { ...s, opened: s.opened + 1 }
}

/** Engaged enough: came back on a second day, or opened 3 postings. */
export function shouldShow(s: StarState, today: number): boolean {
  if (s.done || s.shown >= MAX_SHOWS || today < s.snoozeUntil) return false
  return s.days >= MIN_DAYS || s.opened >= MIN_OPENED
}

export function recordShown(s: StarState, today: number): StarState {
  // Snoozed right away, so a reload or a second tab does not show it twice.
  return { ...s, shown: s.shown + 1, snoozeUntil: today + SNOOZE_DAYS * DAY }
}

export function recordDismissed(s: StarState): StarState {
  return s.shown >= MAX_SHOWS ? { ...s, done: true } : s
}

/** Clicked the star link or "Don't ask again". */
export function recordDone(s: StarState): StarState {
  return { ...s, done: true }
}

// Storage access can throw (private windows, blocked site data): then the card never shows.
export function loadState(): StarState | null {
  try {
    return parseState(window.localStorage.getItem(STAR_KEY))
  } catch {
    return null
  }
}

export function saveState(s: StarState): void {
  try {
    window.localStorage.setItem(STAR_KEY, JSON.stringify(s))
  } catch {
    // Nothing to do: the card just will not be remembered.
  }
}

export function update(fn: (s: StarState) => StarState): void {
  const s = loadState()
  if (s) saveState(fn(s))
}
