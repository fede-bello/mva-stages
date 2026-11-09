import { describe, expect, it } from 'vitest'
import {
  EMPTY_SUBMIT, isDriveUrl, isHttpUrl, MSG, normalizeUrl, personalEmails, urlVariants, validateContact,
  validateReport, validateSubmit, type SubmitForm,
} from './validate'

const form = (p: Partial<SubmitForm>): SubmitForm => ({ ...EMPTY_SUBMIT, url: 'https://jobs.example.com/1', organization: 'Org', title: 'Intern', ...p })

describe('urls', () => {
  it('mirrors the ^https?:// check', () => {
    expect(isHttpUrl('https://a.com')).toBe(true)
    expect(isHttpUrl('HTTP://a.com/x')).toBe(true)
    expect(isHttpUrl('ftp://a.com')).toBe(false)
    expect(isHttpUrl('a.com')).toBe(false)
  })

  it('detects Drive links', () => {
    expect(isDriveUrl('https://drive.google.com/file/d/x')).toBe(true)
    expect(isDriveUrl('https://docs.google.com/document/d/x')).toBe(true)
    expect(isDriveUrl('https://google.com')).toBe(false)
  })

  it('normalizes for duplicates', () => {
    expect(normalizeUrl('https://WWW.Example.com/jobs/1/?utm_source=x&b=2#top')).toBe('https://example.com/jobs/1?b=2')
    expect(normalizeUrl('http://example.com/jobs/1')).toBe(normalizeUrl('https://example.com/jobs/1/'))
    expect(urlVariants('https://a.com/x/')).toContain('https://a.com/x')
  })
})

describe('personal emails', () => {
  it('allows role addresses only', () => {
    expect(personalEmails('Apply at jobs@edf.fr or recrutement@inria.fr')).toEqual([])
    expect(personalEmails('write to talent-recruiting@x.com, internships@y.org, ai-stages@z.fr')).toEqual([])
    expect(personalEmails('contact jean.dupont@inria.fr')).toEqual(['jean.dupont@inria.fr'])
    expect(personalEmails('Marie@lab.fr')).toEqual(['Marie@lab.fr'])
    expect(personalEmails(null)).toEqual([])
  })
})

describe('submit', () => {
  it('requires link, organization and title', () => {
    const { errors } = validateSubmit(form({ url: '', organization: ' ', title: '' }))
    expect(errors).toEqual({ url: MSG.urlRequired, organization: MSG.organization, title: MSG.title })
  })

  it('makes the link optional for Mailing list and MVA Drive, and rejects Drive links', () => {
    expect(validateSubmit(form({ url: '', foundOn: 'mailing_list' })).errors).toEqual({})
    expect(validateSubmit(form({ url: '', foundOn: 'mva_drive' })).errors).toEqual({})
    expect(validateSubmit(form({ url: 'https://drive.google.com/x', foundOn: 'mva_drive' })).errors.url).toBe(MSG.drive)
    expect(validateSubmit(form({ url: 'www.a.com' })).errors.url).toBe(MSG.url)
  })

  it('enforces the migration lengths', () => {
    expect(validateSubmit(form({ organization: 'x'.repeat(201) })).errors.organization).toBe(MSG.tooLong(200))
    expect(validateSubmit(form({ title: 'x'.repeat(301) })).errors.title).toBe(MSG.tooLong(300))
    expect(validateSubmit(form({ city: 'x'.repeat(121) })).errors.city).toBe(MSG.tooLong(120))
    expect(validateSubmit(form({ country: 'x'.repeat(81) })).errors.country).toBe(MSG.tooLong(80))
    expect(validateSubmit(form({ duration: 'x'.repeat(121) })).errors.duration).toBe(MSG.tooLong(120))
    expect(validateSubmit(form({ reference: 'x'.repeat(121) })).errors.reference).toBe(MSG.tooLong(120))
    expect(validateSubmit(form({ notes: 'x'.repeat(2000) })).errors.notes).toBeDefined()
    expect(validateSubmit(form({ deadline: '2026-02-30' })).errors.deadline).toBe(MSG.date)
    expect(validateSubmit(form({ topics: ['llm', 'rl', 'nlp', 'other'] })).errors.topics).toBeDefined()
  })

  it('blocks personal emails in any field', () => {
    expect(validateSubmit(form({ notes: 'ask paul.martin@lab.fr' })).errors.notes).toBe(MSG.personalEmail)
    expect(validateSubmit(form({ notes: 'send CV to stages@lab.fr' })).errors).toEqual({})
  })

  it('builds the row with the source note first in notes', () => {
    const { row } = validateSubmit(form({ foundOn: 'linkedin', notes: ' French B2 ', city: ' ', topics: ['llm'], workMode: 'hybrid' }))
    expect(row).toMatchObject({
      organization: 'Org', title: 'Intern', apply_url: 'https://jobs.example.com/1', source_url: 'https://jobs.example.com/1',
      city: null, notes: 'Found on: LinkedIn.\nFrench B2', topics: ['llm'], work_mode: 'hybrid', status: 'open',
    })
  })
})

describe('report and contact', () => {
  it('validates the report', () => {
    expect(validateReport({ kind: 'closed', message: '  ' })).toEqual({ error: null, message: null })
    expect(validateReport({ kind: 'closed', message: 'x'.repeat(2001) }).error).toBe(MSG.tooLong(2000))
  })

  it('validates the contact request', () => {
    expect(validateContact({ kind: 'remove', offerUrl: '', message: '', replyEmail: '' }).errors).toEqual({ message: MSG.message })
    expect(validateContact({ kind: 'other', offerUrl: 'x', message: 'hi', replyEmail: 'nope' }).errors).toEqual({ offerUrl: MSG.url, replyEmail: MSG.email })
    expect(validateContact({ kind: 'correct', offerUrl: '', message: ' fix ', replyEmail: 'a@b.co' }).row).toEqual({
      kind: 'correct', offer_url: null, message: 'fix', reply_email: 'a@b.co',
    })
  })
})
