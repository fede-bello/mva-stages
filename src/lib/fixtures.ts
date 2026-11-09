// Test helper: a full offers row with defaults, overridable per test.
import type { Offer } from './derive'

let n = 0

export function offer(p: Partial<Offer> = {}): Offer {
  n++
  return {
    id: `id-${n}`,
    slug: `slug-${n}`,
    organization: 'Org',
    title: 'Title',
    title_en: null,
    org_type: null,
    city: null,
    country: null,
    work_mode: 'unknown',
    topics: [],
    stipend_text: null,
    stipend_min_eur_month: null,
    stipend_max_eur_month: null,
    start_text: null,
    april_start: 'unknown',
    duration_text: null,
    duration_months_min: null,
    duration_months_max: null,
    posted_date: null,
    deadline: null,
    status: 'open',
    status_checked: null,
    first_seen: '2026-11-09',
    requirements: null,
    msc_eligible: 'unknown',
    reference: null,
    apply_url: null,
    apply_method: 'unknown',
    ats: null,
    apply_contact: null,
    source_type: 'official_posting',
    source_url: null,
    description: null,
    notes: null,
    verified: false,
    created_at: '2026-11-09T00:00:00Z',
    updated_at: '2026-11-09T00:00:00Z',
    ...p,
  }
}
