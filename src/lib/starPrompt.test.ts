import { describe, expect, it } from 'vitest'
import {
  emptyState,
  parseState,
  recordDismissed,
  recordOpened,
  recordShown,
  recordStarred,
  recordVisit,
  shouldShow,
} from './starPrompt'

const day = (n: number) => Date.UTC(2026, 10, n)

describe('star prompt', () => {
  it('never shows on a first visit, however engaged', () => {
    let s = recordVisit(emptyState, day(1))
    for (let i = 0; i < 10; i++) s = recordOpened(s)
    expect(shouldShow(s, day(1))).toBe(false)
  })

  it('counts distinct days only', () => {
    let s = recordVisit(emptyState, day(1))
    s = recordVisit(s, day(1))
    s = recordVisit(s, day(2))
    expect(s.days).toBe(2)
    expect(shouldShow(s, day(2))).toBe(false)
    s = recordVisit(s, day(5))
    expect(shouldShow(s, day(5))).toBe(true)
  })

  it('shows on the second day after three opened postings', () => {
    let s = recordVisit(recordVisit(emptyState, day(1)), day(2))
    s = recordOpened(recordOpened(s))
    expect(shouldShow(s, day(2))).toBe(false)
    expect(shouldShow(recordOpened(s), day(2))).toBe(true)
  })

  it('snoozes 30 days after showing and stops after two', () => {
    let s = { ...emptyState, days: 3, lastDay: day(3) }
    s = recordDismissed(recordShown(s, day(3)))
    expect(shouldShow(s, day(4))).toBe(false)
    expect(shouldShow(s, day(3) + 30 * 86_400_000)).toBe(true)
    s = recordDismissed(recordShown(s, day(3) + 30 * 86_400_000))
    expect(s.done).toBe(true)
    expect(shouldShow(s, day(3) + 365 * 86_400_000)).toBe(false)
  })

  it('never shows again after starring', () => {
    const s = recordStarred(recordShown({ ...emptyState, days: 5 }, day(9)))
    expect(shouldShow(s, day(9) + 90 * 86_400_000)).toBe(false)
  })

  it('survives garbage in storage', () => {
    expect(parseState('{nope')).toEqual(emptyState)
    expect(parseState('{"days":-3,"done":"yes","opened":"x"}')).toEqual(emptyState)
    expect(parseState(null)).toEqual(emptyState)
  })
})
