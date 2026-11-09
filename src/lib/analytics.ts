// Custom events: at most 2 properties, only slug, topic, country or kind. Never free text or
// anything about the visitor. (Not collected on the Vercel Hobby plan; page views still are.)
import { track } from '@vercel/analytics/react'

const clip = (s: string | null | undefined) => (s ? s.slice(0, 255) : null)

export function trackOpenPosting(slug: string, country: string | null) {
  track('open_posting', { slug: clip(slug), country: clip(country) })
}

export function trackOfferAdded(topic: string | null, country: string | null) {
  track('offer_added', { topic: clip(topic), country: clip(country) })
}

export function trackReportSent(slug: string, kind: string) {
  track('report_sent', { slug: clip(slug), kind: clip(kind) })
}
