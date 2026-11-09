import { describe, expect, it } from 'vitest'
import {
  activeFilterCount, applyFilters, atomicCountries, clearFilters, countryOptions, DEFAULT_FILTERS, fold,
  parseFilters, serializeFilters, sortOffers, sourceGroup, topicOptions, type FilterState,
} from './filters'
import { offer } from './fixtures'

const today = Date.UTC(2026, 10, 9)
const f = (p: Partial<FilterState>): FilterState => ({ ...DEFAULT_FILTERS, ...p })

describe('query string', () => {
  it('round-trips every filter', () => {
    const s = f({ q: 'Île', topics: ['llm', 'rl'], orgTypes: ['academic_lab', 'startup'], sources: ['employer', 'drive'], country: 'United States', openOnly: false, april: true, paid: true, verified: true, sort: 'stipend' })
    const qs = serializeFilters(s).toString()
    expect(qs).toBe('q=%C3%8Ele&topics=llm%2Crl&org=academic_lab%2Cstartup&source=employer%2Cdrive&country=United+States&open=0&april=1&paid=1&verified=1&sort=stipend')
    expect(parseFilters(new URLSearchParams(qs))).toEqual(s)
  })

  it('writes nothing for the defaults and ignores junk', () => {
    expect(serializeFilters(DEFAULT_FILTERS).toString()).toBe('')
    expect(parseFilters(new URLSearchParams('sort=bogus&topics=llm,nope,llm&open=1'))).toEqual(f({ topics: ['llm'] }))
  })

  it('clears everything but the sort', () => {
    const s = f({ q: 'x', topics: ['llm'], openOnly: false, sort: 'az' })
    expect(clearFilters(s)).toEqual(f({ sort: 'az' }))
    expect(activeFilterCount(s)).toBe(3)
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
  })
})

describe('search and lists', () => {
  it('folds accents, case and punctuation', () => {
    expect(fold('Île-de-France')).toBe('ile de france')
    expect(fold('Saint-Denis')).toBe(fold('saint denis'))
  })

  it('splits messy countries', () => {
    expect(atomicCountries('Germany or France (remote)')).toEqual(['Germany', 'France'])
    expect(atomicCountries('Italy, Belgium, Germany, Netherlands or Spain')).toEqual(['Italy', 'Belgium', 'Germany', 'Netherlands', 'Spain'])
    expect(atomicCountries('USA')).toEqual(['United States'])
    expect(atomicCountries('Multiple (EMEA)')).toEqual([])
    expect(atomicCountries(null)).toEqual([])
  })

  it('lists countries and topics by count', () => {
    const list = [
      offer({ country: 'France', topics: ['other', 'llm'] }),
      offer({ country: 'France or United Kingdom', topics: ['other'] }),
      offer({ country: 'USA', topics: ['rl', 'llm'] }),
      offer({ country: 'United States', topics: ['other'] }),
    ]
    expect(countryOptions(list).map((c) => c.label)).toEqual(['France (2)', 'United States (2)', 'United Kingdom (1)'])
    expect(topicOptions(list).map((t) => t.value)).toEqual(['llm', 'rl', 'other'])
  })
})

describe('organization and source filters', () => {
  it('keeps a canonical order and drops unknown types from the URL', () => {
    expect(parseFilters(new URLSearchParams('org=startup,nope,academic_lab')).orgTypes).toEqual(['academic_lab', 'startup'])
  })

  it('groups source types and drops unknown keys from the URL', () => {
    expect(sourceGroup('lab_website')).toBe('employer')
    expect(sourceGroup('linkedin')).toBe('board')
    expect(sourceGroup('mva_drive')).toBe('drive')
    expect(parseFilters(new URLSearchParams('source=drive,nope,employer')).sources).toEqual(['employer', 'drive'])
  })

  it('filters by organization type (OR) and by source group (OR)', () => {
    const lab = offer({ slug: 'lab', org_type: 'academic_lab', source_type: 'mva_drive', status: 'open' })
    const co = offer({ slug: 'co', org_type: 'company', source_type: 'official_posting', status: 'open' })
    const none = offer({ slug: 'none', org_type: null, source_type: 'other', status: 'open' })
    const slugs = (p: Partial<FilterState>) => applyFilters([lab, co, none], f(p), today).map((o) => o.slug).sort()
    expect(slugs({ orgTypes: ['academic_lab'] })).toEqual(['lab'])
    expect(slugs({ orgTypes: ['academic_lab', 'company'] })).toEqual(['co', 'lab'])
    expect(slugs({ sources: ['drive'] })).toEqual(['lab'])
    expect(slugs({ sources: ['drive', 'employer'] })).toEqual(['co', 'lab'])
    expect(activeFilterCount(f({ orgTypes: ['company', 'startup'], sources: ['drive'] }))).toBe(3)
  })
})

describe('filtering and sorting', () => {
  const a = offer({ organization: 'Alpha', city: 'Saint-Denis', country: 'France', topics: ['llm'], deadline: '2026-12-01', stipend_min_eur_month: 1000, stipend_max_eur_month: 1500, april_start: 'yes' })
  const b = offer({ organization: 'beta', title_en: 'Foundation models', country: 'USA', topics: ['rl'], deadline: '2026-11-20', status: 'open' })
  const c = offer({ organization: 'Gamma', status: 'expected', country: 'Germany or France', topics: ['llm', 'rl'], april_start: 'flexible', verified: true })
  const past = offer({ organization: 'Delta', deadline: '2026-11-01', stipend_min_eur_month: 3000 })
  const removed = offer({ organization: 'Epsilon', status: 'removed' })
  const all = [a, b, c, past, removed]
  const ids = (l: { id: string }[]) => l.map((o) => o.id)

  it('defaults to open or expected, past deadlines excluded', () => {
    expect(ids(applyFilters(all, DEFAULT_FILTERS, today))).toEqual([b.id, a.id, c.id])
    expect(ids(applyFilters(all, f({ openOnly: false }), today))).toEqual([b.id, a.id, c.id, past.id, removed.id])
  })

  it('applies each filter', () => {
    expect(ids(applyFilters(all, f({ q: 'saint denis' }), today))).toEqual([a.id])
    expect(ids(applyFilters(all, f({ q: 'FOUNDATION' }), today))).toEqual([b.id])
    expect(ids(applyFilters(all, f({ april: true }), today))).toEqual([a.id, c.id])
    expect(ids(applyFilters(all, f({ paid: true }), today))).toEqual([a.id])
    expect(ids(applyFilters(all, f({ verified: true }), today))).toEqual([c.id])
    expect(ids(applyFilters(all, f({ country: 'United States' }), today))).toEqual([b.id])
    expect(ids(applyFilters(all, f({ country: 'France' }), today))).toEqual([a.id, c.id])
    expect(ids(applyFilters(all, f({ topics: ['rl'] }), today))).toEqual([b.id, c.id])
    expect(ids(applyFilters(all, f({ topics: ['rl'], country: 'France' }), today))).toEqual([c.id])
  })

  it('sorts by stipend and A to Z with stable ties', () => {
    expect(ids(sortOffers(all, 'stipend', today))).toEqual([past.id, a.id, b.id, c.id, removed.id])
    expect(ids(sortOffers(all, 'az', today))).toEqual([a.id, b.id, past.id, removed.id, c.id])
  })
})
