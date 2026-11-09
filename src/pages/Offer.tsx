import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ChevronLeft, ExternalIcon } from '../components/Icons'
import { ErrorBox } from '../components/Notes'
import { StatusPill, TopicTag, UnverifiedBadge } from '../components/OfferBits'
import ReportForm from '../components/ReportForm'
import { OfferSkeleton } from '../components/Skeletons'
import { trackOpenPosting } from '../lib/analytics'
import { boardMemory } from '../lib/boardMemory'
import { daysUntil, formatDate, formatShortDate } from '../lib/dates'
import {
  APPLY_METHOD_LABELS, APRIL_LABELS, durationText, effectiveStatus, hasPlace, hasStipend, isUnverifiedSubmission,
  MSC_LABELS, ORG_TYPE_LABELS, placeText, postingUrl, similarOffers, soonDays, sourceLabel, statusPill, stipendRange,
  viaLabel, WORK_MODE_LABELS, type Offer as OfferRow,
} from '../lib/derive'
import { useMeta } from '../lib/meta'
import { fetchReportCount, useOffers } from '../lib/offers'
import { useToday } from '../lib/useToday'
import NotFound from './NotFound'

function BackLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromBoard = Boolean((location.state as { fromBoard?: boolean } | null)?.fromBoard)
  return (
    <Link
      to={`/${boardMemory.search}`}
      onClick={(e) => {
        // Coming from the board: go back in history so the scroll position is restored.
        if (fromBoard && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault()
          navigate(-1)
        }
      }}
      className="inline-flex min-h-[44px] items-center gap-[6px] text-[14px] no-underline hover:underline"
    >
      <ChevronLeft />
      All offers
    </Link>
  )
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-[18px] py-4 shadow-[0_0_0_1px_var(--color-line)]">
      <dt className="label-mono">{label}</dt>
      {children}
    </div>
  )
}

const main = 'm-0 mt-1 wrap-anywhere'
const second = 'm-0 text-[14px] text-muted wrap-anywhere'

function Fields({ o, today }: { o: OfferRow; today: number }) {
  const range = stipendRange(o)
  const stipendText = o.stipend_text?.trim() || null
  const duration = durationText(o)
  const start = [o.start_text?.trim(), duration].filter(Boolean).join(' · ')
  const soon = soonDays(o, today) !== null
  const method = APPLY_METHOD_LABELS[o.apply_method] ?? null
  const howSecondary = o.apply_contact?.trim() || o.ats?.trim() || null
  const msc = MSC_LABELS[o.msc_eligible] ?? null
  const req = o.requirements?.trim() || null

  return (
    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-px overflow-hidden rounded-lg border border-line bg-surface">
      {(hasPlace(o) || o.work_mode !== 'unknown') && (
        <Cell label="Where">
          <dd className={`${main} font-medium`}>{hasPlace(o) ? placeText(o, false) : 'Location not stated'}</dd>
          {o.work_mode !== 'unknown' && <dd className={second}>{WORK_MODE_LABELS[o.work_mode]}</dd>}
        </Cell>
      )}
      <Cell label="Stipend">
        {hasStipend(o) && range ? (
          <>
            <dd className={`${main} text-[18px] font-semibold`}>{range}</dd>
            {stipendText && stipendText !== range && <dd className={second}>{stipendText}</dd>}
          </>
        ) : stipendText ? (
          <dd className={`${main} font-medium`}>{stipendText}</dd>
        ) : (
          <dd className={`${main} text-muted`}>Not stated</dd>
        )}
      </Cell>
      <Cell label="Start and duration">
        <dd className={`${main} ${start ? 'font-medium' : 'text-muted'}`}>{start || 'Not stated'}</dd>
        <dd className={o.april_start === 'unknown' ? 'm-0 text-[14px] font-medium text-urgent' : second}>
          {APRIL_LABELS[o.april_start] ?? APRIL_LABELS.unknown}
        </dd>
      </Cell>
      <Cell label="Deadline">
        {o.deadline ? (
          <dd className={`${main} font-semibold ${soon ? 'text-urgent' : ''}`}>{formatDate(o.deadline)}</dd>
        ) : (
          <dd className={`${main} text-muted`}>Rolling or not stated</dd>
        )}
      </Cell>
      {(method || howSecondary) && (
        <Cell label="How to apply">
          <dd className={`${main} font-medium`}>{method ?? howSecondary}</dd>
          {method && howSecondary && <dd className={second}>{howSecondary}</dd>}
        </Cell>
      )}
      {(msc || req) && (
        <Cell label="Eligibility">
          <dd className={`${main} font-medium`}>{msc ?? req}</dd>
          {msc && req && <dd className={second}>{req}</dd>}
        </Cell>
      )}
      {o.posted_date && (
        <Cell label="Posted">
          <dd className={`${main} font-medium`}>{formatDate(o.posted_date)}</dd>
        </Cell>
      )}
    </dl>
  )
}

