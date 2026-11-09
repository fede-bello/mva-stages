import { Analytics } from '@vercel/analytics/react'
import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import Footer from './components/Footer'
import Header from './components/Header'

function PageFallback() {
  return (
    <main id="main" className="mx-auto min-h-[60vh] max-w-board px-6 pt-8 pb-16" aria-busy="true">
      <p className="sr-only" role="status">
        Loading...
      </p>
    </main>
  )
}

export default function Root() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Sits over the dark header, so it uses the header's focus ring color. */}
      <a href="#main" className="sr-only-focusable btn btn-dark absolute top-2 left-2 z-10 focus-visible:outline-focus-on-dark">
        Skip to content
      </a>
      <Header />
      <div className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <ScrollRestoration />
      <Analytics />
    </div>
  )
}
