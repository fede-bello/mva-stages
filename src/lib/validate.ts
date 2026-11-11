// Client validation. Mirrors the checks in supabase/migrations/*.sql so the user sees a clear
// message before the database refuses the row. The database stays the real guard.
import type { TablesInsert } from './database.types'

/** Same list and order as the `topics` check in the latest topics migration. */
export const TOPICS = [
  'computer-vision', '3d-vision', 'llm', 'agents', 'nlp', 'rl', 'time-series',
  'foundation-models', 'generative-models', 'health', 'neuro', 'bio-chem',
  'robotics', 'earth-observation', 'climate-energy', 'physics-sim',
  'speech-audio', 'graphs', 'optimization', 'theory', 'recsys-ir',
  'efficiency', 'trustworthy-ai', 'signal-processing', 'other',
] as const

export const WORK_MODES = ['onsite', 'hybrid', 'remote', 'unknown'] as const
export type WorkMode = (typeof WORK_MODES)[number]

export const REPORT_KINDS = ['closed', 'wrong_info', 'duplicate', 'other'] as const
export type ReportKind = (typeof REPORT_KINDS)[number]

export const CONTACT_KINDS = ['remove', 'correct', 'personal_data', 'other'] as const
export type ContactKind = (typeof CONTACT_KINDS)[number]

/** Column length limits from the migrations. */
export const LIMITS = {
  organization: 200,
  title: 300,
  city: 120,
  country: 80,
  stipend_text: 200,
  start_text: 200,
  duration_text: 120,
  reference: 120,
  url: 2000,
  notes: 2000,
  message: 2000,
  reply_email: 200,
} as const

/** Submit allows 3 topics (the database allows 5). */
export const MAX_SUBMIT_TOPICS = 3

export const MSG = {
  url: 'Paste a link that starts with http:// or https://.',
  urlRequired: 'Paste the link to the posting, or pick "Mailing list" or "MVA Drive" below.',
  drive: 'Drive links cannot be published. Paste the original posting, or pick MVA Drive or Mailing list below and leave the link empty.',
  organization: 'Organization is required.',
  title: 'Title is required.',
  date: 'Use a valid date.',
  personalEmail: 'Remove personal email addresses. Only role addresses like jobs@ are allowed.',
  message: 'Write a message.',
  email: 'Use a valid email address, or leave it empty.',
  tooLong: (n: number) => `Keep it to ${n.toLocaleString('en-US')} characters or fewer.`,
}

/** Same pattern as the `~* '^https?://'` checks. */
export function isHttpUrl(s: string): boolean {
  if (!/^https?:\/\//i.test(s)) return false
  try {
    const u = new URL(s)
    return Boolean(u.hostname)
  } catch {
    return false
  }
}

export function isDriveUrl(s: string): boolean {
  try {
    const host = new URL(s).hostname.toLowerCase()
    return host === 'drive.google.com' || host === 'docs.google.com' || host.endsWith('.drive.google.com')
  } catch {
    return /(?:drive|docs)\.google\.com/i.test(s)
  }
}

// Same regexes as public.has_personal_email() in 20261109130000_contact_and_guards.sql.
const EMAIL_RE = /([A-Za-z0-9_.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+)/g
const ROLE_LOCAL_RE = new RegExp(
  '^(jobs?|careers?|recrut\\w*|recruit\\w*|recruiting|hiring|talents?|rh|hr|stages?|internships?|' +
    'interns?|apply|applications?|candidat\\w*|contact|info|admin|secretariat\\w*|' +
    '[\\w-]*-?recrut\\w*|[\\w-]*-?recruit\\w*|[\\w-]*-?jobs|[\\w-]*-?stages?|[\\w-]*-?internships?|predoc|' +
    'philab|trainees?|[\\w-]*-trainees)$',
)

/** Email addresses in the text whose local part is not a role word (jobs@, recrutement@...). */
export function personalEmails(text: string | null | undefined): string[] {
  if (!text) return []
  const out: string[] = []
  for (const m of text.matchAll(EMAIL_RE)) {
    const local = m[1].split('@')[0].toLowerCase()
    if (!ROLE_LOCAL_RE.test(local)) out.push(m[1])
  }
  return out
}

const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_|trk$|trackingid$|refid$)/i

/** Normalized URL for duplicate checks: lowercase host, no fragment, no tracking params, no trailing slash. */
export function normalizeUrl(s: string): string {
  try {
    const u = new URL(s.trim())
    u.hash = ''
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '')
    for (const k of [...u.searchParams.keys()]) if (TRACKING_PARAM.test(k)) u.searchParams.delete(k)
    u.searchParams.sort()
    let out = `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}${u.search}`
    out = out.replace(/^http:/, 'https:')
    return out
  } catch {
    return s.trim()
  }
}

