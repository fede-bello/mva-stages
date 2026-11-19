import { describe, expect, it } from 'vitest'
import {
  canShow,
  emptyState,
  FIRST_VISIT_DELAY_MS,
  MAX_SHOWS,
  parseState,
  recordDismissed,
  recordDone,
  recordShown,
  recordVisit,
  RETURNING_DELAY_MS,
  visitDelay,
} from './starPrompt'

const DAY = 86_400_000
const day = (n: number) => Date.UTC(2026, 10, n)

describe('star prompt', () => {
  it('waits longer on a first visit than on a later day', () => {
    let s = recordVisit(emptyState, day(1))
    s = recordVisit(s, day(1))
    expect(s.days).toBe(1)
    expect(visitDelay(s)).toBe(FIRST_VISIT_DELAY_MS)
    s = recordVisit(s, day(2))
    expect(visitDelay(s)).toBe(RETURNING_DELAY_MS)
  })

  it('can show on a first visit', () => {
    expect(canShow(recordVisit(emptyState, day(1)), day(1))).toBe(true)
  })

  it('snoozes three days after showing and stops after four', () => {
    let s = { ...emptyState, days: 1, lastDay: day(1) }
    let t = day(1)
    for (let i = 0; i < MAX_SHOWS; i++) {
      expect(canShow(s, t)).toBe(true)
      s = recordDismissed(recordShown(s, t))
      expect(canShow(s, t + 2 * DAY)).toBe(false)
      t += 3 * DAY
    }
    expect(s.done).toBe(true)
    expect(canShow(s, t + 365 * DAY)).toBe(false)
  })

  it('never shows again after starring or "Don\'t ask again"', () => {
    const s = recordDone(recordShown({ ...emptyState, days: 5 }, day(9)))
    expect(canShow(s, day(9) + 90 * DAY)).toBe(false)
  })

  it('survives garbage in storage', () => {
    expect(parseState('{nope')).toEqual(emptyState)
    expect(parseState('{"days":-3,"done":"yes","opened":"x"}')).toEqual(emptyState)
    expect(parseState(null)).toEqual(emptyState)
  })
})
