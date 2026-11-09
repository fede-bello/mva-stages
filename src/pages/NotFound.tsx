import { Link } from 'react-router'
import { useMeta } from '../lib/meta'

export default function NotFound({ kind = 'page' }: { kind?: 'page' | 'offer' }) {
  const offer = kind === 'offer'
  useMeta(
    offer ? 'MVA Stages: offer not found' : 'MVA Stages: page not found',
    offer ? 'This offer is not on the MVA Stages board.' : 'This page does not exist on MVA Stages.',
    { noindex: true },
  )
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-board px-6 pt-8 pb-16 outline-none">
      <div className="flex max-w-[640px] flex-col items-start gap-3 rounded-lg border border-line bg-surface p-7 max-[480px]:p-5">
        <h1 className="m-0 text-[clamp(24px,6vw,30px)] leading-[1.2] tracking-[-0.015em]">
          {offer ? 'This offer is not on the board' : 'This page does not exist'}
        </h1>
        <p className="m-0 text-muted">
          {offer ? 'It may have been removed, or the link is wrong.' : 'The link may be wrong or out of date.'}
        </p>
        <Link to="/" className="btn btn-primary mt-2">
          All offers
        </Link>
      </div>
    </main>
  )
}
