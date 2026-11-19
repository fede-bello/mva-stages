import { describe, expect, it } from 'vitest'
import {
  emptyState,
  parseState,
  recordDismissed,
  recordDone,
  recordOpened,
  recordShown,
  recordVisit,
  shouldShow,
} from './starPrompt'

const DAY = 86_400_000
const day = (n: number) => Date.UTC(2026, 10, n)

describe('star prompt', () => {
  it('never shows on a quick first visit', () => {
    let s = recordVisit(emptyState, day(1))
    s = recordOpened(recordOpened(s))
    expect(shouldShow(s, day(1))).toBe(false)
  })

  it('shows on a first visit after three opened postings', () => {
    let s = recordVisit(emptyState, day(1))
    s = recordOpened(recordOpened(recordOpened(s)))
    expect(shouldShow(s, day(1))).toBe(true)
  })

  it('shows on the second distinct day', () => {
    let s = recordVisit(emptyState, day(1))
    s = recordVisit(s, day(1))
    expect(s.days).toBe(1)
    expect(shouldShow(s, day(1))).toBe(false)
    s = recordVisit(s, day(2))
    expect(shouldShow(s, day(2))).toBe(true)
  })

  it('snoozes a week after showing and stops after three', () => {
    let s = { ...emptyState, days: 2, lastDay: day(2) }
    let t = day(2)
    for (let i = 0; i < 3; i++) {
      expect(shouldShow(s, t)).toBe(true)
      s = recordDismissed(recordShown(s, t))
      expect(shouldShow(s, t + 6 * DAY)).toBe(false)
      t += 7 * DAY
    }
    expect(s.done).toBe(true)
    expect(shouldShow(s, t + 365 * DAY)).toBe(false)
  })

  it('never shows again after starring or "Don\'t ask again"', () => {
    const s = recordDone(recordShown({ ...emptyState, days: 5 }, day(9)))
    expect(shouldShow(s, day(9) + 90 * DAY)).toBe(false)
  })

  it('survives garbage in storage', () => {
    expect(parseState('{nope')).toEqual(emptyState)
    expect(parseState('{"days":-3,"done":"yes","opened":"x"}')).toEqual(emptyState)
    expect(parseState(null)).toEqual(emptyState)
  })
})
