import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ChoiceGroup, Field, FieldError } from '../components/FormBits'
import { InlineError, PrivacyNote } from '../components/Notes'
import { trackOfferAdded } from '../lib/analytics'
import { atomicCountries, countryOptions } from '../lib/filters'
import { useMeta } from '../lib/meta'
import { findDuplicate, insertOffer, PersonalEmailError, useOffers, type Duplicate } from '../lib/offers'
import {
  EMPTY_SUBMIT, FOUND_ON, LIMITS, linkOptional, MAX_SUBMIT_TOPICS, MSG, SUBMIT_FIELDS, TOPICS, validateSubmit,
  type FieldErrors, type FoundOn, type SubmitField, type SubmitForm, type WorkMode,
} from '../lib/validate'

const MODES: { value: WorkMode; label: string }[] = [
  { value: 'onsite', label: 'On site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
  { value: 'unknown', label: 'Not stated' },
]

type TextKey = 'organization' | 'title' | 'reference' | 'city' | 'country' | 'stipend' | 'start' | 'duration'

const GRID: { key: TextKey; label: string; required?: boolean; placeholder?: string; max: number; list?: string }[] = [
  { key: 'organization', label: 'Organization', required: true, max: LIMITS.organization },
  { key: 'title', label: 'Title, as posted', required: true, max: LIMITS.title },
  { key: 'reference', label: 'Reference, if the posting has one', max: LIMITS.reference },
  { key: 'city', label: 'City', max: LIMITS.city },
  { key: 'country', label: 'Country', max: LIMITS.country, list: 'country-list' },
  { key: 'stipend', label: 'Stipend, as written', placeholder: 'e.g. 1,500 €/month', max: LIMITS.stipend_text },
  { key: 'start', label: 'Start', placeholder: 'e.g. April 2027, flexible', max: LIMITS.start_text },
  { key: 'duration', label: 'Duration', placeholder: 'e.g. 5 to 6 months', max: LIMITS.duration_text },
]

const FIELD_IDS: Record<SubmitField, string> = {
  url: 'url', organization: 'org', title: 'title', reference: 'reference', city: 'city', country: 'country-input',
  stipend: 'stipend', deadline: 'deadline', start: 'start', duration: 'duration', topics: 'topics-first', notes: 'notes',
}

type Phase = 'editing' | 'checking' | 'sending' | 'done'

export default function Submit() {
  useMeta(
    'MVA Stages: add an offer',
    'Add a research internship offer you found to the MVA Stages board. It shows up right away, marked as unverified until a maintainer checks it.',
  )
  const data = useOffers()
  const [form, setForm] = useState<SubmitForm>(EMPTY_SUBMIT)
  const [errors, setErrors] = useState<FieldErrors<SubmitField>>({})
  const [phase, setPhase] = useState<Phase>('editing')
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)

  const countries = useMemo(() => (data.offers ? countryOptions(data.offers) : []), [data.offers])

  const set = <K extends keyof SubmitForm>(k: K, v: SubmitForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }))
    setDuplicate(null)
    setFormError(null)
  }

  const full = form.topics.length >= MAX_SUBMIT_TOPICS
  // Functional update: two quick clicks must not both read the same stale list.
  const toggleTopic = (t: string) => {
    setForm((f) => {
      const on = f.topics.includes(t)
      if (!on && f.topics.length >= MAX_SUBMIT_TOPICS) return f
      return { ...f, topics: on ? f.topics.filter((x) => x !== t) : [...f.topics, t] }
    })
    if (errors.topics) setErrors((e) => ({ ...e, topics: undefined }))
    setDuplicate(null)
    setFormError(null)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (phase !== 'editing') return
    const { errors: errs, row } = validateSubmit(form)
    setErrors(errs)
    setFormError(null)
    setDuplicate(null)
    if (!row) {
      const first = SUBMIT_FIELDS.find((k) => errs[k])
      if (first) document.getElementById(FIELD_IDS[first])?.focus()
      return
    }
    try {
      setPhase('checking')
      const dup = await findDuplicate({ url: form.url, organization: form.organization, reference: form.reference }, data.offers)
      if (dup) {
        setDuplicate(dup)
        setPhase('editing')
        return
      }
      setPhase('sending')
      const slug = await insertOffer(row)
      // Country only when it is a known one: never free text in analytics.
      const known = atomicCountries(row.country ?? '').find((c) => countries.some((o) => o.value === c)) ?? null
      trackOfferAdded(row.topics?.[0] ?? null, known)
      setCreatedSlug(slug)
      setPhase('done')
      window.scrollTo({ top: 0 })
      requestAnimationFrame(() => doneRef.current?.focus())
    } catch (err) {
      console.error('submit: could not add the offer', err)
      setFormError(err instanceof PersonalEmailError ? MSG.personalEmail : 'Could not send. Try again in a moment.')
      setPhase('editing')
    }
  }

  function again() {
    setForm(EMPTY_SUBMIT)
    setErrors({})
    setDuplicate(null)
    setFormError(null)
    setCreatedSlug(null)
    setPhase('editing')
    requestAnimationFrame(() => document.getElementById('url')?.focus())
  }

  const busy = phase === 'checking' || phase === 'sending'
  const urlOptional = linkOptional(form.foundOn)

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-form flex-col gap-5 px-6 pt-8 pb-16 outline-none">
      <div>
        <h1 className="m-0 mb-[6px] text-[30px] leading-[1.2] tracking-[-0.015em]">Add an offer</h1>
        <p className="m-0 text-muted">
          Found something that is not on the board? Paste the link and fill what the posting says. It shows up right away,
          marked as unverified until a maintainer checks it.
        </p>
      </div>

      <PrivacyNote />

      {phase === 'done' ? (
        <div role="status" className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-7 max-[480px]:p-5">
          <p ref={doneRef} tabIndex={-1} className="m-0 text-[18px] font-semibold text-ok-ink outline-none">
            Thanks, the offer is on the board.
          </p>
          <p className="m-0 text-muted">
            It shows as "Unverified · added by a student" until a maintainer checks it against the posting. To fix
            something later, use "Something is wrong" on the offer.
          </p>
          {createdSlug && (
            <p className="m-0">
              <Link to={`/offer/${encodeURIComponent(createdSlug)}`}>See your offer</Link>
            </p>
          )}
          <div className="flex flex-wrap gap-[10px]">
            <Link to="/" className="btn btn-dark">
              Back to the board
            </Link>
            <button type="button" className="btn btn-outline" onClick={again}>
              Add another
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          aria-busy={busy || undefined}
          className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-7 max-[480px]:p-5"
        >
          <p className="m-0 -mb-2 text-[13px] text-muted">
            <span aria-hidden="true" className="text-urgent">
              *
            </span>{' '}
            required
          </p>

          <Field
            id="url"
            label="Link to the posting"
            required={!urlOptional}
            error={errors.url}
            helper='The original page, not a repost. If it came as a PDF by mail, pick "Mailing list" below and leave this empty.'
          >
            {(a11y) => (
              <input
                {...a11y}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://"
                maxLength={LIMITS.url + 100}
                className="field"
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
              />
            )}
          </Field>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            {GRID.map((g) => (
              <Field key={g.key} id={FIELD_IDS[g.key]} label={g.label} required={g.required} error={errors[g.key]}>
                {(a11y) => (
                  <input
                    {...a11y}
                    type="text"
                    className="field"
                    placeholder={g.placeholder}
                    list={g.list}
                    maxLength={g.max + 50}
                    autoComplete="off"
                    value={form[g.key]}
                    onChange={(e) => set(g.key, e.target.value)}
                  />
                )}
              </Field>
            ))}
            <Field id="deadline" label="Deadline" error={errors.deadline}>
              {(a11y) => (
                <input
                  {...a11y}
                  type="date"
                  className="field"
                  value={form.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                />
              )}
            </Field>
          </div>
          <datalist id="country-list">
            {countries.map((c) => (
              <option key={c.value} value={c.value} />
            ))}
          </datalist>

          <ChoiceGroup
            name="work-mode"
            legend="Work mode"
            legendClass="text-[15px]"
            options={MODES}
            value={form.workMode}
            onChange={(v) => set('workMode', v)}
          />

          <fieldset className="m-0 border-0 p-0" aria-describedby={`topics-help${errors.topics ? ' topics-error' : ''}`}>
            <legend className="mb-1 font-semibold">Topics</legend>
            <p id="topics-help" className="m-0 mb-[10px] text-[13px] text-muted">
              Up to 3.
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {TOPICS.map((t, i) => {
                const on = form.topics.includes(t)
                const disabled = !on && full
                return (
                  <button
                    key={t}
                    id={i === 0 ? 'topics-first' : undefined}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    aria-disabled={disabled || undefined}
                    aria-describedby={disabled ? 'topics-help' : undefined}
                    onClick={() => toggleTopic(t)}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            {errors.topics && <FieldError id="topics-error">{errors.topics}</FieldError>}
          </fieldset>

          <Field id="source" label="Where you found it">
            {(a11y) => (
              <select
                {...a11y}
                className="field"
                value={form.foundOn}
                onChange={(e) => set('foundOn', e.target.value as FoundOn)}
              >
                {FOUND_ON.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field id="notes" label="Anything else useful" error={errors.notes}>
            {(a11y) => (
              <textarea
                {...a11y}
                rows={3}
                className="field"
                maxLength={LIMITS.notes + 100}
                placeholder="e.g. French B2 required; there is a twin posting in Grenoble"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            )}
          </Field>

          {duplicate && (
            <div role="alert" className="rounded-lg bg-warn-bg px-4 py-[14px] text-[14px] text-warn-ink">
              <strong>This offer is already on the board.</strong>{' '}
              <Link to={`/offer/${encodeURIComponent(duplicate.slug)}`} className="text-warn-ink hover:text-ink">
                See it: {duplicate.organization}, {duplicate.title}
              </Link>
            </div>
          )}
          {formError && <InlineError>{formError}</InlineError>}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" className="btn btn-primary px-5" disabled={busy}>
              {phase === 'checking' ? 'Checking...' : phase === 'sending' ? 'Adding...' : 'Add to the board'}
            </button>
            <span className="text-[13px] text-muted">We check for duplicates by link and reference.</span>
          </div>
        </form>
      )}
    </main>
  )
}