function Provenance({ o, reports }: { o: OfferRow; reports: number }) {
  const row = 'flex justify-between gap-3'
  return (
    <section aria-labelledby="prov-h" className="rounded-lg border border-line bg-surface p-5">
      <h2 id="prov-h" className="m-0 mb-3 text-[15px]">
        Where this comes from
      </h2>
      <dl className="m-0 flex flex-col gap-[10px] text-[14px]">
        <div className={row}>
          <dt className="text-muted">Source</dt>
          <dd className="m-0 text-right font-medium wrap-anywhere">{sourceLabel(o)}</dd>
        </div>
        <div className={row}>
          <dt className="text-muted">First seen</dt>
          <dd className="m-0 font-mono">{formatDate(o.first_seen)}</dd>
        </div>
        <div className={row}>
          <dt className="text-muted">Status checked</dt>
          <dd className={`m-0 ${o.status_checked ? 'font-mono' : 'text-muted'}`}>
            {o.status_checked ? formatDate(o.status_checked) : 'Not yet'}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted">Verified</dt>
          {o.verified ? (
            <dd className="m-0 font-medium text-ok-ink">Yes, against the posting</dd>
          ) : (
            <dd className="m-0 text-muted">Not yet</dd>
          )}
        </div>
      </dl>
      {reports > 0 && (
        <p className="m-0 mt-3 text-[13px] text-muted">
          {reports === 1 ? '1 open report from students' : `${reports} open reports from students`}
        </p>
      )}
      <p className="m-0 mt-[14px] rounded-sm bg-warn-bg px-3 py-[10px] text-[13px] text-warn-ink">
        This summary can be wrong or out of date. The original posting is what counts.
      </p>
    </section>
  )
}

