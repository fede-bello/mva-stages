import { describe, expect, it } from 'vitest'
import { daysUntil, formatDate, formatShortDate, isoToUtc, parisToday } from './dates'

const today = Date.UTC(2026, 10, 9)

describe('dates', () => {
  it('parses ISO dates and rejects invalid ones', () => {
    expect(isoToUtc('2026-11-09')).toBe(today)
    expect(isoToUtc('2026-02-30')).toBeNull()
    expect(isoToUtc('nope')).toBeNull()
    expect(isoToUtc(null)).toBeNull()
  })

  it('uses the Paris calendar date', () => {
    // 23:30 UTC on 9 Nov is already 10 Nov in Paris (UTC+1 in winter).
    expect(parisToday(new Date('2026-11-09T23:30:00Z'))).toBe(Date.UTC(2026, 10, 10))
    expect(parisToday(new Date('2026-11-09T10:00:00Z'))).toBe(today)
    // Summer time (UTC+2).
    expect(parisToday(new Date('2026-07-01T22:30:00Z'))).toBe(Date.UTC(2026, 6, 2))
  })

  it('counts days until a deadline', () => {
    expect(daysUntil('2026-11-09', today)).toBe(0)
    expect(daysUntil('2026-11-10', today)).toBe(1)
    expect(daysUntil('2026-12-03', today)).toBe(24)
    expect(daysUntil('2026-11-01', today)).toBe(-8)
    expect(daysUntil(null, today)).toBeNull()
  })

  it('formats with a fixed month list', () => {
    expect(formatDate('2026-12-03')).toBe('03 Dec 2026')
    expect(formatDate('2026-09-15')).toBe('15 Sep 2026')
    expect(formatShortDate('2026-11-06', today)).toBe('06 Nov')
    expect(formatShortDate('2027-01-06', today)).toBe('06 Jan 2027')
  })
})
