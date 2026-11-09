import { describe, expect, it } from 'vitest'
import {
  computeStats, deadlineText, durationText, effectiveStatus, isUnverifiedSubmission, placeText, postingUrl,
  similarOffers, sourceLabel, statusPill, stipendCardText, stipendRange, viaLabel,
} from './derive'
import { offer } from './fixtures'

const today = Date.UTC(2026, 10, 9)

describe('status', () => {
  it('treats open with a past deadline as closed', () => {
    expect(effectiveStatus(offer({ status: 'open', deadline: '2026-11-08' }), today)).toBe('closed')
    expect(effectiveStatus(offer({ status: 'open', deadline: '2026-11-09' }), today)).toBe('open')
    expect(effectiveStatus(offer({ status: 'expected', deadline: '2026-01-01' }), today)).toBe('expected')
  })

  it('labels the countdown within 21 days', () => {
    expect(statusPill(offer({ deadline: '2026-11-09' }), today)).toEqual({ label: 'Closes today', tone: 'warn' })
    expect(statusPill(offer({ deadline: '2026-11-10' }), today).label).toBe('Closes in 1 day')
    expect(statusPill(offer({ deadline: '2026-11-30' }), today).label).toBe('Closes in 21 days')
    expect(statusPill(offer({ deadline: '2026-12-01' }), today)).toEqual({ label: 'Open', tone: 'ok' })
    expect(statusPill(offer({ status: 'expected', deadline: '2026-11-10' }), today).label).toBe('Expected, not published yet')
    expect(statusPill(offer({ status: 'removed' }), today).label).toBe('Posting removed')
    expect(statusPill(offer({ status: 'unknown' }), today).label).toBe('Status unknown')
    expect(statusPill(offer({ deadline: '2026-10-01' }), today)).toEqual({ label: 'Closed', tone: 'neutral' })
  })
})

describe('card values', () => {
  it('builds the place string', () => {
    expect(placeText(offer({ city: 'Saint-Denis', country: 'France', work_mode: 'onsite' }))).toBe('Saint-Denis, France · On site')
    expect(placeText(offer({ city: 'Paris, France', country: 'France' }))).toBe('Paris, France')
    expect(placeText(offer({ country: 'Germany', work_mode: 'remote' }))).toBe('Germany · Remote')
    expect(placeText(offer({}))).toBe('Location not stated')
  })

  it('derives duration and stipend', () => {
    expect(durationText(offer({ duration_months_min: 5, duration_months_max: 6 }))).toBe('5 to 6 months')
    expect(durationText(offer({ duration_months_min: 6, duration_months_max: 6 }))).toBe('6 months')
    expect(durationText(offer({ duration_text: '5+ months', duration_months_min: 5 }))).toBe('5+ months')
    expect(durationText(offer({}))).toBeNull()
    expect(stipendRange(offer({ stipend_min_eur_month: 935, stipend_max_eur_month: 1682 }))).toBe('935 to 1,682 €/month')
    expect(stipendRange(offer({ stipend_min_eur_month: 1800, stipend_max_eur_month: 1800 }))).toBe('1,800 €/month')
    expect(stipendCardText(offer({ stipend_text: '1,500 €/mo' }))).toBe('1,500 €/mo')
    expect(stipendCardText(offer({ stipend_min_eur_month: 1200 }))).toBe('1,200 €/month')
    expect(stipendCardText(offer({}))).toBe('Not stated')
    expect(deadlineText(offer({}))).toBe('Rolling or not stated')
    expect(deadlineText(offer({ deadline: '2026-12-03' }))).toBe('03 Dec 2026')
  })

  it('labels the source', () => {
    expect(viaLabel(offer({ ats: 'WTTJ' }))).toBe('Welcome to the Jungle')
    expect(viaLabel(offer({ ats: 'Workday' }))).toBe('Workday')
    expect(viaLabel(offer({ source_type: 'linkedin' }))).toBe('LinkedIn')
    expect(viaLabel(offer({ source_type: 'user_submitted' }))).toBe('a student')
    expect(viaLabel(offer({ source_url: 'https://www.jobs.esa.int/x' }))).toBe('jobs.esa.int')
    expect(viaLabel(offer({ source_type: 'lab_website' }))).toBe('lab website')
    expect(sourceLabel(offer({ source_type: 'linkedin', ats: 'Workday' }))).toBe('LinkedIn (Workday)')
    expect(postingUrl(offer({ source_url: 'https://b' }))).toBe('https://b')
    expect(postingUrl(offer({ apply_url: 'https://a', source_url: 'https://b' }))).toBe('https://a')
    expect(postingUrl(offer({}))).toBeNull()
  })

  it('shows the unverified badge only on student submissions', () => {
    expect(isUnverifiedSubmission(offer({ source_type: 'user_submitted' }))).toBe(true)
    expect(isUnverifiedSubmission(offer({ source_type: 'user_submitted', verified: true }))).toBe(false)
    expect(isUnverifiedSubmission(offer({ source_type: 'official_posting' }))).toBe(false)
  })
})

describe('stats and similar offers', () => {
  it('computes stats on effective status', () => {
    const list = [
      offer({ deadline: '2026-11-20', stipend_min_eur_month: 1000, status_checked: '2026-11-06' }),
      offer({ deadline: '2026-11-01', status_checked: '2026-11-08' }),
      offer({ status: 'expected' }),
      offer({}),
    ]
    expect(computeStats(list, today)).toEqual({ open: 2, soon: 1, paid: 1, lastSweep: '08 Nov' })
  })

  it('ranks similar offers by shared topics then deadline', () => {
    const me = offer({ topics: ['llm', 'agents', 'other'] })
    const a = offer({ topics: ['llm'], deadline: '2026-12-01' })
    const b = offer({ topics: ['llm', 'agents'] })
    const c = offer({ topics: ['llm'], deadline: '2026-11-20' })
    const closed = offer({ topics: ['llm', 'agents'], status: 'closed' })
    const onlyOther = offer({ topics: ['other'] })
    const d = offer({ topics: ['agents'] })
    expect(similarOffers(me, [me, a, b, c, closed, onlyOther, d], today).map((o) => o.id)).toEqual([b.id, c.id, a.id])
    expect(similarOffers(offer({ topics: ['other'] }), [a, b], today)).toEqual([])
  })
})
