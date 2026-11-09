import { isRouteErrorResponse, useRouteError } from 'react-router'
import Footer from './components/Footer'
import Header from './components/Header'

/** Last resort when a page crashes (for example a chunk that failed to load after a deploy). */
export default function RouteError() {
  const error = useRouteError()
  console.error(error)
  const status = isRouteErrorResponse(error) ? error.status : null
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Header />
      <main id="main" className="mx-auto w-full max-w-board flex-1 px-6 pt-8 pb-16">
        <div className="flex max-w-[640px] flex-col items-start gap-3 rounded-lg border border-line bg-surface p-7">
          <h1 className="m-0 text-[clamp(24px,6vw,30px)] leading-[1.2] tracking-[-0.015em]">
            {status === 404 ? 'This page does not exist' : 'Something went wrong'}
          </h1>
          <p className="m-0 text-muted">Reload the page, or go back to the board.</p>
          <div className="flex flex-wrap gap-[10px]">
            <button type="button" className="btn btn-dark" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a href="/" className="btn btn-outline">
              All offers
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