function Similar({ list, today }: { list: OfferRow[]; today: number }) {
  if (!list.length) return null
  return (
    <section aria-labelledby="sim-h" className="rounded-lg border border-line bg-surface p-5">
      <h2 id="sim-h" className="m-0 mb-3 text-[15px]">
        Similar offers
      </h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {list.map((s) => {
          const days = daysUntil(s.deadline, today)
          const soon = soonDays(s, today) !== null
          const line =
            s.deadline && days !== null && days >= 0 ? `Closes ${formatShortDate(s.deadline, today)}` : statusPill(s, today).label
          return (
            <li key={s.id}>
              <Link to={`/offer/${encodeURIComponent(s.slug)}`} className="group block no-underline">
                <span className="block font-mono text-[12px] tracking-label text-ink-2 uppercase wrap-anywhere">
                  {s.organization}
                </span>
                <span className="font-medium text-ink wrap-anywhere group-hover:underline">{s.title}</span>
                <span className={`block text-[13px] ${soon ? 'text-urgent' : 'text-muted'}`}>{line}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function OfferView({ o, all, today }: { o: OfferRow; all: OfferRow[]; today: number }) {
  const [reports, setReports] = useState(0)
  useEffect(() => {
    let alive = true
    fetchReportCount(o.id)
      .then((n) => alive && setReports(n))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [o.id])

  const similar = useMemo(() => similarOffers(o, all, today), [o, all, today])
  const url = postingUrl(o)
  const pill = statusPill(o, today)
  const showEn = o.title_en?.trim() && o.title_en.trim().toLowerCase() !== o.title.trim().toLowerCase()
  const status = effectiveStatus(o, today)

  return (
    <div className="mt-2 flex flex-wrap items-start gap-6">
      <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <div className="flex flex-col gap-[14px] rounded-lg border border-line bg-surface p-7 max-[480px]:p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-[13px] font-medium tracking-label text-ink-2 uppercase wrap-anywhere">
              {o.organization}
            </span>
            {o.reference && <span className="font-mono text-[13px] text-muted wrap-anywhere">{o.reference}</span>}
            {o.org_type && ORG_TYPE_LABELS[o.org_type] && (
              <span className="font-mono text-[13px] text-muted">{ORG_TYPE_LABELS[o.org_type]}</span>
            )}
            <StatusPill {...pill} />
            {isUnverifiedSubmission(o) && <UnverifiedBadge />}
          </div>
          <h1 className="m-0 text-[clamp(24px,6vw,30px)] leading-[1.2] tracking-[-0.015em] wrap-anywhere">{o.title}</h1>
          {showEn && <p className="m-0 text-[16px] text-muted wrap-anywhere">{o.title_en}</p>}
          {o.topics.length > 0 && (
            <div className="flex flex-wrap gap-[6px]">
              {o.topics.map((t) => (
                <TopicTag key={t} topic={t} />
              ))}
            </div>
          )}
          <div className="mt-[6px] flex flex-wrap items-center gap-[10px]">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => trackOpenPosting(o.slug, o.country)}
              >
                Open the original posting
                <ExternalIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <p className="m-0 text-muted">No public link. Source: {viaLabel(o)}.</p>
            )}
            <a href="#report" className="btn btn-outline">
              Something is wrong
            </a>
          </div>
          {(status === 'closed' || status === 'removed') && o.status === 'open' && (
            <p className="m-0 text-[14px] text-muted">The deadline has passed.</p>
          )}
          {status === 'removed' && url && (
            <p className="m-0 text-[14px] text-muted">The posting was taken down when we last checked, so the link may no longer work.</p>
          )}
        </div>

        <Fields o={o} today={today} />

        {(o.description?.trim() || o.notes?.trim()) && (
          <section className="rounded-lg border border-line bg-surface px-7 py-6 max-[480px]:px-5">
            <h2 className="m-0 mb-[10px] text-[18px]">About the internship</h2>
            {o.description?.trim() && (
              <p className="m-0 max-w-[70ch] whitespace-pre-line wrap-anywhere [&:not(:last-child)]:mb-3">{o.description}</p>
            )}
            {o.notes?.trim() && (
              <p className="m-0 max-w-[70ch] whitespace-pre-line text-ink-2 wrap-anywhere">
                <strong>Good to know.</strong> {o.notes}
              </p>
            )}
          </section>
        )}

        <ReportForm offerId={o.id} slug={o.slug} />
      </article>

      <aside className="flex max-w-full flex-[1_1_300px] flex-col gap-4">
        <Provenance o={o} reports={reports} />
        <Similar list={similar} today={today} />
      </aside>
    </div>
  )
}

export default function Offer() {
  const { slug = '' } = useParams<{ slug: string }>()
  const data = useOffers()
  const today = useToday()
  const offer = data.offers?.find((o) => o.slug === slug) ?? null
  const notFound = data.status === 'ready' && !offer

  // Parent effects run after the child's, so when the offer is missing this must say the same as
  // NotFound or it would overwrite the "not found" title on in-app navigation.
  useMeta(
    offer
      ? `MVA Stages: ${offer.organization}, ${offer.title}`
      : notFound
        ? 'MVA Stages: offer not found'
        : 'MVA Stages: offer',
    offer
      ? `${offer.title} at ${offer.organization} (${placeText(offer, false)}). Deadline: ${offer.deadline ? formatDate(offer.deadline) : 'rolling or not stated'}. Check the original posting before applying.`
      : notFound
        ? 'This offer is not on the MVA Stages board.'
        : 'A research internship offer on the MVA Stages board.',
  )

  if (notFound) return <NotFound kind="offer" />

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-board px-6 pt-6 pb-16 outline-none">
      <BackLink />
      {data.status === 'error' ? (
        <div className="mt-2">
          {data.error === 'config' ? (
            <ErrorBox title="The board is not configured.">The site is missing its database settings.</ErrorBox>
          ) : (
            <ErrorBox title="Could not load this offer." onRetry={data.retry}>
              Check your connection and try again.
            </ErrorBox>
          )}
        </div>
      ) : data.status === 'loading' || !offer ? (
        <div className="mt-2" aria-busy="true">
          <p className="sr-only" role="status">
            Loading the offer...
          </p>
          <OfferSkeleton />
        </div>
      ) : (
        <OfferView o={offer} all={data.offers} today={today} />
      )}
    </main>
  )
}
