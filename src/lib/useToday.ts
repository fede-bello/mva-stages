import { useEffect, useState } from 'react'
import { parisToday } from './dates'

/** Today's Paris date; refreshed when the tab becomes visible again (a board left open overnight). */
export function useToday(): number {
  const [today, setToday] = useState(() => parisToday())
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setToday(parisToday())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  return today
}
