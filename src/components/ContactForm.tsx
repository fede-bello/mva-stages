import { useState, type FormEvent } from 'react'
import { sendContact } from '../lib/offers'
import { LIMITS, validateContact, type ContactField, type ContactForm as Form, type ContactKind, type FieldErrors } from '../lib/validate'
import { ChoiceGroup, Field } from './FormBits'
import { InlineError } from './Notes'

const KINDS: { value: ContactKind; label: string }[] = [
  { value: 'remove', label: 'Remove an offer' },
  { value: 'correct', label: 'Correct an offer' },
  { value: 'personal_data', label: 'My personal data' },
  { value: 'other', label: 'Other' },
]

const EMPTY: Form = { kind: 'remove', offerUrl: '', message: '', replyEmail: '' }
const ORDER: ContactField[] = ['offerUrl', 'message', 'replyEmail']
const IDS: Record<ContactField, string> = { kind: 'contact-kind', offerUrl: 'contact-url', message: 'contact-msg', replyEmail: 'contact-email' }

export default function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors<ContactField>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    const { errors: errs, row } = validateContact(form)
    setErrors(errs)
    if (!row) {
      const first = ORDER.find((k) => errs[k])
      if (first) document.getElementById(IDS[first])?.focus()
      return
    }
    setState('sending')
    try {
      await sendContact(row as typeof row & { kind: ContactKind })
      setState('sent')
    } catch (err) {
      console.error('contact: could not send', err)
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p role="status" tabIndex={-1} ref={(el) => el?.focus()} className="outline-none m-0 mt-4 rounded-sm bg-ok-bg px-4 py-[14px] font-medium text-ok-ink">
        Thanks, we got your request.
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-[14px] leading-normal">
      <ChoiceGroup name="contact-kind" legend="What do you need" options={KINDS} value={form.kind} onChange={(v) => set('kind', v)} />
      <Field id={IDS.offerUrl} label="Link to the offer on this board (optional)" labelClass="text-[13px] font-semibold" error={errors.offerUrl}>
        {(a11y) => (
          <input
            {...a11y}
            type="url"
            inputMode="url"
            placeholder="https://"
            className="field field-sm"
            maxLength={LIMITS.url + 100}
            value={form.offerUrl}
            onChange={(e) => set('offerUrl', e.target.value)}
          />
        )}
      </Field>
      <Field id={IDS.message} label="Message" required labelClass="text-[13px] font-semibold" error={errors.message}>
        {(a11y) => (
          <textarea
            {...a11y}
            rows={4}
            className="field field-sm"
            maxLength={LIMITS.message + 200}
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
          />
        )}
      </Field>
      <Field
        id={IDS.replyEmail}
        label="Email for a reply (optional)"
        labelClass="text-[13px] font-semibold"
        error={errors.replyEmail}
        helper="Only used to answer you, never published."
      >
        {(a11y) => (
          <input
            {...a11y}
            type="email"
            autoComplete="email"
            className="field field-sm"
            maxLength={LIMITS.reply_email + 50}
            value={form.replyEmail}
            onChange={(e) => set('replyEmail', e.target.value)}
          />
        )}
      </Field>
      <div className="flex flex-col items-start gap-3">
        <button type="submit" className="btn btn-dark" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending...' : 'Send'}
        </button>
        {state === 'error' && <InlineError>Could not send. Try again in a moment.</InlineError>}
      </div>
    </form>
  )
}
