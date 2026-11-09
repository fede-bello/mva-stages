import type { ReactNode } from 'react'
import { InfoIcon, WarnIcon } from './Icons'

/** Board banner: always visible, literal copy from the design. */
export function WarningNote() {
  return (
    // A labelled landmark so the banner is not orphan content outside every region (axe "region").
    <aside aria-label="Warning" className="border-b border-warn-line bg-warn-bg">
      <div
        role="note"
        className="mx-auto flex max-w-board flex-wrap items-center gap-x-[14px] gap-y-[6px] px-6 py-[10px] text-[14px] text-warn-ink"
      >
        <WarnIcon />
        <span>
          <strong>This information may be wrong or out of date.</strong> It is collected from public postings, the MVA
          Drive and other students. Always check the original posting before applying.
        </span>
      </div>
    </aside>
  )
}

/** Blue info note (Submit privacy notice). */
export function PrivacyNote() {
  return (
    <div role="note" className="flex gap-3 rounded-lg bg-accent-soft px-4 py-[14px] text-[14px] text-accent-strong">
      <InfoIcon />
      <span>
        <strong>Only facts about the offer.</strong> Leave out your own application, interviews, and names or emails of
        recruiters. Use an email only if the posting says to apply there.
      </span>
    </div>
  )
}

/** Warn-palette box for load and send errors. */
export function ErrorBox({ title, children, onRetry }: { title: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-warn-bg px-6 py-5 text-warn-ink">
      <p className="m-0">
        <strong>{title}</strong> {children}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function InlineError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="m-0 rounded-sm bg-warn-bg px-3 py-[10px] text-[14px] text-warn-ink">
      {children}
    </p>
  )
}
