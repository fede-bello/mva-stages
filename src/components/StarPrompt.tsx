import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { trackStarPrompt } from '../lib/analytics'
import { parisToday } from '../lib/dates'
import { REPO_URL } from '../lib/site'
import {
  BACK_FROM_POSTING_DELAY_MS,
  canShow,
  loadState,
  recordDismissed,
  recordDone,
  recordShown,
  recordVisit,
  saveState,
  takePostingJustOpened,
  update,
  visitDelay,
} from '../lib/starPrompt'
import { StarIcon } from './Icons'

// Never over the forms: someone adding an offer or writing to us must not be interrupted.
const quietPaths = ['/submit', '/legal']

/** A centered dialog asking for a GitHub star. When and how often: see lib/starPrompt. */
export default function StarPrompt() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const counted = useRef(false)
  // Delays count from when the site was opened, not from each page change.
  const startedAt = useRef(0)

  useEffect(() => {
    if (!counted.current) {
      counted.current = true
      startedAt.current = Date.now()
      update((s) => recordVisit(s, parisToday()))
    }
  }, [])

  useEffect(() => {
    if (open || quietPaths.includes(pathname)) return
    let timer = 0

    const tryShow = () => {
      if (document.visibilityState !== 'visible') return
      const today = parisToday()
      const s = loadState()
      if (!s || !canShow(s, today)) return
      saveState(recordShown(s, today))
      setOpen(true)
      trackStarPrompt('shown')
    }

    const schedule = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(tryShow, ms)
    }

    const afterVisitDelay = () => {
      const s = loadState()
      if (s) schedule(Math.max(1500, visitDelay(s) - (Date.now() - startedAt.current)))
    }
    afterVisitDelay()

    // Back from the posting they opened, or back to a tab that was hidden when the timer ran out.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (takePostingJustOpened()) schedule(BACK_FROM_POSTING_DELAY_MS)
      else afterVisitDelay()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname, open])

  useEffect(() => {
    const d = dialog.current
    if (open && d && !d.open) {
      d.showModal()
      // Focus the dialog, not the star link, so it opens without a focus ring on a button.
      d.focus()
    }
  }, [open])

  if (!open) return null

  const close = (answer: 'dismissed' | 'starred' | 'never') => {
    update(answer === 'dismissed' ? recordDismissed : recordDone)
    dialog.current?.close()
    setOpen(false)
    trackStarPrompt(answer)
  }

  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      aria-labelledby="star-prompt-title"
      aria-describedby="star-prompt-body"
      className="star-prompt m-auto w-[calc(100%-32px)] max-w-[400px] rounded-lg border border-line bg-surface p-0 text-ink shadow-[0_24px_64px_rgba(22,24,29,0.28)]"
      onCancel={(e) => {
        e.preventDefault()
        close('dismissed')
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === e.currentTarget) close('dismissed')
      }}
    >
      <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <StarIcon size={28} />
        </span>
        <h2 id="star-prompt-title" className="m-0 mt-4 text-[22px] leading-[1.25] tracking-[-0.01em]">
          Finding this board useful?
        </h2>
        <p id="star-prompt-body" className="m-0 mt-2 text-[16px] text-ink-2">
          A star on GitHub helps me with my own interviews :)
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-dark mt-6 w-full"
          onClick={() => close('starred')}
        >
          <StarIcon size={16} />
          Star on GitHub
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <button type="button" className="btn btn-outline mt-2 w-full" onClick={() => close('dismissed')}>
          Not now
        </button>
        <button
          type="button"
          onClick={() => close('never')}
          className="mt-3 min-h-[32px] cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted underline underline-offset-2 hover:text-ink"
        >
          Don't ask again
        </button>
      </div>
    </dialog>
  )
}
