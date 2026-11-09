// Calendar dates for the board. Every date column is a plain `YYYY-MM-DD` string; we compare them
// as UTC midnights so a countdown never shifts with the viewer's time zone. "Today" is the current
// calendar date in Paris, where the program and most offers are.

export const MS_DAY = 86_400_000

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** UTC midnight timestamp of an ISO date, or null when the string is not a valid date. */
export function isoToUtc(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = ISO_RE.exec(iso.slice(0, 10))
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = Date.UTC(y, mo - 1, d)
  const back = new Date(t)
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null
  return t
}

const parisParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's calendar date in Europe/Paris, as a UTC midnight timestamp. */
export function parisToday(now: Date = new Date()): number {
  const parts = parisParts.formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'))
}

/** Whole days from `today` to `iso` (0 = today, negative = past), or null without a date. */
export function daysUntil(iso: string | null | undefined, today: number): number | null {
  const t = isoToUtc(iso)
  if (t === null) return null
  return Math.round((t - today) / MS_DAY)
}

/** `03 Dec 2026`, with a fixed month list (ICU renders September as `Sept` in en-GB). */
export function formatDate(iso: string | null | undefined): string {
  const t = isoToUtc(iso)
  if (t === null) return ''
  const d = new Date(t)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** `03 Dec`, plus the year when it is not the current year in Paris. */
export function formatShortDate(iso: string | null | undefined, today: number): string {
  const t = isoToUtc(iso)
  if (t === null) return ''
  const d = new Date(t)
  const base = `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]}`
  return d.getUTCFullYear() === new Date(today).getUTCFullYear() ? base : `${base} ${d.getUTCFullYear()}`
}
