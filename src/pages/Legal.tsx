import { useEffect } from 'react'
import { useLocation } from 'react-router'
import ContactForm from '../components/ContactForm'
import { useMeta } from '../lib/meta'
import { REPO_URL } from '../lib/site'

const section = 'rounded-lg border border-line bg-surface px-7 py-6 max-[480px]:px-5'
const h2 = 'm-0 mb-2 text-[18px] leading-[1.3]'

export default function Legal() {
  useMeta(
    'MVA Stages: legal notice and contact',
    'Legal notice of MVA Stages, how personal data is handled, and a form to remove or correct an offer.',
  )
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#contact') document.getElementById('contact')?.scrollIntoView()
  }, [hash])

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pt-8 pb-16 leading-[1.6] outline-none">
      <h1 className="m-0 mb-2 text-[30px] leading-[1.2] tracking-[-0.015em]">Legal notice and contact</h1>

      <section id="contact" aria-labelledby="contact-h" className={`${section} scroll-mt-4`}>
        <h2 id="contact-h" className={h2}>
          Remove or correct an offer
        </h2>
        <p className="m-0 mb-2">
          If you published one of these offers and want it changed or taken down, or you see your personal data here,
          use this form. We act within a few days.
        </p>
        <p className="m-0 text-ink-2">For a simple mistake, the "Something is wrong" button on each offer is faster.</p>
        <ContactForm />
      </section>

      <section className={section}>
        <h2 className={h2}>What this site is</h2>
        <p className="m-0 mb-2">
          A non-commercial index of research internship offers, kept by MVA students for other students. It is not a
          service of ENS Paris-Saclay or of the MVA program.
        </p>
        <p className="m-0">
          Each entry is a short summary written by us: organization, title, place, dates, stipend when the posting states
          it, and a link to the original. We do not copy the text of postings. The original posting is always what counts.
        </p>
        <p className="m-0 mt-2">
          The code and the list of offers are public on{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Personal data</h2>
        <p className="m-0 mb-2">
          There are no accounts and no tracking cookies. Offers and reports are stored without any information about who
          sent them. The contact form stores an email address only if you give one, to answer you, and it is never
          published.
        </p>
        <p className="m-0 mb-2">Anonymous, cookieless usage statistics by Vercel Web Analytics.</p>
        <p className="m-0">
          We never publish personal email addresses, only role addresses like jobs@ or recrutement@ when a posting gives
          one. A supervisor's name appears only when the public posting names them.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Publisher and host</h2>
        <dl className="m-0 grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-5 gap-y-[6px] max-[480px]:grid-cols-1 max-[480px]:gap-y-1">
          <dt className="text-muted max-[480px]:mt-2">Publisher</dt>
          <dd className="m-0">Private individual, non-professional site (art. 6-III-2 LCEN). Identity held by the host.</dd>
          <dt className="text-muted max-[480px]:mt-2">Host</dt>
          <dd className="m-0">
            Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States. No phone number is published;
            contact: privacy@vercel.com.
          </dd>
          <dt className="text-muted max-[480px]:mt-2">Database</dt>
          <dd className="m-0">
            Supabase (Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513), hosted on AWS
            eu-west-3 (Paris, France).
          </dd>
        </dl>
      </section>
    </main>
  )
}
