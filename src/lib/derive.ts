// Labels and derived values for offers, shared by the board, the offer page and the tests.
import type { Tables } from './database.types'
import { daysUntil, formatDate, formatShortDate } from './dates'

export type Offer = Tables<'offers'>
export type Status = 'open' | 'closed' | 'removed' | 'expected' | 'unknown'
export type Tone = 'ok' | 'warn' | 'info' | 'neutral'

export const SOON_DAYS = 21

const STATUSES: readonly Status[] = ['open', 'closed', 'removed', 'expected', 'unknown']

function asStatus(s: string): Status {
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : 'unknown'
}

/** `open` with a deadline in the past is shown, counted and filtered as `closed`. */
export function effectiveStatus(o: Pick<Offer, 'status' | 'deadline'>, today: number): Status {
  const s = asStatus(o.status)
  if (s === 'open') {
    const d = daysUntil(o.deadline, today)
    if (d !== null && d < 0) return 'closed'
  }
  return s
}

/** Days left when the offer is open and closes within 3 weeks (0 = today), else null. */
export function soonDays(o: Pick<Offer, 'status' | 'deadline'>, today: number): number | null {
  if (effectiveStatus(o, today) !== 'open') return null
  const d = daysUntil(o.deadline, today)
  return d !== null && d >= 0 && d <= SOON_DAYS ? d : null
}

export function isDimmed(status: Status): boolean {
  return status === 'closed' || status === 'removed'
}

export function statusPill(o: Pick<Offer, 'status' | 'deadline'>, today: number): { label: string; tone: Tone } {
  const s = effectiveStatus(o, today)
  const soon = soonDays(o, today)
  if (soon !== null) {
    const label = soon === 0 ? 'Closes today' : soon === 1 ? 'Closes in 1 day' : `Closes in ${soon} days`
    return { label, tone: 'warn' }
  }
  switch (s) {
    case 'open':
      return { label: 'Open', tone: 'ok' }
    case 'expected':
      return { label: 'Expected, not published yet', tone: 'info' }
    case 'closed':
      return { label: 'Closed', tone: 'neutral' }
    case 'removed':
      return { label: 'Posting removed', tone: 'neutral' }
    default:
      return { label: 'Status unknown', tone: 'neutral' }
  }
}

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: 'On site',
  hybrid: 'Hybrid',
  remote: 'Remote',
  unknown: 'Not stated',
}

export const ORG_TYPE_LABELS: Record<string, string> = {
  company: 'Company',
  startup: 'Startup',
  big_tech: 'Big tech',
  academic_lab: 'Academic lab',
  public_agency: 'Public institute',
}

export const APRIL_LABELS: Record<string, string> = {
  yes: 'Can start in April',
  flexible: 'Flexible start, April possible',
  no: 'Does not start in April',
  unknown: 'April start not stated: ask them',
}

export const APPLY_METHOD_LABELS: Record<string, string> = {
  portal: 'Through the posting',
  email: 'By email',
  form: 'Through a form',
  spontaneous: 'Spontaneous application',
}

export const MSC_LABELS: Record<string, string> = {
  yes: 'Open to M2 students',
  no: 'Not open to M2 students',
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  official_posting: 'Official posting',
  lab_website: 'Lab website',
  linkedin: 'LinkedIn',
  aggregator: 'Job board',
  mva_drive: 'MVA Drive',
  mailing_list: 'Mailing list',
  user_submitted: 'Added by a student',
  other: 'Other',
}

const ATS_LABELS: Record<string, string> = { WTTJ: 'Welcome to the Jungle' }

/** `Paris, France · Hybrid`. Work mode only when known; `Location not stated` without city and country. */
export function placeText(o: Pick<Offer, 'city' | 'country' | 'work_mode'>, withMode = true): string {
  const city = o.city?.trim() || null
  const country = o.country?.trim() || null
  const countryPart = country && city && city.toLowerCase().includes(country.toLowerCase()) ? null : country
  const where = [city, countryPart].filter(Boolean).join(', ') || 'Location not stated'
  const mode = withMode && o.work_mode !== 'unknown' ? WORK_MODE_LABELS[o.work_mode] : null
  return mode ? `${where} · ${mode}` : where
}

export function hasPlace(o: Pick<Offer, 'city' | 'country'>): boolean {
  return Boolean(o.city?.trim() || o.country?.trim())
}

