import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { trackStarPrompt } from '../lib/analytics'
import { parisToday } from '../lib/dates'
import { REPO_URL } from '../lib/site'
import { loadState, recordDismissed, recordShown, recordStarred, recordVisit, saveState, shouldShow, update } from '../lib/starPrompt'
import { StarIcon } from './Icons'

// Waits a bit after a page opens, so it never greets someone mid-search.
const DELAY_MS = 8000

// Never over the forms: someone adding an offer or writing to us must not be interrupted.
const quietPaths = ['/submit', '/legal']

/** A small, non-modal card asking returning visitors for a GitHub star. Does not take focus. */
export default function StarPrompt() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const counted = useRef(false)

  useEffect(() => {
    if (!counted.current) {
      counted.current = true
      update((s) => recordVisit(s, parisToday()))
    }
  }, [])

  useEffect(() => {
    if (open || quietPaths.includes(pathname)) return
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      const today = parisToday()
      const s = loadState()
      if (!s || !shouldShow(s, today)) return
      saveState(recordShown(s, today))
      setOpen(true)
      trackStarPrompt('shown')
    }, DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pathname, open])

  if (!open) return null

  const dismiss = () => {
    update(recordDismissed)
    setOpen(false)
    trackStarPrompt('dismissed')
  }

  const star = () => {
    update(recordStarred)
    setOpen(false)
    trackStarPrompt('starred')
  }

  return (
    <aside
      aria-labelledby="star-prompt-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') dismiss()
      }}
      className="star-prompt fixed right-4 bottom-4 left-4 z-20 rounded-lg border border-line bg-surface p-5 text-ink shadow-[0_12px_32px_rgba(22,24,29,0.16),0_2px_6px_rgba(22,24,29,0.08)] min-[520px]:left-auto min-[520px]:w-[360px] min-[520px]:right-6 min-[520px]:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-[2px] flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-soft text-accent">
          <StarIcon size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="star-prompt-title" className="m-0 text-[16px] leading-[1.35]">
            Finding this board useful?
          </h2>
          <p className="m-0 mt-1 text-[14px] text-ink-2">
            A star on GitHub helps the next MVA students find it, and tells us it is worth keeping up to date.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-dark flex-1" onClick={star}>
          <StarIcon size={16} />
          Star on GitHub
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <button type="button" className="btn btn-outline" onClick={dismiss}>
          Not now
        </button>
      </div>
    </aside>
  )
}