/** A few raw spellings of a URL, to query the database for exact matches. */
export function urlVariants(s: string): string[] {
  const raw = s.trim()
  const out = new Set<string>([raw, raw.replace(/\/+$/, ''), `${raw.replace(/\/+$/, '')}/`])
  try {
    const u = new URL(raw)
    u.hash = ''
    const noHash = u.toString()
    out.add(noHash)
    out.add(noHash.replace(/\/+$/, ''))
    for (const k of [...u.searchParams.keys()]) if (TRACKING_PARAM.test(k)) u.searchParams.delete(k)
    out.add(u.toString())
    out.add(u.toString().replace(/\/+$/, ''))
  } catch {
    // not a URL: the raw spellings are enough
  }
  return [...out].filter(Boolean)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function validDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export const FOUND_ON = [
  { value: 'website', label: 'Company or lab website', note: 'the company or lab website' },
  { value: 'mva_drive', label: 'MVA Drive', note: 'the MVA Drive' },
  { value: 'linkedin', label: 'LinkedIn', note: 'LinkedIn' },
  { value: 'job_board', label: 'Job board (WTTJ, Indeed, JobTeaser...)', note: 'a job board' },
  { value: 'mailing_list', label: 'Mailing list', note: 'a mailing list' },
] as const
export type FoundOn = (typeof FOUND_ON)[number]['value']

/** Sources where the posting may have no public link (a PDF by mail, a Drive file). */
export function linkOptional(found: FoundOn): boolean {
  return found === 'mailing_list' || found === 'mva_drive'
}

export type SubmitForm = {
  url: string
  organization: string
  title: string
  reference: string
  city: string
  country: string
  stipend: string
  deadline: string
  start: string
  duration: string
  workMode: WorkMode
  topics: string[]
  foundOn: FoundOn
  notes: string
}

export const EMPTY_SUBMIT: SubmitForm = {
  url: '',
  organization: '',
  title: '',
  reference: '',
  city: '',
  country: '',
  stipend: '',
  deadline: '',
  start: '',
  duration: '',
  workMode: 'unknown',
  topics: [],
  foundOn: 'website',
  notes: '',
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>

export function foundOnNote(found: FoundOn): string {
  const f = FOUND_ON.find((x) => x.value === found) ?? FOUND_ON[0]
  return `Found on: ${f.note}.`
}

const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null)

/** Field order for focus on the first error. */
export const SUBMIT_FIELDS = [
  'url', 'organization', 'title', 'reference', 'city', 'country', 'stipend', 'deadline', 'start', 'duration',
  'topics', 'notes',
] as const
export type SubmitField = (typeof SUBMIT_FIELDS)[number]

export function validateSubmit(f: SubmitForm): { errors: FieldErrors<SubmitField>; row: TablesInsert<'offers'> | null } {
  const e: FieldErrors<SubmitField> = {}
  const url = f.url.trim()
  if (!url) {
    if (!linkOptional(f.foundOn)) e.url = MSG.urlRequired
  } else if (!isHttpUrl(url)) e.url = MSG.url
  else if (url.length > LIMITS.url) e.url = MSG.tooLong(LIMITS.url)
  else if (isDriveUrl(url)) e.url = MSG.drive

  const required = (k: 'organization' | 'title', msg: string) => {
    const v = f[k].trim()
    if (!v) e[k] = msg
    else if (v.length > LIMITS[k]) e[k] = MSG.tooLong(LIMITS[k])
  }
  required('organization', MSG.organization)
  required('title', MSG.title)

  const optional: [SubmitField & keyof SubmitForm, number][] = [
    ['reference', LIMITS.reference],
    ['city', LIMITS.city],
    ['country', LIMITS.country],
    ['stipend', LIMITS.stipend_text],
    ['start', LIMITS.start_text],
    ['duration', LIMITS.duration_text],
  ]
  for (const [k, max] of optional) if ((f[k] as string).trim().length > max) e[k] = MSG.tooLong(max)

  if (f.deadline.trim() && !validDate(f.deadline.trim())) e.deadline = MSG.date

  if (f.topics.length > MAX_SUBMIT_TOPICS || f.topics.some((t) => !(TOPICS as readonly string[]).includes(t))) {
    e.topics = `Pick up to ${MAX_SUBMIT_TOPICS} topics.`
  }

  const note = foundOnNote(f.foundOn)
  const notesMax = LIMITS.notes - note.length - 1
  if (f.notes.trim().length > notesMax) e.notes = MSG.tooLong(notesMax)

  // Personal emails, field by field, so the message sits next to the culprit.
  const textFields: SubmitField[] = ['url', 'organization', 'title', 'reference', 'city', 'country', 'stipend', 'start', 'duration', 'notes']
  for (const k of textFields) {
    if (!e[k] && personalEmails(f[k as keyof SubmitForm] as string).length) e[k] = MSG.personalEmail
  }

  if (Object.keys(e).length) return { errors: e, row: null }

  const notes = [note, f.notes.trim()].filter(Boolean).join('\n')
  const row: TablesInsert<'offers'> = {
    organization: f.organization.trim(),
    title: f.title.trim(),
    reference: nullIfEmpty(f.reference),
    city: nullIfEmpty(f.city),
    country: nullIfEmpty(f.country),
    stipend_text: nullIfEmpty(f.stipend),
    deadline: nullIfEmpty(f.deadline),
    start_text: nullIfEmpty(f.start),
    duration_text: nullIfEmpty(f.duration),
    work_mode: f.workMode,
    topics: f.topics,
    notes,
    apply_url: url || null,
    source_url: url || null,
    status: 'open',
  }
  return { errors: {}, row }
}

export type ReportFormState = { kind: ReportKind; message: string }

export function validateReport(r: ReportFormState): { error: string | null; message: string | null } {
  const msg = r.message.trim()
  if (!(REPORT_KINDS as readonly string[]).includes(r.kind)) return { error: 'Pick what is wrong.', message: null }
  if (msg.length > LIMITS.message) return { error: MSG.tooLong(LIMITS.message), message: null }
  return { error: null, message: msg || null }
}

export type ContactForm = { kind: ContactKind; offerUrl: string; message: string; replyEmail: string }
export type ContactField = 'kind' | 'offerUrl' | 'message' | 'replyEmail'

// Same pattern as the reply_email check in the migration.
const REPLY_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validateContact(c: ContactForm): { errors: FieldErrors<ContactField>; row: TablesInsert<'contact_requests'> | null } {
  const e: FieldErrors<ContactField> = {}
  if (!(CONTACT_KINDS as readonly string[]).includes(c.kind)) e.kind = 'Pick what you need.'
  const url = c.offerUrl.trim()
  if (url && !isHttpUrl(url)) e.offerUrl = MSG.url
  else if (url.length > LIMITS.url) e.offerUrl = MSG.tooLong(LIMITS.url)
  const msg = c.message.trim()
  if (!msg) e.message = MSG.message
  else if (msg.length > LIMITS.message) e.message = MSG.tooLong(LIMITS.message)
  const email = c.replyEmail.trim()
  if (email && (email.length > LIMITS.reply_email || !REPLY_EMAIL_RE.test(email))) e.replyEmail = MSG.email
  if (Object.keys(e).length) return { errors: e, row: null }
  return { errors: {}, row: { kind: c.kind, offer_url: url || null, message: msg, reply_email: email || null } }
}
