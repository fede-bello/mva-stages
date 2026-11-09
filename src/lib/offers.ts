// Data access. All offers are fetched once per visit and kept in module scope; the board filters them
// in memory. Inserts into offer_reports and contact_requests never chain .select(): the publishable
// key may insert there but not read.
import { useEffect, useSyncExternalStore } from 'react'
import type { TablesInsert } from './database.types'
import type { Offer } from './derive'
import { client, isConfigured, NotConfiguredError } from './supabase'
import { normalizeUrl, urlVariants, type ContactKind, type ReportKind } from './validate'

export type OffersState =
  | { status: 'loading'; offers: null; error: null }
  | { status: 'ready'; offers: Offer[]; error: null }
  | { status: 'error'; offers: null; error: 'network' | 'config' }

const PAGE = 1000

let state: OffersState = isConfigured
  ? { status: 'loading', offers: null, error: null }
  : { status: 'error', offers: null, error: 'config' }
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: OffersState) {
  state = next
  for (const l of listeners) l()
}

async function fetchAll(): Promise<Offer[]> {
  const db = client()
  const { data, error, count } = await db
    .from('offers')
    .select('*', { count: 'exact' })
    .order('organization')
    .order('slug')
    .range(0, PAGE - 1)
  if (error) throw error
  const rows = [...(data ?? [])]
  if (count !== null && count > rows.length) {
    console.warn(`offers: got ${rows.length} of ${count} rows in the first page, fetching the rest`)
    for (let from = rows.length; from < count; from += PAGE) {
      const page = await db.from('offers').select('*').order('organization').order('slug').range(from, from + PAGE - 1)
      if (page.error) throw page.error
      if (!page.data?.length) break
      rows.push(...page.data)
    }
  }
  return rows
}

/** Starts the fetch if needed. Safe to call many times. */
export function loadOffers(force = false): Promise<void> {
  if (!isConfigured) return Promise.resolve()
  if (inflight && !force) return inflight
  if (state.status === 'ready' && !force) return Promise.resolve()
  if (state.status === 'error') set({ status: 'loading', offers: null, error: null })
  inflight = fetchAll()
    .then((offers) => set({ status: 'ready', offers, error: null }))
    .catch((err: unknown) => {
      console.error('offers: could not load', err)
      set({ status: 'error', offers: null, error: err instanceof NotConfiguredError ? 'config' : 'network' })
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const getSnapshot = () => state

export function useOffers(): OffersState & { retry: () => void } {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  useEffect(() => {
    void loadOffers()
  }, [])
  return { ...s, retry: () => void loadOffers(true) }
}

/** Open report counts for one offer (the view never exposes messages). */
export async function fetchReportCount(offerId: string): Promise<number> {
  const { data, error } = await client().from('offer_report_counts').select('open_reports').eq('offer_id', offerId).maybeSingle()
  if (error) throw error
  return data?.open_reports ?? 0
}

export type Duplicate = { slug: string; organization: string; title: string }

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/** An offer already on the board with the same link, or the same organization and reference. */
export async function findDuplicate(row: { url: string; organization: string; reference: string }, known: Offer[] | null): Promise<Duplicate | null> {
  const url = row.url.trim()
  const org = row.organization.trim()
  const ref = row.reference.trim()

  // In memory first: catches spelling differences (tracking params, trailing slash, www).
  if (known) {
    const target = url ? normalizeUrl(url) : null
    const hit = known.find(
      (o) =>
        (target && [o.apply_url, o.source_url].some((u) => u && normalizeUrl(u) === target)) ||
        (ref && o.reference && o.reference.trim().toLowerCase() === ref.toLowerCase() && o.organization.trim().toLowerCase() === org.toLowerCase()),
    )
    if (hit) return hit
  }

  // Then against the database, in case the board was loaded before someone else added it.
  const db = client()
  const queries = []
  if (url) {
    const variants = urlVariants(url)
    queries.push(db.from('offers').select('slug, organization, title').in('apply_url', variants).limit(1))
    queries.push(db.from('offers').select('slug, organization, title').in('source_url', variants).limit(1))
  }
  if (ref && org) {
    queries.push(
      db.from('offers').select('slug, organization, title').ilike('organization', escapeLike(org)).ilike('reference', escapeLike(ref)).limit(1),
    )
  }
  const results = await Promise.all(queries)
  for (const r of results) {
    if (r.error) throw r.error
    if (r.data?.length) return r.data[0]
  }
  return null
}

export class PersonalEmailError extends Error {
  constructor() {
    super('personal email')
    this.name = 'PersonalEmailError'
  }
}

/** Inserts a student submission. The database trigger sets the slug, so we read it back. */
export async function insertOffer(row: TablesInsert<'offers'>): Promise<string> {
  const { data, error } = await client().from('offers').insert(row).select('slug').single()
  if (error) {
    if (error.code === '22023') throw new PersonalEmailError()
    throw error
  }
  void loadOffers(true)
  return data.slug
}

export async function reportOffer(offerId: string, kind: ReportKind, message: string | null): Promise<void> {
  const { error } = await client().from('offer_reports').insert({ offer_id: offerId, kind, message })
  if (error) throw error
}

export async function sendContact(row: TablesInsert<'contact_requests'> & { kind: ContactKind }): Promise<void> {
  const { error } = await client().from('contact_requests').insert(row)
  if (error) throw error
}
