import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { Placeholder } from '../components/LoadState'
import { paths } from '../constants/routes'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { buttonClass, cn } from '../utils/ui'

/**
 * Shown instead of a screen that crashed while rendering (React Router's `errorElement`,
 * which works like an error boundary). The rest of the app keeps working.
 *
 * Errors inside event handlers and API calls don't land here: those already show a toast.
 */
export function ErrorScreen({ fullPage = false }: { fullPage?: boolean }) {
  const error = useRouteError()
  const isOutdated = isMissingCodeFile(error)
  useDocumentTitle(isOutdated ? 'New version available' : 'Something went wrong')

  useEffect(() => {
    // Keep the details for whoever is debugging (browser console / error reporting)
    console.error(error)
  }, [error])

  return (
    <main className={cn('flex flex-1 flex-col', fullPage && 'min-h-dvh')}>
      <Placeholder
        role="alert"
        headingLevel="h1"
        illustration="error"
        title={isOutdated ? 'A new version of Seenly is available' : 'Something went wrong'}
        message={
          isOutdated
            ? 'Reload to get the latest version.'
            : 'This screen ran into a problem. Reloading usually fixes it.'
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
              Reload
            </button>
            {/* A plain link (full page load), in case the app's own navigation is what broke */}
            {!isOutdated && (
              <a href={paths.home()} className={buttonClass('outline')}>
                Go to your collections
              </a>
            )}
          </div>
        }
      />
    </main>
  )
}

/**
 * After a new deploy, a tab opened earlier may ask for screen files that no longer exist.
 * Browsers word this differently, so we match the common messages.
 */
function isMissingCodeFile(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    message,
  )
}
