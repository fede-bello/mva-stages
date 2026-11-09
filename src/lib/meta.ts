// Per-route <title>, description and robots. Updates the tags that index.html already ships
// instead of adding duplicates.
import { useEffect } from 'react'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export function useMeta(title: string, description: string, opts: { noindex?: boolean } = {}) {
  const { noindex = false } = opts
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  }, [title, description])

  useEffect(() => {
    if (!noindex) return
    const el = document.createElement('meta')
    el.name = 'robots'
    el.content = 'noindex'
    document.head.appendChild(el)
    return () => el.remove()
  }, [noindex])
}
