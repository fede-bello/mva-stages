import { memo } from 'react'
import { Link } from 'react-router'
import {
  deadlineText, durationText, effectiveStatus, hasStipend, isDimmed, isUnverifiedSubmission, placeText, soonDays,
  statusPill, stipendCardText, viaLabel, type Offer,
} from '../lib/derive'
import { StatusPill, TopicTag, UnverifiedBadge } from './OfferBits'

function OfferCard({ offer: o, today }: { offer: Offer; today: number }) {
  const status = effectiveStatus(o, today)
  const dim = isDimmed(status)
  const pill = statusPill(o, today)
  const soon = soonDays(o, today) !== null
  const duration = durationText(o)
  const paid = hasStipend(o)

  return (
    <article
      className={`offer-card @container rounded-lg border border-line px-5 py-[18px] ${dim ? 'bg-paper' : 'bg-surface'}`}
    >
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="wrap-anywhere font-mono text-[12px] font-medium tracking-label text-ink-2 uppercase">
              {o.organization}
            </span>
            {o.reference && <span className="wrap-anywhere font-mono text-[12px] text-muted">{o.reference}</span>}
            {isUnverifiedSubmission(o) && <UnverifiedBadge />}
          </div>
          <h2 className="m-0 text-[18px] leading-[1.3] font-semibold wrap-anywhere">
            <Link
              to={`/offer/${encodeURIComponent(o.slug)}`}
              state={{ fromBoard: true }}
              className={`no-underline hover:underline ${dim ? 'text-ink-2 hover:text-ink' : 'text-ink hover:text-ink'}`}
            >
              {o.title}
            </Link>
          </h2>
          <p className="m-0 flex flex-wrap gap-x-[14px] gap-y-1 text-[14px] text-ink-2">
            <span className="wrap-anywhere">{placeText(o)}</span>
            {duration && <span>{duration}</span>}
            <span className="wrap-anywhere">Start: {o.start_text?.trim() || 'Not stated'}</span>
          </p>
          <div className="flex flex-wrap items-center gap-[6px]">
            {o.topics.map((t) => (
              <TopicTag key={t} topic={t} />
            ))}
            <span className="pl-1 text-[12px] text-muted">
              via <span className="text-ink-2">{viaLabel(o)}</span>
            </span>
          </div>
        </div>
        <div className="grid flex-[1_1_180px] grid-cols-2 items-start gap-2 @min-[584px]:flex @min-[584px]:flex-col">
          <span className="col-span-2">
            <StatusPill {...pill} />
          </span>
          <div className="min-w-0">
            <div className="label-mono">Stipend</div>
            <div className={`wrap-anywhere ${paid ? 'text-[15px] font-semibold' : 'text-[14px] text-muted'}`}>{stipendCardText(o)}</div>
          </div>
          <div className="min-w-0">
            <div className="label-mono">Deadline</div>
            <div
              className={
                soon ? 'text-[15px] font-semibold text-urgent' : o.deadline ? 'text-[15px]' : 'text-[14px] text-muted'
              }
            >
              {deadlineText(o)}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default memo(OfferCard)
