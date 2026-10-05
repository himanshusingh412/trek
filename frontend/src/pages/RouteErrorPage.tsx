import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Seo } from '../components/Seo.tsx'

/**
 * Shown instead of the page when rendering it or loading its code fails (router.tsx errorElement), so a crash
 * never leaves a blank screen or React Router's developer page. It replaces the whole layout, because the
 * layout itself may be what failed.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (!notFound) console.error(error)

  return (
    <main className="min-h-dvh bg-paper-50 px-4 py-20 text-center font-plex">
      <Seo title={notFound ? 'Page not found' : 'Something went wrong'} noindex />
      <p className="text-sm font-medium tracking-wide text-pine-600">The Empty Valley</p>
      <h1 className="mt-3 font-serif text-3xl font-light tracking-tight text-ink-900">
        {notFound ? 'Page not found' : 'Something went wrong'}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
        {notFound
          ? 'The page you’re looking for doesn’t exist or has moved.'
          : 'This page didn’t load properly. Reloading usually fixes it.'}
      </p>
      <div className="mt-6 flex items-center justify-center gap-5 text-sm font-medium">
        {!notFound && (
          <button type="button" onClick={() => window.location.reload()} className="text-pine-600 hover:text-pine-700">
            Reload the page
          </button>
        )}
        {/* A full page load, not a client-side link: it starts the app afresh. */}
        <a href="/" className="text-pine-600 hover:text-pine-700">
          Back home
        </a>
      </div>
    </main>
  )
}
