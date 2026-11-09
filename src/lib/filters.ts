// Board filters: state <-> query string, predicates, sorting, country and topic lists.
import { daysUntil } from './dates'
import { effectiveStatus, hasStipend, type Offer, type Status } from './derive'
import { TOPICS } from './validate'

export type SortKey = 'deadline' | 'stipend' | 'az'

export type FilterState = {
  q: string
  topics: string[]
  country: string // '' = all countries
  openOnly: boolean
  april: boolean
  paid: boolean
  verified: boolean
  sort: SortKey
}

export const DEFAULT_FILTERS: FilterState = {
  q: '',
  topics: [],
  country: '',
  openOnly: true,
  april: false,
  paid: false,
  verified: false,
  sort: 'deadline',
}

const SORTS: readonly SortKey[] = ['deadline', 'stipend', 'az']

export function parseFilters(params: URLSearchParams): FilterState {
  const sort = params.get('sort') as SortKey | null
  const topics = (params.get('topics') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t, i, arr) => t && (TOPICS as readonly string[]).includes(t) && arr.indexOf(t) === i)
  return {
    q: params.get('q') ?? '',
    topics,
    country: params.get('country') ?? '',
    openOnly: params.get('open') !== '0',
    april: params.get('april') === '1',
    paid: params.get('paid') === '1',
    verified: params.get('verified') === '1',
    sort: sort && SORTS.includes(sort) ? sort : 'deadline',
  }
}

/** Only non-default values are written, in a fixed order, so equal states give equal URLs. */
export function serializeFilters(s: FilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (s.q.trim()) p.set('q', s.q)
  if (s.topics.length) p.set('topics', s.topics.join(','))
  if (s.country) p.set('country', s.country)
  if (!s.openOnly) p.set('open', '0')
  if (s.april) p.set('april', '1')
  if (s.paid) p.set('paid', '1')
  if (s.verified) p.set('verified', '1')
  if (s.sort !== 'deadline') p.set('sort', s.sort)
  return p
}

/** Clear filters resets everything except the sort. */
export function clearFilters(s: FilterState): FilterState {
  return { ...DEFAULT_FILTERS, sort: s.sort }
}

/** How many filters differ from the defaults (sort is not a filter). */
export function activeFilterCount(s: FilterState): number {
  return (
    (s.q.trim() ? 1 : 0) +
    s.topics.length +
    (s.country ? 1 : 0) +
    (s.openOnly ? 0 : 1) +
    (s.april ? 1 : 0) +
    (s.paid ? 1 : 0) +
    (s.verified ? 1 : 0)
  )
}

/** Lowercase, accents removed, punctuation collapsed to spaces: `Île-de-France` -> `ile de france`. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const COUNTRY_ALIASES: Record<string, string> = { USA: 'United States', US: 'United States', UK: 'United Kingdom' }

/** `Germany or France (remote)` -> [`Germany`, `France`]. `Multiple (EMEA)` gives nothing. */
export function atomicCountries(country: string | null | undefined): string[] {
  if (!country) return []
  const out: string[] = []
  for (const raw of country.replace(/\([^)]*\)/g, ' ').split(/,|\bor\b|\/|;/i)) {
    const c = raw.replace(/\s+/g, ' ').trim()
    if (!c || /^multiple$/i.test(c)) continue
    const name = COUNTRY_ALIASES[c] ?? c
    if (!out.includes(name)) out.push(name)
  }
  return out
}

export type Option = { value: string; label: string; count: number }

export function countryOptions(offers: Offer[]): Option[] {
  const counts = new Map<string, number>()
  for (const o of offers) for (const c of atomicCountries(o.country)) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
    .map(([value, count]) => ({ value, label: `${value} (${count})`, count }))
}

/** Every topic present in the data, by count, `other` last. */
export function topicOptions(offers: Offer[]): Option[] {
  const counts = new Map<string, number>()
  for (const o of offers) for (const t of o.topics) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => (a[0] === 'other' ? 1 : 0) - (b[0] === 'other' ? 1 : 0) || b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: value, count }))
}

const searchCache = new WeakMap<Offer, string>()

function searchText(o: Offer): string {
  let t = searchCache.get(o)
  if (t === undefined) {
    t = ` ${fold([o.organization, o.title, o.title_en, o.city, o.country].filter(Boolean).join(' '))} `
    searchCache.set(o, t)
  }
  return t
}

export function matches(o: Offer, s: FilterState, today: number): boolean {
  if (s.openOnly) {
    const st = effectiveStatus(o, today)
    if (st !== 'open' && st !== 'expected') return false
  }
  if (s.april && o.april_start !== 'yes' && o.april_start !== 'flexible') return false
  if (s.paid && !hasStipend(o)) return false
  if (s.verified && !o.verified) return false
  if (s.country && !atomicCountries(o.country).includes(s.country)) return false
  if (s.topics.length && !s.topics.some((t) => o.topics.includes(t))) return false
  const q = fold(s.q)
  if (q && !searchText(o).includes(q)) return false
  return true
}

const RANK: Record<Status, number> = { open: 0, expected: 1, unknown: 2, closed: 3, removed: 4 }

const byOrg = (a: Offer, b: Offer) =>
  a.organization.localeCompare(b.organization, 'en', { sensitivity: 'base' }) ||
  a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })

export function sortOffers(list: Offer[], sort: SortKey, today: number): Offer[] {
  const days = (o: Offer) => daysUntil(o.deadline, today) ?? 9999
  const byDeadline = (a: Offer, b: Offer) =>
    RANK[effectiveStatus(a, today)] - RANK[effectiveStatus(b, today)] || days(a) - days(b) || byOrg(a, b)
  const stipend = (o: Offer) => o.stipend_max_eur_month ?? o.stipend_min_eur_month ?? -1
  const cmp =
    sort === 'az' ? byOrg : sort === 'stipend' ? (a: Offer, b: Offer) => stipend(b) - stipend(a) || byDeadline(a, b) : byDeadline
  return [...list].sort(cmp)
}

export function applyFilters(offers: Offer[], s: FilterState, today: number): Offer[] {
  return sortOffers(
    offers.filter((o) => matches(o, s, today)),
    s.sort,
    today,
  )
}
