import type { FilterState, Option } from '../lib/filters'

type Props = {
  id: string
  filters: FilterState
  query: string
  onQuery: (q: string) => void
  onChange: (patch: Partial<FilterState>) => void
  onClear: () => void
  countries: Option[]
  topics: Option[]
  className?: string
}

const TOGGLES: { key: 'openOnly' | 'april' | 'paid' | 'verified'; label: string }[] = [
  { key: 'openOnly', label: 'Open or expected only' },
  { key: 'april', label: 'Can start in April' },
  { key: 'paid', label: 'Stipend stated' },
  { key: 'verified', label: 'Verified only' },
]

export default function FilterPanel({ id, filters, query, onQuery, onChange, onClear, countries, topics, className = '' }: Props) {
  // Keep a country from the URL selectable even if no offer has it right now.
  const countryList =
    filters.country && !countries.some((c) => c.value === filters.country)
      ? [...countries, { value: filters.country, label: `${filters.country} (0)`, count: 0 }]
      : countries
  const topicList = [
    ...topics,
    ...filters.topics.filter((t) => !topics.some((o) => o.value === t)).map((t) => ({ value: t, label: t, count: 0 })),
  ]

  const toggleTopic = (t: string) =>
    onChange({ topics: filters.topics.includes(t) ? filters.topics.filter((x) => x !== t) : [...filters.topics, t] })

  return (
    <aside
      id={id}
      aria-label="Filters"
      className={`box-border max-w-full flex-[1_1_260px] flex-col gap-5 rounded-lg border border-line bg-surface p-[18px] ${className}`}
    >
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="q" className="text-[13px] font-semibold">
          Search
        </label>
        <input
          id="q"
          type="search"
          className="field field-sm"
          placeholder="Organization, title, city"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
        <legend className="mb-[6px] text-[13px] font-semibold">Show</legend>
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex min-h-[36px] cursor-pointer items-center gap-[10px]">
            <input
              type="checkbox"
              className="h-[18px] w-[18px] flex-none accent-accent"
              checked={filters[t.key]}
              onChange={() => onChange({ [t.key]: !filters[t.key] })}
            />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-[6px]">
        <label htmlFor="country" className="text-[13px] font-semibold">
          Country
        </label>
        <select
          id="country"
          className="field field-sm"
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
        >
          <option value="">All countries</option>
          {countryList.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-[13px] font-semibold">Topics</legend>
        <div className="flex flex-wrap gap-[6px]">
          {topicList.map((t) => (
            <button
              key={t.value}
              type="button"
              className="chip"
              aria-pressed={filters.topics.includes(t.value)}
              onClick={() => toggleTopic(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onClear}
        className="min-h-[44px] cursor-pointer rounded-sm border border-input-line bg-transparent p-[10px] text-[14px] text-ink hover:bg-paper"
      >
        Clear filters
      </button>
    </aside>
  )
}
