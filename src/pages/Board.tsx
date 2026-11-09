import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import FilterPanel from '../components/FilterPanel'
import { FilterIcon } from '../components/Icons'
import { ErrorBox, WarningNote } from '../components/Notes'
import OfferCard from '../components/OfferCard'
import { CardSkeleton } from '../components/Skeletons'
import StatsRow from '../components/StatsRow'
import { boardMemory } from '../lib/boardMemory'
import { computeStats } from '../lib/derive'
import {
  activeFilterCount, applyFilters, clearFilters, countryOptions, parseFilters, serializeFilters, sourceOptions, topicOptions,
  type FilterState, type SortKey,
} from '../lib/filters'
import { useMeta } from '../lib/meta'
import { useOffers } from '../lib/offers'
import { useToday } from '../lib/useToday'

const STEP = 50
const SEARCH_DEBOUNCE_MS = 250

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'deadline', label: 'Deadline' },
  { key: 'stipend', label: 'Stipend' },
  { key: 'az', label: 'A to Z' },
]

export default function Board() {
  useMeta(
    'MVA Stages: board',
    'Research internship offers for M2 MVA students, from public postings, the MVA Drive and other students. Filter by topic, country, stipend and April start.',
  )
  const today = useToday()
  const data = useOffers()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const fkey = useMemo(() => serializeFilters({ ...filters, q: filters.q.trim() }).toString(), [filters])

  // Remember the query string for the "All offers" link on offer pages.
  useEffect(() => {
    boardMemory.search = fkey ? `?${fkey}` : ''
  }, [fkey])

  const write = useCallback(
    (next: FilterState) => setParams(serializeFilters(next), { replace: true, preventScrollReset: true }),
    [setParams],
  )
  const update = (patch: Partial<FilterState>) => write({ ...filters, ...patch })

  // Search: typed into local state, written to the URL after a pause.
  const [query, setQuery] = useState(filters.q)
  const lastSent = useRef(filters.q)
  const timer = useRef<number | undefined>(undefined)
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  useEffect(() => {
    if (filters.q !== lastSent.current) {
      lastSent.current = filters.q
      setQuery(filters.q)
    }
  }, [filters.q])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const onQuery = (q: string) => {
    setQuery(q)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      lastSent.current = q
      write({ ...filtersRef.current, q })
    }, SEARCH_DEBOUNCE_MS)
  }
  const onClear = () => {
    window.clearTimeout(timer.current)
    lastSent.current = ''
    setQuery('')
    write(clearFilters(filters))
  }

  const offers = data.offers
  const stats = useMemo(() => (offers ? computeStats(offers, today) : null), [offers, today])
  const countries = useMemo(() => (offers ? countryOptions(offers) : []), [offers])
  const topics = useMemo(() => (offers ? topicOptions(offers) : []), [offers])
  const sources = useMemo(() => (offers ? sourceOptions(offers) : []), [offers])
  const results = useMemo(() => (offers ? applyFilters(offers, filters, today) : []), [offers, filters, today])
  const anyVerified = useMemo(() => offers?.some((o) => o.verified) ?? false, [offers])

  // How many cards are rendered; back to 50 when the filters change.
  const [shown, setShown] = useState(() => (boardMemory.shown.key === fkey ? boardMemory.shown : { key: fkey, n: STEP }))
  const limit = shown.key === fkey ? shown.n : STEP
  useEffect(() => {
    boardMemory.shown = { key: fkey, n: limit }
  }, [fkey, limit])
  const visible = results.slice(0, limit)
  const left = results.length - visible.length

  const [filtersOpen, setFiltersOpen] = useState(false)
  const active = activeFilterCount(filters)

  let body
  if (data.status === 'error') {
    body =
      data.error === 'config' ? (
        <ErrorBox title="The board is not configured.">The site is missing its database settings.</ErrorBox>
      ) : (
        <ErrorBox title="Could not load the offers." onRetry={data.retry}>
          Check your connection and try again.
        </ErrorBox>
      )
  } else if (data.status === 'loading') {
    body = Array.from({ length: 5 }, (_, i) => <CardSkeleton key={i} />)
  } else if (results.length === 0) {
    body = (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-muted">
        {offers?.length === 0 ? (
          <>
            <p className="m-0 mb-3 font-semibold text-ink">The board is empty for now.</p>
            <p className="m-0">
              <Link to="/submit">Add an offer you found</Link>.
            </p>
          </>
        ) : filters.verified && !anyVerified ? (
          <>
            <p className="m-0 mb-3 font-semibold text-ink">No offer is verified yet.</p>
            <p className="m-0">
              Maintainers have not checked any offer against its posting so far. Turn off "Verified only" to see them
              all.
            </p>
          </>
        ) : (
          <>
            <p className="m-0 mb-3 font-semibold text-ink">No offers match these filters.</p>
            <p className="m-0">
              Clear a filter, or <Link to="/submit">add an offer you found</Link>.
            </p>
          </>
        )}
      </div>
    )
  } else {
    body = (
      <>
        {visible.map((o) => (
          <OfferCard key={o.id} offer={o} today={today} />
        ))}
        {left > 0 && (
          <button
            type="button"
            className="btn btn-outline self-center"
            onClick={() => setShown({ key: fkey, n: limit + STEP })}
          >
            Show more offers ({left} left)
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <WarningNote />
      <main id="main" tabIndex={-1} className="mx-auto max-w-board px-6 pt-7 pb-16 outline-none">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 mb-[6px] text-[32px] leading-[1.15] tracking-[-0.02em]">Research internships for the MVA</h1>
            <p className="m-0 text-muted">
              Every offer we found, from every source. Filter by what you need, then go to the original posting.
            </p>
          </div>
          <StatsRow stats={stats} />
        </div>

        <a href="#offers" className="sr-only-focusable btn btn-dark mb-3">
          Skip to offers
        </a>

        <button
          type="button"
          className="btn btn-outline mb-3 w-full filters:hidden"
          aria-expanded={filtersOpen}
          aria-controls="filters"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <FilterIcon />
          {filtersOpen ? 'Hide filters' : 'Filters'}
          {active > 0 ? ` (${active})` : ''}
        </button>

        <div className="flex flex-wrap items-start gap-6">
          <FilterPanel
            id="filters"
            className={filtersOpen ? 'flex' : 'hidden filters:flex'}
            filters={filters}
            query={query}
            onQuery={onQuery}
            onChange={update}
            onClear={onClear}
            countries={countries}
            topics={topics}
            sources={sources}
          />

          <section
            id="offers"
            tabIndex={-1}
            aria-label="Offers"
            aria-busy={data.status === 'loading' || undefined}
            className="flex min-w-0 flex-[999_1_560px] flex-col gap-3 outline-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-muted" aria-live="polite">
                {data.status === 'ready' ? (
                  <>
                    <strong className="text-ink">{results.length}</strong> {results.length === 1 ? 'offer' : 'offers'}
                  </>
                ) : data.status === 'loading' ? (
                  'Loading offers...'
                ) : null}
              </p>
              <div role="group" aria-label="Sort" className="flex gap-1 rounded-md bg-track p-[3px]">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className="seg"
                    aria-pressed={filters.sort === s.key}
                    onClick={() => update({ sort: s.key })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {body}
          </section>
        </div>
      </main>
    </>
  )
}
