import { useState, type FormEvent } from 'react'
import { trackReportSent } from '../lib/analytics'
import { reportOffer } from '../lib/offers'
import { LIMITS, validateReport, type ReportKind } from '../lib/validate'
import { ChoiceGroup, Field } from './FormBits'
import { InlineError } from './Notes'

const KINDS: { value: ReportKind; label: string }[] = [
  { value: 'closed', label: 'It closed' },
  { value: 'wrong_info', label: 'Wrong info' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'other', label: 'Other' },
]

export default function ReportForm({ offerId, slug }: { offerId: string; slug: string }) {
  const [kind, setKind] = useState<ReportKind>('closed')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    const v = validateReport({ kind, message })
    if (v.error) {
      setFieldError(v.error)
      document.getElementById('msg')?.focus()
      return
    }
    setFieldError(null)
    setState('sending')
    try {
      await reportOffer(offerId, kind, v.message)
      trackReportSent(slug, kind)
      setState('sent')
    } catch (err) {
      console.error('report: could not send', err)
      setState('error')
    }
  }

  return (
    <section id="report" aria-labelledby="report-h" className="scroll-mt-4 rounded-lg border border-line bg-surface px-7 py-6 max-[480px]:px-5">
      <h2 id="report-h" className="m-0 mb-[6px] text-[18px]">
        Something is wrong?
      </h2>
      <p className="m-0 mb-4 text-muted">Tell us and a maintainer will fix it. Reports are anonymous.</p>
      {state === 'sent' ? (
        <p role="status" tabIndex={-1} ref={(el) => el?.focus()} className="outline-none m-0 rounded-sm bg-ok-bg px-4 py-[14px] font-medium text-ok-ink">
          Thanks, your report was sent.
        </p>
      ) : (
        <form className="flex flex-col gap-[14px]" onSubmit={submit} noValidate>
          <ChoiceGroup name="report-kind" legend="What is wrong" options={KINDS} value={kind} onChange={setKind} />
          <Field id="msg" label="Details (optional)" labelClass="text-[13px] font-semibold" error={fieldError ?? undefined}>
            {(a11y) => (
              <textarea
                {...a11y}
                rows={3}
                maxLength={LIMITS.message + 200}
                className="field field-sm"
                placeholder="e.g. the posting now says the deadline is 15 December"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-col items-start gap-3">
            <button type="submit" className="btn btn-dark" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending...' : 'Send report'}
            </button>
            {state === 'error' && <InlineError>Could not send. Try again in a moment.</InlineError>}
          </div>
        </form>
      )}
    </section>
  )
}
