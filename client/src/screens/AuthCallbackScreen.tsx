import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useGoogleSignInCallback } from '../hooks/useGoogleSignInCallback'

/** Google sends the browser here after sign-in. Shown only for the moment it takes to finish. */
export function AuthCallbackScreen() {
  useDocumentTitle('Signing in')
  useGoogleSignInCallback()

  return (
    <main className="flex flex-1 items-center justify-center text-fg-muted" aria-busy="true">
      Signing you in…
    </main>
  )
}