/** `duration_text`, else `6 months` / `5 to 6 months` from the numbers, else null. */
export function durationText(o: Pick<Offer, 'duration_text' | 'duration_months_min' | 'duration_months_max'>): string | null {
  if (o.duration_text?.trim()) return o.duration_text.trim()
  const min = o.duration_months_min
  const max = o.duration_months_max
  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) return `${min} to ${max} months`
  const n = (min ?? max) as number
  return n === 1 ? '1 month' : `${n} months`
}

const eur = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** `935 to 1,682 €/month`, `1,800 €/month`, or null when no number is known. */
export function stipendRange(o: Pick<Offer, 'stipend_min_eur_month' | 'stipend_max_eur_month'>): string | null {
  const min = o.stipend_min_eur_month
  const max = o.stipend_max_eur_month
  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) return `${eur.format(min)} to ${eur.format(max)} €/month`
  return `${eur.format((min ?? max) as number)} €/month`
}

export function hasStipend(o: Pick<Offer, 'stipend_min_eur_month'>): boolean {
  return o.stipend_min_eur_month != null
}

/** Card value: the text as written, else the numbers, else `Not stated`. */
export function stipendCardText(o: Offer): string {
  return o.stipend_text?.trim() || stipendRange(o) || 'Not stated'
}

export function deadlineText(o: Pick<Offer, 'deadline'>): string {
  return o.deadline ? formatDate(o.deadline) : 'Rolling or not stated'
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

/** The "via" label on cards. */
export function viaLabel(o: Pick<Offer, 'ats' | 'source_type' | 'source_url' | 'apply_url'>): string {
  if (o.ats?.trim()) return ATS_LABELS[o.ats.trim()] ?? o.ats.trim()
  switch (o.source_type) {
    case 'linkedin':
      return 'LinkedIn'
    case 'mva_drive':
      return 'MVA Drive'
    case 'mailing_list':
      return 'Mailing list'
    case 'user_submitted':
      return 'a student'
  }
  const host = hostOf(o.source_url ?? o.apply_url)
  if (host) return host
  const fallback: Record<string, string> = {
    official_posting: 'official posting',
    lab_website: 'lab website',
    aggregator: 'job board',
  }
  return fallback[o.source_type] ?? 'other source'
}

/** Provenance "Source" value. */
export function sourceLabel(o: Pick<Offer, 'ats' | 'source_type'>): string {
  const base = SOURCE_TYPE_LABELS[o.source_type] ?? 'Other'
  return o.ats?.trim() ? `${base} (${o.ats.trim()})` : base
}

/** The link behind "Open the original posting". */
export function postingUrl(o: Pick<Offer, 'apply_url' | 'source_url'>): string | null {
  return o.apply_url || o.source_url || null
}

/** Badge `Unverified · added by a student`: only student submissions not yet checked. */
export function isUnverifiedSubmission(o: Pick<Offer, 'source_type' | 'verified'>): boolean {
  return o.source_type === 'user_submitted' && !o.verified
}

export type Stats = { open: number; soon: number; paid: number; lastSweep: string }

export function computeStats(offers: Offer[], today: number): Stats {
  let open = 0
  let soon = 0
  let paid = 0
  let last: string | null = null
  for (const o of offers) {
    if (effectiveStatus(o, today) === 'open') open++
    if (soonDays(o, today) !== null) soon++
    if (hasStipend(o)) paid++
    if (o.status_checked && (!last || o.status_checked > last)) last = o.status_checked
  }
  return { open, soon, paid, lastSweep: last ? formatShortDate(last, today) : 'Not yet' }
}

/** Up to 3 other open or expected offers sharing topics (ignoring `other`), soonest deadline first. */
export function similarOffers(offer: Offer, all: Offer[], today: number, max = 3): Offer[] {
  const mine = new Set(offer.topics.filter((t) => t !== 'other'))
  if (mine.size === 0) return []
  const scored: { o: Offer; score: number; days: number }[] = []
  for (const o of all) {
    if (o.id === offer.id) continue
    const s = effectiveStatus(o, today)
    if (s !== 'open' && s !== 'expected') continue
    const score = o.topics.reduce((n, t) => n + (mine.has(t) ? 1 : 0), 0)
    if (score < 1) continue
    scored.push({ o, score, days: daysUntil(o.deadline, today) ?? 9999 })
  }
  scored.sort((a, b) => b.score - a.score || a.days - b.days || a.o.organization.localeCompare(b.o.organization))
  return scored.slice(0, max).map((x) => x.o)
}
